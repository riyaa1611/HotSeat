import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from app.config import get_settings
from app.limiter import limiter

router = APIRouter()

_COOKIE = "hotseat_session"
_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


async def get_current_user(request: Request) -> str:
    if request.headers.get("X-Requested-With") != "XMLHttpRequest":
        raise HTTPException(status_code=403, detail="Forbidden")
    token = request.cookies.get(_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    settings = get_settings()
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=503, detail="Auth service timeout. Please try again.")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    data = resp.json()
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


class _TokenBody(BaseModel):
    access_token: str


async def _validate_token(token: str) -> None:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=503, detail="Auth service timeout. Please try again.")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")


def _cookie_kwargs(secure: bool) -> dict:
    return {"httponly": True, "secure": secure, "samesite": "none" if secure else "lax"}


@router.post("/auth/session")
@limiter.limit("20/minute")
async def set_session(body: _TokenBody, request: Request, response: Response):
    """Frontend calls after Supabase login to store token in httpOnly cookie."""
    if request.headers.get("X-Requested-With") != "XMLHttpRequest":
        raise HTTPException(status_code=403, detail="Forbidden")
    await _validate_token(body.access_token)
    settings = get_settings()
    response.set_cookie(
        key=_COOKIE,
        value=body.access_token,
        max_age=_COOKIE_MAX_AGE,
        **_cookie_kwargs(settings.cookie_secure),
    )
    return {"status": "ok"}


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    if request.headers.get("X-Requested-With") != "XMLHttpRequest":
        raise HTTPException(status_code=403, detail="Forbidden")
    settings = get_settings()
    response.delete_cookie(key=_COOKIE, **_cookie_kwargs(settings.cookie_secure))
    return {"status": "ok"}
