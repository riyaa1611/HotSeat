import json
import aiosqlite
from datetime import datetime
from pathlib import Path

DB_PATH = Path("hotseat.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
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
        await db.commit()


async def save_session(session_id: str, persona: str, repo_url: str, messages: list, turn_count: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT OR REPLACE INTO sessions
            (session_id, persona, repo_url, messages, turn_count, started_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (session_id, persona, repo_url, json.dumps(messages), turn_count, datetime.now().isoformat()),
        )
        await db.commit()


async def update_session(session_id: str, messages: list, turn_count: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET messages = ?, turn_count = ? WHERE session_id = ?",
            (json.dumps(messages), turn_count, session_id),
        )
        await db.commit()


async def save_report(session_id: str, report: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET report = ?, ended_at = ? WHERE session_id = ?",
            (json.dumps(report), datetime.now().isoformat(), session_id),
        )
        await db.commit()


async def get_report(session_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT report FROM sessions WHERE session_id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row and row[0]:
                return json.loads(row[0])
            return None
