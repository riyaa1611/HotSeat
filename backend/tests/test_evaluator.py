import pytest
import json
from unittest.mock import AsyncMock, patch
from app.services.evaluator import evaluate_session, EVAL_PROMPT


SAMPLE_MESSAGES = [
    {"role": "system", "content": "You are a VC."},
    {"role": "assistant", "content": "What is this?"},
    {"role": "user", "content": "It's a tool for developers."},
    {"role": "assistant", "content": "Who pays for it?"},
    {"role": "user", "content": "Enterprises."},
]

VALID_REPORT = {
    "clarity": 7,
    "technical_depth": 5,
    "business_sense": 6,
    "pressure_handling": 8,
    "honesty": 7,
    "overall": 7,
    "strengths": ["Clear communication", "Handled pressure well"],
    "weaknesses": ["Vague on revenue model", "No metrics cited", "Weak competitive analysis"],
    "action_item": "Practice explaining your revenue model with specific numbers.",
}


@pytest.mark.asyncio
async def test_evaluate_session_returns_valid_report():
    with patch("app.services.evaluator.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = json.dumps(VALID_REPORT)
        report = await evaluate_session(SAMPLE_MESSAGES)

    assert report["clarity"] == 7
    assert report["overall"] == 7
    assert len(report["strengths"]) == 2
    assert len(report["weaknesses"]) == 3
    assert "action_item" in report


@pytest.mark.asyncio
async def test_evaluate_session_handles_json_with_markdown_fences():
    fenced = f"```json\n{json.dumps(VALID_REPORT)}\n```"

    with patch("app.services.evaluator.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = fenced
        report = await evaluate_session(SAMPLE_MESSAGES)

    assert report["clarity"] == 7


@pytest.mark.asyncio
async def test_evaluate_session_fallback_on_invalid_json():
    with patch("app.services.evaluator.groq_chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "I can't evaluate this."
        report = await evaluate_session(SAMPLE_MESSAGES)

    assert "clarity" in report
    assert "overall" in report
    assert "strengths" in report
    assert "weaknesses" in report
    assert "action_item" in report


def test_eval_prompt_contains_all_criteria():
    assert "Clarity" in EVAL_PROMPT
    assert "Technical depth" in EVAL_PROMPT or "technical_depth" in EVAL_PROMPT
    assert "Business sense" in EVAL_PROMPT or "business_sense" in EVAL_PROMPT
    assert "Pressure handling" in EVAL_PROMPT or "pressure_handling" in EVAL_PROMPT
    assert "Honesty" in EVAL_PROMPT
    assert "JSON" in EVAL_PROMPT
