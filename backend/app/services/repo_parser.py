import re
import httpx
from app.config import get_settings

PRIORITY_FILES = [
    "package.json", "requirements.txt", "pyproject.toml",
    "Dockerfile", "docker-compose.yml", ".env.example",
    "setup.py", "go.mod", "Cargo.toml",
]


def extract_owner_repo(repo_url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub URL."""
    pattern = r"https://github\.com/([^/]+)/([^/]+?)(?:/.*)?$"
    match = re.match(pattern, repo_url.rstrip("/"))
    if not match:
        raise ValueError(f"Invalid GitHub URL: {repo_url}")
    return match.group(1), match.group(2)


async def parse_repo(repo_url: str) -> dict:
    owner, repo = extract_owner_repo(repo_url)
    settings = get_settings()
    base = f"https://api.github.com/repos/{owner}/{repo}"

    headers = {"Accept": "application/vnd.github.raw"}
    if settings.github_token:
        headers["Authorization"] = f"token {settings.github_token}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. README
        readme_resp = await client.get(f"{base}/readme", headers=headers)
        readme = readme_resp.text[:4000] if readme_resp.status_code == 200 else "No README found."

        # 2. File tree — try main, fallback to master
        tree_resp = await client.get(
            f"{base}/git/trees/main?recursive=1",
            headers={**headers, "Accept": "application/vnd.github+json"},
        )
        if tree_resp.status_code != 200:
            tree_resp = await client.get(
                f"{base}/git/trees/master?recursive=1",
                headers={**headers, "Accept": "application/vnd.github+json"},
            )
        raw_tree = tree_resp.json().get("tree", []) if tree_resp.status_code == 200 else []
        file_tree = [f["path"] for f in raw_tree if f["type"] == "blob"][:200]

        # 3. Key files
        key_files = {}
        for fname in PRIORITY_FILES:
            resp = await client.get(f"{base}/contents/{fname}", headers=headers)
            if resp.status_code == 200:
                key_files[fname] = resp.text[:2000]

    return {
        "readme": readme,
        "file_tree": file_tree,
        "key_files": key_files,
        "repo_name": repo,
        "owner": owner,
    }
