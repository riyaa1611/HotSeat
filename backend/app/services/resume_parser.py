import re
import asyncio
import pdfplumber
import httpx
from io import BytesIO
from app.config import get_settings

RESUME_CHAR_CAP = 4000
TOP_REPOS = 10

# Patterns that suggest prompt injection attempts in PDF content
_INJECTION_PATTERN = re.compile(
    r"(ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|"
    r"^(system|assistant|user)\s*:|"
    r"you\s+are\s+now|"
    r"new\s+instructions?:|"
    r"<\s*(system|instructions?|prompt)\s*>)",
    re.IGNORECASE | re.MULTILINE,
)


def _sanitize_resume_text(text: str) -> str:
    # Strip null bytes and non-printable control characters (keep newlines/tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Remove lines that look like prompt injection
    clean_lines = []
    for line in text.splitlines():
        if _INJECTION_PATTERN.search(line):
            clean_lines.append("[redacted]")
        else:
            clean_lines.append(line)
    return "\n".join(clean_lines)


def _extract_github_username(github_url: str) -> str:
    url = github_url.strip().rstrip("/")
    parts = url.split("github.com/")
    if len(parts) > 1:
        return parts[-1].split("/")[0]
    return url.split("/")[-1]


async def parse_resume_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"
    text = _sanitize_resume_text(text)
    return text[:RESUME_CHAR_CAP].strip()


async def _do_fetch_github(username: str, headers: dict) -> dict:
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        user_resp = await client.get(f"https://api.github.com/users/{username}")
        user_resp.raise_for_status()
        user = user_resp.json()

        repos_resp = await client.get(
            f"https://api.github.com/users/{username}/repos",
            params={"sort": "pushed", "direction": "desc", "per_page": TOP_REPOS},
        )
        repos = repos_resp.json() if repos_resp.status_code == 200 else []

    return {
        "username": username,
        "bio": user.get("bio") or "",
        "top_repos": [
            {
                "name": r["name"],
                "description": r.get("description") or "",
                "language": r.get("language") or "",
                "stars": r.get("stargazers_count", 0),
                "pushed_at": (r.get("pushed_at") or "")[:10],
            }
            for r in repos[:TOP_REPOS]
            if not r.get("fork")
        ],
    }


async def fetch_github_profile(github_url: str) -> dict:
    username = _extract_github_username(github_url)
    token = get_settings().github_token
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    last_exc: Exception = RuntimeError("GitHub fetch failed")
    for attempt in range(3):
        try:
            return await _do_fetch_github(username, headers)
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            last_exc = exc
            if attempt < 2:
                await asyncio.sleep(1.0 * (attempt + 1))
    raise last_exc
