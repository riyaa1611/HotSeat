from fastapi import APIRouter, HTTPException
from app.models.schemas import ParseRepoRequest, ParseRepoResponse
from app.services.repo_parser import parse_repo
from app.services.context_builder import build_context

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


@router.post("/parse-repo", response_model=ParseRepoResponse)
async def parse_repo_endpoint(request: ParseRepoRequest):
    try:
        parsed = await parse_repo(request.repo_url)
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
