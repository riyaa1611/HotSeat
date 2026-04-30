import pytest
from unittest.mock import AsyncMock, patch
from app.services.conversation import SessionManager


SAMPLE_CONTEXT = "## Project: test-app\nA test project."


@pytest.fixture
def manager():
    return SessionManager()


def test_start_session_creates_session(manager):
    manager.start_session("sess-1", "investor", SAMPLE_CONTEXT, "https://github.com/a/b")
    assert "sess-1" in manager.sessions
    session = manager.sessions["sess-1"]
    assert session["persona"] == "investor"
    assert session["turn_count"] == 0
    assert len(session["messages"]) == 1  # system prompt only
    assert session["messages"][0]["role"] == "system"


def test_start_session_unknown_session_id_raises(manager):
    with pytest.raises(KeyError):
        _ = manager.sessions["nonexistent"]


@pytest.mark.asyncio
async def test_respond_adds_messages_and_increments_turn(manager):
    manager.start_session("sess-2", "tech_lead", SAMPLE_CONTEXT, "https://github.com/a/b")

    with patch("app.services.conversation.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "Walk me through your architecture."
        result = await manager.respond("sess-2", "Hello, I built a FastAPI app.")

    session = manager.sessions["sess-2"]
    assert result["turn_count"] == 1
    assert result["response"] == "Walk me through your architecture."
    assert result["is_final"] is False
    assert session["messages"][-1]["role"] == "assistant"
    assert session["messages"][-2]["role"] == "user"


@pytest.mark.asyncio
async def test_respond_marks_final_at_max_turns(manager):
    manager.start_session("sess-3", "investor", SAMPLE_CONTEXT, "https://github.com/a/b")
    # Simulate 11 existing turns
    manager.sessions["sess-3"]["turn_count"] = 11

    with patch("app.services.conversation.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "Final verdict."
        result = await manager.respond("sess-3", "My answer.")

    assert result["is_final"] is True
    assert result["turn_count"] == 12


@pytest.mark.asyncio
async def test_respond_injects_wrap_up_at_turn_10(manager):
    manager.start_session("sess-4", "hr_manager", SAMPLE_CONTEXT, "https://github.com/a/b")
    manager.sessions["sess-4"]["turn_count"] = 9

    with patch("app.services.conversation.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "Wrap up message."
        await manager.respond("sess-4", "My answer.")

    # Check that a wrap-up system message was injected
    messages = manager.sessions["sess-4"]["messages"]
    system_messages = [m for m in messages if m["role"] == "system"]
    wrap_up_messages = [m for m in system_messages if "wrap up" in m["content"].lower() or "last question" in m["content"].lower()]
    assert len(wrap_up_messages) >= 1


def test_get_messages_returns_full_history(manager):
    manager.start_session("sess-5", "product_manager", SAMPLE_CONTEXT, "https://github.com/a/b")
    messages = manager.get_messages("sess-5")
    assert isinstance(messages, list)
    assert messages[0]["role"] == "system"


@pytest.mark.asyncio
async def test_init_sentinel_does_not_increment_turn(manager):
    manager.start_session("sess-init", "investor", SAMPLE_CONTEXT, "https://github.com/a/b")

    with patch("app.services.conversation.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "You've got 5 minutes. What is this?"
        result = await manager.respond("sess-init", "__INIT__")

    assert result["turn_count"] == 0
    assert result["is_final"] is False
    assert "5 minutes" in result["response"]
