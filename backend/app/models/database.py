import json
from datetime import datetime
from psycopg_pool import AsyncConnectionPool
from app.config import get_settings

_pool: AsyncConnectionPool | None = None


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
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                persona TEXT NOT NULL,
                repo_url TEXT NOT NULL,
                messages TEXT NOT NULL,
                turn_count INTEGER DEFAULT 0,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                report TEXT
            )
        """)


async def save_session(session_id: str, persona: str, repo_url: str, messages: list, turn_count: int, user_id: str = ""):
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute(
            """
            INSERT INTO sessions (session_id, persona, repo_url, messages, turn_count, started_at, user_id)
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
            "UPDATE sessions SET messages = %s, turn_count = %s WHERE session_id = %s",
            (json.dumps(messages), turn_count, session_id),
        )


async def save_report(session_id: str, report: dict):
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute(
            "UPDATE sessions SET report = %s, ended_at = %s WHERE session_id = %s",
            (json.dumps(report), datetime.now().isoformat(), session_id),
        )


async def get_report(session_id: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with await conn.execute(
            "SELECT report FROM sessions WHERE session_id = %s", (session_id,)
        ) as cur:
            row = await cur.fetchone()
            if row and row[0]:
                return json.loads(row[0])
            return None
