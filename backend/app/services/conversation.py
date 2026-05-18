import logging
from datetime import datetime
from app.services.prompt_engine import get_persona_prompt
from app.services.groq_client import chat as groq_chat, stream_chat as groq_stream_chat
from app.config import get_settings

logger = logging.getLogger(__name__)

WRAP_UP_INJECTION = {
    "role": "system",
    "content": "This is the last question. Wrap up with a blunt 2-3 sentence verdict on how they performed overall. Be honest and direct.",
}

EMPTY_ANSWER_RESPONSE = "Did you just waste my time? Answer the question."
LLM_ERROR_RESPONSE = "Technical issue on my end. Try again."


class SessionManager:
    def __init__(self):
        self.sessions: dict = {}

    def start_session(self, session_id: str, persona: str, repo_context: str, repo_url: str, focus_areas: list[str] = None, user_id: str = "", system_prompt: str = None):
        if system_prompt is None:
            system_prompt = get_persona_prompt(persona, repo_context)
        if focus_areas:
            system_prompt += f"\n\nUSER-SPECIFIED FOCUS AREAS — prioritize questions on these topics: {', '.join(focus_areas)}."
        self.sessions[session_id] = {
            "messages": [{"role": "system", "content": system_prompt}],
            "persona": persona,
            "repo_url": repo_url,
            "turn_count": 0,
            "started_at": datetime.now(),
            "user_id": user_id,
        }

    async def respond(self, session_id: str, user_message: str) -> dict:
        session = self.sessions[session_id]
        settings = get_settings()

        if user_message == "__INIT__":
            try:
                response = await groq_chat(session["messages"])
            except Exception:
                logger.exception("respond __INIT__: groq_chat failed for session %s", session_id)
                raise
            session["messages"].append({"role": "assistant", "content": response})
            return {"response": response, "turn_count": 0, "is_final": False}

        if not user_message or not user_message.strip():
            return {"response": EMPTY_ANSWER_RESPONSE, "turn_count": session["turn_count"], "is_final": False}

        session["messages"].append({"role": "user", "content": user_message})
        session["turn_count"] += 1

        if session["turn_count"] >= settings.wrap_up_turn:
            session["messages"].append(WRAP_UP_INJECTION)

        try:
            response = await groq_chat(session["messages"])
        except Exception:
            logger.exception("respond: groq_chat failed for session %s turn %d", session_id, session["turn_count"])
            session["messages"].pop()
            session["turn_count"] -= 1
            return {
                "response": LLM_ERROR_RESPONSE,
                "turn_count": session["turn_count"],
                "is_final": False,
            }

        session["messages"].append({"role": "assistant", "content": response})

        return {
            "response": response,
            "turn_count": session["turn_count"],
            "is_final": session["turn_count"] >= settings.max_turns,
        }

    async def stream_respond(self, session_id: str, user_message: str):
        session = self.sessions[session_id]
        settings = get_settings()

        if not user_message or not user_message.strip():
            yield EMPTY_ANSWER_RESPONSE
            return

        session["messages"].append({"role": "user", "content": user_message})
        session["turn_count"] += 1

        if session["turn_count"] >= settings.wrap_up_turn:
            session["messages"].append(WRAP_UP_INJECTION)

        full_response = ""
        try:
            async for chunk in groq_stream_chat(session["messages"]):
                full_response += chunk
                yield chunk
        except Exception:
            logger.exception("stream_respond: stream failed for session %s turn %d", session_id, session["turn_count"])
            if not full_response:
                session["messages"].pop()
                session["turn_count"] -= 1
                yield LLM_ERROR_RESPONSE
                return

        if full_response:
            session["messages"].append({"role": "assistant", "content": full_response})

    def get_session_meta(self, session_id: str) -> dict:
        session = self.sessions[session_id]
        settings = get_settings()
        return {
            "turn_count": session["turn_count"],
            "is_final": session["turn_count"] >= settings.max_turns,
        }

    def restore_session(self, session_id: str, persona: str, repo_url: str, messages: list, turn_count: int, user_id: str = ""):
        self.sessions[session_id] = {
            "messages": messages,
            "persona": persona,
            "repo_url": repo_url,
            "turn_count": turn_count,
            "started_at": datetime.now(),
            "user_id": user_id,
        }

    def get_messages(self, session_id: str) -> list:
        return self.sessions[session_id]["messages"]


session_manager = SessionManager()
