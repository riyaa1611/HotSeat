import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user
from app.models.database import get_pool

router = APIRouter()
logger = logging.getLogger(__name__)


class ActivityDay(BaseModel):
    date: str
    count: int


class ScorePoint(BaseModel):
    date: str
    score: int
    persona: str


class ProfileStats(BaseModel):
    display_name: str
    bio: str
    job_title: str
    company: str
    location: str
    linkedin_url: str
    github_url: str
    total_sessions: int
    avg_score: Optional[float]
    best_score: Optional[int]
    sessions_this_week: int
    most_used_persona: Optional[str]
    activity_data: list[ActivityDay]
    score_history: list[ScorePoint]


class UpdateProfileBody(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


async def _get_user_profile_row(conn, user_id: str) -> dict:
    async with await conn.execute(
        "SELECT display_name, bio, job_title, company, location, linkedin_url, github_url FROM public.user_profiles WHERE user_id = %s",
        (user_id,),
    ) as cur:
        row = await cur.fetchone()
    if row:
        return {
            "display_name": row[0] or "",
            "bio": row[1] or "",
            "job_title": row[2] or "",
            "company": row[3] or "",
            "location": row[4] or "",
            "linkedin_url": row[5] or "",
            "github_url": row[6] or "",
        }
    return {"display_name": "", "bio": "", "job_title": "", "company": "", "location": "", "linkedin_url": "", "github_url": ""}


async def _fetch_profile_stats(user_id: str) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        profile_row = await _get_user_profile_row(conn, user_id)

        async with await conn.execute(
            """
            SELECT persona, report, ended_at, started_at
            FROM public.sessions
            WHERE user_id = %s
            ORDER BY started_at ASC
            """,
            (user_id,),
        ) as cur:
            rows = await cur.fetchall()

    if not rows:
        return {
            **profile_row,
            "total_sessions": 0,
            "avg_score": None,
            "best_score": None,
            "sessions_this_week": 0,
            "most_used_persona": None,
            "activity_data": [],
            "score_history": [],
        }

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    year_ago = datetime.now(timezone.utc) - timedelta(days=365)

    completed: list[int] = []
    sessions_this_week = 0
    persona_counts: dict[str, int] = {}
    activity_map: dict[str, int] = {}
    score_history: list[dict] = []

    # display_name fallback: prefer user_profiles, then sessions
    display_name = profile_row["display_name"]

    for row in rows:
        persona = row[0]
        report_raw = row[1]
        ended_at = row[2]
        started_at = row[3]

        persona_counts[persona] = persona_counts.get(persona, 0) + 1

        started_dt = None
        try:
            started_dt = datetime.fromisoformat(started_at)
            if started_dt.tzinfo is None:
                started_dt = started_dt.replace(tzinfo=timezone.utc)
            if started_dt >= week_ago:
                sessions_this_week += 1
            if started_dt >= year_ago:
                date_key = started_dt.strftime("%Y-%m-%d")
                activity_map[date_key] = activity_map.get(date_key, 0) + 1
        except Exception:
            pass

        if report_raw and ended_at:
            try:
                report = json.loads(report_raw) if isinstance(report_raw, str) else report_raw
                overall = report.get("overall")
                if overall is not None:
                    completed.append(int(overall))
                    score_date = (started_dt.strftime("%Y-%m-%d") if started_dt else ended_at[:10])
                    score_history.append({"date": score_date, "score": int(overall), "persona": persona})
            except Exception:
                pass

    avg_score = round(sum(completed) / len(completed), 1) if completed else None
    best_score = max(completed) if completed else None
    most_used = max(persona_counts, key=persona_counts.get) if persona_counts else None

    activity_data = [{"date": d, "count": c} for d, c in sorted(activity_map.items())]

    # If user_profiles has no display_name, fall back to the most recent session's display_name
    if not display_name:
        # rows is ASC, get last
        async with pool.connection() as conn2:
            async with await conn2.execute(
                "SELECT display_name FROM public.sessions WHERE user_id = %s AND display_name IS NOT NULL AND display_name != '' ORDER BY started_at DESC LIMIT 1",
                (user_id,),
            ) as cur:
                r = await cur.fetchone()
                if r:
                    display_name = r[0] or ""

    return {
        **profile_row,
        "display_name": display_name,
        "total_sessions": len(rows),
        "avg_score": avg_score,
        "best_score": best_score,
        "sessions_this_week": sessions_this_week,
        "most_used_persona": most_used,
        "activity_data": activity_data,
        "score_history": score_history,
    }


@router.get("/user/profile", response_model=ProfileStats)
async def get_profile(request: Request, user_id: str = Depends(get_current_user)):
    stats = await _fetch_profile_stats(user_id)
    return ProfileStats(**stats)


@router.patch("/user/profile")
async def update_profile(
    body: UpdateProfileBody,
    request: Request,
    user_id: str = Depends(get_current_user),
):
    pool = await get_pool()
    now = datetime.now(timezone.utc).isoformat()

    updates = {}
    if body.display_name is not None:
        updates["display_name"] = body.display_name.strip()[:80]
    if body.bio is not None:
        updates["bio"] = body.bio.strip()[:500]
    if body.job_title is not None:
        updates["job_title"] = body.job_title.strip()[:120]
    if body.company is not None:
        updates["company"] = body.company.strip()[:120]
    if body.location is not None:
        updates["location"] = body.location.strip()[:120]
    if body.linkedin_url is not None:
        updates["linkedin_url"] = body.linkedin_url.strip()[:300]
    if body.github_url is not None:
        updates["github_url"] = body.github_url.strip()[:300]

    if not updates:
        return {"status": "ok"}

    updates["updated_at"] = now

    cols = ", ".join(f"{k} = %s" for k in updates)
    vals = list(updates.values()) + [user_id]

    async with pool.connection() as conn:
        # Try update first, then insert if not exists
        async with await conn.execute(
            f"UPDATE public.user_profiles SET {cols} WHERE user_id = %s",
            vals,
        ) as cur:
            affected = cur.rowcount

        if affected == 0:
            fields = ["user_id"] + list(updates.keys())
            placeholders = ", ".join(["%s"] * len(fields))
            field_names = ", ".join(fields)
            insert_vals = [user_id] + list(updates.values())
            await conn.execute(
                f"INSERT INTO public.user_profiles ({field_names}) VALUES ({placeholders}) ON CONFLICT (user_id) DO NOTHING",
                insert_vals,
            )

    # Also sync display_name to sessions table for leaderboard
    if body.display_name is not None:
        async with pool.connection() as conn:
            await conn.execute(
                "UPDATE public.sessions SET display_name = %s WHERE user_id = %s",
                (body.display_name.strip()[:80], user_id),
            )

    return {"status": "ok"}
