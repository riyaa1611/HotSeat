import json
import re
from app.services.groq_client import chat as groq_chat

EVAL_PROMPT = """
You just finished grilling someone on their project pitch. Here is the full conversation.

Rate them on these criteria (1-10 each, be harsh — 7+ means genuinely impressive):

1. **Clarity** — Could they explain their project without jargon?
2. **Technical depth** — Do they actually understand what they built?
3. **Business sense** — Do they understand the market, users, and why this matters?
4. **Pressure handling** — Did they stay composed when challenged, or did they crumble?
5. **Honesty** — Did they admit gaps, or did they BS their way through?

Then give:
- Overall score (average, rounded to nearest int)
- Top 2 strengths (one sentence each, specific to what they said)
- Top 3 weaknesses (one sentence each — be specific)
- One concrete action item for their next practice session
- Per-answer breakdown: for each user answer (in order), assign a score 1-10 and a one-sentence note on what was strong or weak. Count only actual user answers, not system messages.

Respond ONLY in this exact JSON format, no other text:
{
  "clarity": <int 1-10>,
  "technical_depth": <int 1-10>,
  "business_sense": <int 1-10>,
  "pressure_handling": <int 1-10>,
  "honesty": <int 1-10>,
  "overall": <int 1-10>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "...", "..."],
  "action_item": "...",
  "answer_breakdown": [
    {"turn": 1, "score": <int 1-10>, "note": "..."},
    {"turn": 2, "score": <int 1-10>, "note": "..."}
  ]
}
"""

FALLBACK_REPORT = {
    "clarity": 5, "technical_depth": 5, "business_sense": 5,
    "pressure_handling": 5, "honesty": 5, "overall": 5,
    "strengths": ["Session completed", "Engaged with the evaluator"],
    "weaknesses": [
        "Report generation failed — review the conversation manually",
        "Consider re-running the session",
        "Practice articulating your project more clearly",
    ],
    "action_item": "Re-run the session and try to give more specific, concrete answers.",
    "answer_breakdown": [],
}


def _parse_json_response(raw: str) -> dict:
    """Extract JSON from raw LLM response, handling markdown fences."""
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    return json.loads(clean)


async def evaluate_session(messages: list[dict]) -> dict:
    eval_messages = [
        {"role": "system", "content": "You are an objective evaluator. Return only valid JSON."},
        *messages,
        {"role": "user", "content": EVAL_PROMPT},
    ]

    raw = await groq_chat(eval_messages)

    try:
        return _parse_json_response(raw)
    except (json.JSONDecodeError, KeyError, ValueError):
        return FALLBACK_REPORT.copy()
