from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routers import repo, session, report
from app import auth as auth_module
from app.models.database import init_db
from app.config import get_settings
from app.limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


_settings = get_settings()
app = FastAPI(
    title="HotSeat API",
    lifespan=lifespan,
    docs_url="/docs" if _settings.enable_docs else None,
    redoc_url="/redoc" if _settings.enable_docs else None,
    openapi_url="/openapi.json" if _settings.enable_docs else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[_settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_module.router, prefix="/api")
app.include_router(repo.router, prefix="/api")
app.include_router(session.router, prefix="/api")
app.include_router(report.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
