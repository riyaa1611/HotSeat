import json
import re
from app.services.groq_client import chat as groq_chat

INTERVIEW_EVAL_PROMPT = """
You just finished interviewing a job candidate. Here is the full conversation.

Rate them on these criteria (1-10 each, be harsh — 7+ means genuinely impressive):

1. **Communication** — Were their answers clear, structured, and concise?
2. **Confidence** — Did they stay composed under pressure, or did they fumble and use filler?
3. **Problem Solving** — Did they reason well when challenged or when they didn't know an answer?
4. **Culture Fit** — Did they show self-awareness, collaboration, and genuine values?
5. **Honesty** — Did they admit gaps, or did they bluff and fabricate?

Then give:
- Overall score (average, rounded to nearest int)
- Top 2 strengths (one sentence each, specific to what they said)
- Top 3 weaknesses (one sentence each — be specific)
- One concrete action item for their next interview practice
- Per-answer breakdown: for each candidate answer (in order), assign a score 1-10 and a one-sentence note. Count only actual candidate (user) messages, not system messages.

Respond ONLY in this exact JSON format, no other text:
{
  "communication": <int 1-10>,
  "confidence": <int 1-10>,
  "problem_solving": <int 1-10>,
  "culture_fit": <int 1-10>,
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
    "communication": 5, "confidence": 5, "problem_solving": 5,
    "culture_fit": 5, "honesty": 5, "overall": 5,
    "strengths": ["Session completed", "Engaged with the interviewer"],
    "weaknesses": [
        "Report generation failed — review the conversation manually",
        "Consider re-running the session",
        "Practice giving more structured, specific answers",
    ],
    "action_item": "Re-run the session and focus on giving concrete examples with measurable outcomes.",
    "answer_breakdown": [],
}


def _parse_json_response(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    return json.loads(clean)


async def evaluate_interview(messages: list[dict]) -> dict:
    eval_messages = [
        {"role": "system", "content": "You are an objective evaluator. Return only valid JSON."},
        *messages,
        {"role": "user", "content": INTERVIEW_EVAL_PROMPT},
    ]
    raw = await groq_chat(eval_messages)
    try:
        return _parse_json_response(raw)
    except (json.JSONDecodeError, KeyError, ValueError):
        return FALLBACK_REPORT.copy()
