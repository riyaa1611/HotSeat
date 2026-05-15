import json
import logging
from datetime import datetime
from psycopg_pool import AsyncConnectionPool
from app.config import get_settings

_pool: AsyncConnectionPool | None = None
_sessions_columns_cache: set[str] | None = None
logger = logging.getLogger(__name__)


async def _get_sessions_columns(conn) -> set[str]:
    global _sessions_columns_cache
    if _sessions_columns_cache is not None:
        return _sessions_columns_cache
    async with await conn.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sessions'
        """
    ) as cur:
        rows = await cur.fetchall()
    _sessions_columns_cache = {r[0] for r in rows}
    return _sessions_columns_cache


async def get_pool() -> AsyncConnectionPool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = AsyncConnectionPool(
            settings.database_url,
            open=False,
            min_size=1,
            max_size=5,
            kwargs={"prepare_threshold": None, "sslmode": "require"},
        )
        await _pool.open(wait=True, timeout=15)
    return _pool


async def init_db():
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS public.sessions (
                session_id TEXT PRIMARY KEY,
                persona TEXT NOT NULL,
                repo_url TEXT NOT NULL,
                messages TEXT NOT NULL,
                turn_count INTEGER DEFAULT 0,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                report TEXT,
                user_id TEXT,
                display_name TEXT
            )
        """)
        await conn.execute("ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_id TEXT")
        await conn.execute("ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS feedback TEXT")
        await conn.execute("ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS display_name TEXT")
        await conn.execute("ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY")
        # Idempotent policy: authenticated users see only their own rows
        await conn.execute("""
            DO $$ BEGIN
              CREATE POLICY sessions_user_select ON public.sessions
                FOR SELECT TO authenticated
                USING (auth.uid()::text = user_id);
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$
        """)
        # Enable realtime replication for in-session live updates
        try:
            await conn.execute(
                "ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions"
            )
        except Exception:
            pass  # Already added or insufficient privilege — non-fatal

        cols = await _get_sessions_columns(conn)
        required = {"session_id", "persona", "repo_url", "messages", "started_at"}
        optional = {"display_name", "feedback", "report", "ended_at", "turn_count", "user_id"}
        missing_required = sorted(required - cols)
        missing_optional = sorted(optional - cols)
        if missing_required:
            logger.error("public.sessions is missing required columns: %s", ", ".join(missing_required))
        if missing_optional:
            logger.warning(
                "public.sessions missing optional columns; compatibility mode active: %s",
                ", ".join(missing_optional),
            )


async def save_session(session_id: str, persona: str, repo_url: str, messages: list, turn_count: int, user_id: str = "", display_name: str = ""):
    pool = await get_pool()
    async with pool.connection() as conn:
        cols = await _get_sessions_columns(conn)
        if "display_name" in cols:
            await conn.execute(
                """
                INSERT INTO public.sessions (session_id, persona, repo_url, messages, turn_count, started_at, user_id, display_name)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (session_id) DO UPDATE SET
                    messages = EXCLUDED.messages,
                    turn_count = EXCLUDED.turn_count
                """,
                (session_id, persona, repo_url, json.dumps(messages), turn_count, datetime.now().isoformat(), user_id, display_name),
            )
        else:
            await conn.execute(
                """
                INSERT INTO public.sessions (session_id, persona, repo_url, messages, turn_count, started_at, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (session_id) DO UPDATE SET
                    messages = EXCLUDED.messages,
                    turn_count = EXCLUDED.turn_count
                """,
                (session_id, persona, repo_url, json.dumps(messages), turn_count, datetime.now().isoformat(), user_id),
            )


async def update_session(session_id: str, messages: list, turn_count: int):
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute(
            "UPDATE public.sessions SET messages = %s, turn_count = %s WHERE session_id = %s",
            (json.dumps(messages), turn_count, session_id),
        )


async def save_report(session_id: str, report: dict):
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute(
            "UPDATE public.sessions SET report = %s, ended_at = %s WHERE session_id = %s",
            (json.dumps(report), datetime.now().isoformat(), session_id),
        )


async def get_session(session_id: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with await conn.execute(
            "SELECT persona, repo_url, messages, turn_count, user_id FROM public.sessions WHERE session_id = %s",
            (session_id,),
        ) as cur:
            row = await cur.fetchone()
            if row:
                return {
                    "persona": row[0],
                    "repo_url": row[1],
                    "messages": json.loads(row[2]),
                    "turn_count": row[3],
                    "user_id": row[4] or "",
                }
            return None


async def save_feedback(session_id: str, rating: int, comment: str) -> None:
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute(
            "UPDATE public.sessions SET feedback = %s WHERE session_id = %s",
            (json.dumps({"rating": rating, "comment": comment}), session_id),
        )


async def get_leaderboard(limit: int = 20) -> list:
    pool = await get_pool()
    async with pool.connection() as conn:
        cols = await _get_sessions_columns(conn)
        if "display_name" in cols:
            query = """
                SELECT user_id, persona, repo_url, report, ended_at, display_name
                FROM public.sessions
                WHERE report IS NOT NULL AND ended_at IS NOT NULL
                ORDER BY (report::json->>'overall')::float DESC, ended_at DESC
                LIMIT %s
            """
        else:
            query = """
                SELECT user_id, persona, repo_url, report, ended_at, '' AS display_name
                FROM public.sessions
                WHERE report IS NOT NULL AND ended_at IS NOT NULL
                ORDER BY (report::json->>'overall')::float DESC, ended_at DESC
                LIMIT %s
            """

        async with await conn.execute(query, (limit,)) as cur:
            rows = await cur.fetchall()
            result = []
            for row in rows:
                report = json.loads(row[3])
                uid = row[0] or ""
                name = (row[5] or "").strip()
                result.append({
                    "user": name if name else (uid[:6] + "***" if uid else "anon"),
                    "persona": row[1],
                    "repo": (row[2] or "").rstrip("/").split("/")[-1] or "project",
                    "overall": report.get("overall"),
                    "date": (row[4] or "")[:10],
                })
            return result


async def get_stats() -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with await conn.execute(
            "SELECT COUNT(*) FROM public.sessions WHERE report IS NOT NULL AND ended_at IS NOT NULL"
        ) as cur:
            row = await cur.fetchone()
            return {"sessions_completed": int(row[0]) if row else 0}


async def get_report(session_id: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with await conn.execute(
            "SELECT report FROM public.sessions WHERE session_id = %s", (session_id,)
        ) as cur:
            row = await cur.fetchone()
            if row and row[0]:
                return json.loads(row[0])
            return None

