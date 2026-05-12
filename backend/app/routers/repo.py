from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.schemas import ParseRepoRequest, ParseRepoResponse, ParseUrlRequest
from app.services.repo_parser import parse_repo
from app.services.url_scraper import scrape_url
from app.services.context_builder import build_context
from app.auth import get_current_user
from app.limiter import limiter

router = APIRouter()

TECH_KEYWORDS = {
    "react": "React", "vue": "Vue", "angular": "Angular",
    "next": "Next.js", "fastapi": "FastAPI", "django": "Django",
    "flask": "Flask", "express": "Express", "pytorch": "PyTorch",
    "tensorflow": "TensorFlow", "docker": "Docker", "kubernetes": "Kubernetes",
    "typescript": "TypeScript", "python": "Python", "rust": "Rust", "go": "Go",
    "postgres": "PostgreSQL", "mysql": "MySQL", "redis": "Redis",
    "tailwind": "Tailwind CSS", "graphql": "GraphQL",
}


def detect_tech_stack(parsed: dict) -> list[str]:
    text = " ".join([
        parsed["readme"].lower(),
        " ".join(parsed["file_tree"]).lower(),
        " ".join(parsed["key_files"].values()).lower(),
    ])
    return [label for keyword, label in TECH_KEYWORDS.items() if keyword in text]


@router.post("/parse-url", response_model=ParseRepoResponse)
@limiter.limit("20/minute")
async def parse_url_endpoint(request: Request, body: ParseUrlRequest, _: str = Depends(get_current_user)):
    try:
        scraped = await scrape_url(body.project_url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {str(e)}")

    github_url = scraped.get("github_url")
    if github_url:
        try:
            parsed = await parse_repo(github_url)
            if body.description:
                parsed["readme"] += f"\n\n## User Description\n{body.description}"
            context = build_context(parsed)
            tech_stack = detect_tech_stack(parsed)
            return ParseRepoResponse(
                repo_name=parsed["repo_name"],
                owner=parsed["owner"],
                file_count=len(parsed["file_tree"]),
                tech_stack=tech_stack,
                context_preview=context[:500],
            )
        except Exception:
            pass  # fall through to scraped content

    if body.description:
        scraped["readme"] += f"\n\n## User Description\n{body.description}"

    context = build_context(scraped)
    tech_stack = scraped.get("tech_stack", []) or _detect_tech_from_html(scraped["readme"])

    return ParseRepoResponse(
        repo_name=scraped["repo_name"],
        owner=scraped["owner"],
        file_count=0,
        tech_stack=tech_stack,
        context_preview=context[:500],
    )


def _detect_tech_from_html(text: str) -> list[str]:
    text_lower = text.lower()
    return [label for keyword, label in TECH_KEYWORDS.items() if keyword in text_lower]


@router.post("/parse-repo", response_model=ParseRepoResponse)
@limiter.limit("20/minute")
async def parse_repo_endpoint(request: Request, body: ParseRepoRequest, _: str = Depends(get_current_user)):
    try:
        parsed = await parse_repo(body.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch repo: {str(e)}")

    context = build_context(parsed)
    tech_stack = detect_tech_stack(parsed)

    return ParseRepoResponse(
        repo_name=parsed["repo_name"],
        owner=parsed["owner"],
        file_count=len(parsed["file_tree"]),
        tech_stack=tech_stack,
        context_preview=context[:500],
    )
