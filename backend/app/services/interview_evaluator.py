import json
import re
import logging
from app.services.groq_client import chat as groq_chat

logger = logging.getLogger(__name__)

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


_SCORE_FIELDS = {"communication", "confidence", "problem_solving", "culture_fit", "honesty", "overall"}
_REQUIRED_FIELDS = _SCORE_FIELDS | {"strengths", "weaknesses", "action_item", "answer_breakdown"}


def _parse_json_response(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    return json.loads(clean)


def _validate_and_clamp(data: dict) -> dict:
    missing = _REQUIRED_FIELDS - data.keys()
    if missing:
        raise ValueError(f"LLM response missing fields: {missing}")
    for field in _SCORE_FIELDS:
        val = data[field]
        if not isinstance(val, (int, float)):
            raise ValueError(f"Score field '{field}' is not numeric: {val!r}")
        data[field] = max(1, min(10, int(round(val))))
    if not isinstance(data["strengths"], list) or len(data["strengths"]) < 1:
        raise ValueError("strengths must be a non-empty list")
    if not isinstance(data["weaknesses"], list) or len(data["weaknesses"]) < 1:
        raise ValueError("weaknesses must be a non-empty list")
    if not isinstance(data["action_item"], str) or not data["action_item"].strip():
        raise ValueError("action_item must be a non-empty string")
    if not isinstance(data["answer_breakdown"], list):
        raise ValueError("answer_breakdown must be a list")
    for entry in data["answer_breakdown"]:
        if "score" in entry and isinstance(entry["score"], (int, float)):
            entry["score"] = max(1, min(10, int(round(entry["score"]))))
    return data


_EVAL_SYSTEM = "You are an objective evaluator. Return only valid JSON. Do not invent information not present in the conversation."
_EVAL_SYSTEM_STRICT = "Return ONLY a valid JSON object. No markdown, no explanation, no extra text. Start your response with { and end with }."
_JSON_FORMAT = {"type": "json_object"}


async def evaluate_interview(messages: list[dict]) -> dict:
    eval_messages = [
        {"role": "system", "content": _EVAL_SYSTEM},
        *messages,
        {"role": "user", "content": INTERVIEW_EVAL_PROMPT},
    ]

    for attempt, system in enumerate([_EVAL_SYSTEM, _EVAL_SYSTEM_STRICT]):
        if attempt > 0:
            eval_messages[0] = {"role": "system", "content": system}
        try:
            raw = await groq_chat(
                eval_messages,
                temperature=0.3,
                max_tokens=1024,
                response_format=_JSON_FORMAT,
            )
        except Exception:
            logger.exception("evaluate_interview: groq_chat failed (attempt %d)", attempt + 1)
            if attempt == 0:
                continue
            return FALLBACK_REPORT.copy()

        try:
            data = _parse_json_response(raw)
            return _validate_and_clamp(data)
        except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
            logger.warning("evaluate_interview: invalid response attempt %d (%s)", attempt + 1, e)
            if attempt == 0:
                continue
            return FALLBACK_REPORT.copy()

    return FALLBACK_REPORT.copy()
