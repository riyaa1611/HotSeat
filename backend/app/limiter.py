from fastapi import Request
from slowapi import Limiter


def _user_key(request: Request) -> str:
    # bucket by session token so limits are per-user, not per-IP
    token = request.cookies.get("hotseat_session", "")
    return token or (request.client.host if request.client else "unknown")


limiter = Limiter(key_func=_user_key)
