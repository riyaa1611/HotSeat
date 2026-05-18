import pytest
from unittest.mock import AsyncMock, patch

MOCK_MESSAGES = [
    {"role": "system", "content": "You are an evaluator."},
    {"role": "assistant", "content": "Tell me about your project."},
    {"role": "user", "content": "I built a React app that helps students."},
    {"role": "assistant", "content": "What's the business model?"},
    {"role": "user", "content": "Freemium with paid tier for schools."},
]

MOCK_RESPONSE = '''{
  "clarity": 7, "technical_depth": 6, "business_sense": 7,
  "pressure_handling": 6, "honesty": 7, "overall": 7,
  "strengths": ["Clear explanation", "Knows users"],
  "weaknesses": ["Shallow tech depth", "No metrics", "Vague roadmap"],
  "action_item": "Quantify your impact.",
  "answer_breakdown": [
    {"turn": 1, "score": 7, "note": "Clear and direct answer."},
    {"turn": 2, "score": 6, "note": "Good model but no revenue numbers."}
  ]
}'''

@pytest.mark.asyncio
async def test_evaluate_session_has_breakdown():
    with patch("app.services.evaluator.groq_chat", new=AsyncMock(return_value=MOCK_RESPONSE)):
        from app.services.evaluator import evaluate_session
        result = await evaluate_session(MOCK_MESSAGES)
    assert "answer_breakdown" in result
    assert len(result["answer_breakdown"]) == 2
    assert result["answer_breakdown"][0]["turn"] == 1
    assert "score" in result["answer_breakdown"][0]
    assert "note" in result["answer_breakdown"][0]
