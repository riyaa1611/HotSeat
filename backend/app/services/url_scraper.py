import re
import socket
import ipaddress
import httpx
from urllib.parse import urlparse

_BLOCKED_NETS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / cloud metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def _assert_safe_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Blocked scheme: {parsed.scheme!r}")
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("No hostname in URL")
    try:
        addr = ipaddress.ip_address(socket.gethostbyname(hostname))
    except socket.gaierror as exc:
        raise ValueError(f"Cannot resolve host: {hostname}") from exc
    for net in _BLOCKED_NETS:
        if addr in net:
            raise ValueError(f"Blocked private/internal address: {addr}")

URL_TECH_SIGNALS = {
    "react": "React", "vue": "Vue", "angular": "Angular",
    "next.js": "Next.js", "nextjs": "Next.js", "nuxt": "Nuxt",
    "svelte": "Svelte", "tailwind": "Tailwind CSS", "bootstrap": "Bootstrap",
    "vercel": "Vercel", "netlify": "Netlify", "railway": "Railway",
    "supabase": "Supabase", "firebase": "Firebase", "stripe": "Stripe",
    "fastapi": "FastAPI", "django": "Django", "flask": "Flask",
    "express": "Express", "graphql": "GraphQL", "typescript": "TypeScript",
    "python": "Python", "node": "Node.js", "postgres": "PostgreSQL",
}


def _extract_meta(html: str, name: str) -> str:
    pattern = rf'<meta[^>]+(?:name|property)=["\'](?:og:)?{re.escape(name)}["\'][^>]+content=["\']([^"\']*)["\']'
    m = re.search(pattern, html, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    pattern2 = rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:name|property)=["\'](?:og:)?{re.escape(name)}["\']'
    m2 = re.search(pattern2, html, re.IGNORECASE)
    return m2.group(1).strip() if m2 else ""


def _extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
    return m.group(1).strip() if m else ""


def _extract_headings(html: str) -> list[str]:
    tags = re.findall(r"<h[123][^>]*>(.*?)</h[123]>", html, re.IGNORECASE | re.DOTALL)
    clean = [re.sub(r"<[^>]+>", "", t).strip() for t in tags]
    return [h for h in clean if h][:10]


def _extract_visible_text(html: str) -> str:
    no_scripts = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
    no_tags = re.sub(r"<[^>]+>", " ", no_scripts)
    collapsed = re.sub(r"\s+", " ", no_tags).strip()
    return collapsed[:3000]


def _detect_tech(html: str, url: str) -> list[str]:
    combined = (html + " " + url).lower()
    return [label for kw, label in URL_TECH_SIGNALS.items() if kw in combined]


def _extract_github_link(html: str) -> str | None:
    matches = re.findall(r'https://github\.com/[^/"\'>\s]+/[^/"\'>\s]+', html)
    for m in matches:
        cleaned = m.rstrip(".,;)")
        # skip github.com/org or github.com/user links without a repo path segment
        parts = cleaned.replace("https://github.com/", "").split("/")
        if len(parts) >= 2 and parts[1]:
            return f"https://github.com/{parts[0]}/{parts[1]}"
    return None


async def scrape_url(project_url: str) -> dict:
    _assert_safe_url(project_url)

    parsed = urlparse(project_url)
    domain = parsed.netloc or parsed.path
    project_name = domain.replace("www.", "").split(".")[0].title()

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; HotSeat/1.0)",
        "Accept": "text/html",
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=False) as client:
        resp = await client.get(project_url, headers=headers)
        # Follow one redirect, but validate the target first
        if resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get("location", "")
            _assert_safe_url(location)
            resp = await client.get(location, headers=headers)
        resp.raise_for_status()
        html = resp.text

    title = _extract_meta(html, "og:title") or _extract_title(html) or project_name
    description = _extract_meta(html, "description") or _extract_meta(html, "og:description") or ""
    headings = _extract_headings(html)
    visible = _extract_visible_text(html)
    tech_stack = _detect_tech(html, project_url)

    readme = f"""# {title}

**URL:** {project_url}

## Description
{description or "No description found."}

## Page Headings
{chr(10).join(f"- {h}" for h in headings) if headings else "- (none found)"}

## Page Content (excerpt)
{visible[:2000]}
"""

    github_url = _extract_github_link(html)

    return {
        "repo_name": title,
        "owner": domain,
        "readme": readme,
        "file_tree": [],
        "key_files": {},
        "source_type": "url",
        "project_url": project_url,
        "tech_stack": tech_stack,
        "github_url": github_url,
    }
