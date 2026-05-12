import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app

PARSED_REPO = {
    "repo_name": "my-app",
    "owner": "alice",
    "readme": "# My App\nA FastAPI project with React frontend.",
    "file_tree": ["src/main.py", "frontend/src/App.jsx", "package.json"],
    "key_files": {"requirements.txt": "fastapi\nhttpx\n"},
}

VALID_REPORT = {
    "clarity": 7, "technical_depth": 6, "business_sense": 5,
    "pressure_handling": 8, "honesty": 7, "overall": 7,
    "strengths": ["Clear explanation", "Good under pressure"],
    "weaknesses": ["Weak on revenue", "No metrics", "Vague users"],
    "action_item": "Practice pitching the revenue model.",
}


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_parse_repo_endpoint_success():
    with patch("app.routers.repo.parse_repo", new_callable=AsyncMock) as mock_parse:
        mock_parse.return_value = PARSED_REPO
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post("/api/parse-repo", json={"repo_url": "https://github.com/alice/my-app"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["repo_name"] == "my-app"
    assert data["file_count"] == 3
    assert isinstance(data["tech_stack"], list)


@pytest.mark.asyncio
async def test_parse_repo_endpoint_invalid_url():
    with patch("app.routers.repo.parse_repo", new_callable=AsyncMock) as mock_parse:
        mock_parse.side_effect = ValueError("Invalid GitHub URL: not-a-url")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post("/api/parse-repo", json={"repo_url": "not-a-url"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_start_session_and_respond():
    with patch("app.routers.session.parse_repo", new_callable=AsyncMock) as mock_parse, \
         patch("app.services.conversation.groq_chat", new_callable=AsyncMock) as mock_chat, \
         patch("app.routers.session.save_session", new_callable=AsyncMock), \
         patch("app.routers.session.update_session", new_callable=AsyncMock):

        mock_parse.return_value = PARSED_REPO
        mock_chat.return_value = "You've got 5 minutes. What is this and why should I care?"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            start_resp = await ac.post("/api/start-session", json={
                "repo_url": "https://github.com/alice/my-app",
                "persona": "investor",
            })

        assert start_resp.status_code == 200
        data = start_resp.json()
        assert "session_id" in data
        assert "first_message" in data
        assert len(data["session_id"]) > 0

        session_id = data["session_id"]
        mock_chat.return_value = "Who's paying for this?"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            respond_resp = await ac.post("/api/respond", json={
                "session_id": session_id,
                "message": "Enterprises will pay for productivity tools.",
            })

        assert respond_resp.status_code == 200
        rdata = respond_resp.json()
        assert rdata["turn_count"] >= 1
        assert "is_final" in rdata


@pytest.mark.asyncio
async def test_respond_unknown_session():
    with patch("app.routers.session.load_session_from_db", new_callable=AsyncMock, return_value=None):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post("/api/respond", json={
                "session_id": "does-not-exist",
                "message": "Hello",
            })
    assert resp.status_code == 404
