from datetime import datetime
from app.services.prompt_engine import get_persona_prompt
from app.services.groq_client import chat as groq_chat, stream_chat as groq_stream_chat
from app.config import get_settings

WRAP_UP_INJECTION = {
    "role": "system",
    "content": "This is the last question. Wrap up with a blunt 2-3 sentence verdict on how they performed overall. Be honest and direct.",
}

EMPTY_ANSWER_RESPONSE = "Did you just waste my time? Answer the question."


class SessionManager:
    def __init__(self):
        self.sessions: dict = {}

    def start_session(self, session_id: str, persona: str, repo_context: str, repo_url: str, focus_areas: list[str] = None):
        system_prompt = get_persona_prompt(persona, repo_context)
        if focus_areas:
            system_prompt += f"\n\nUSER-SPECIFIED FOCUS AREAS — prioritize questions on these topics: {', '.join(focus_areas)}."
        self.sessions[session_id] = {
            "messages": [{"role": "system", "content": system_prompt}],
            "persona": persona,
            "repo_url": repo_url,
            "turn_count": 0,
            "started_at": datetime.now(),
        }

    async def respond(self, session_id: str, user_message: str) -> dict:
        session = self.sessions[session_id]
        settings = get_settings()

        if user_message == "__INIT__":
            response = await groq_chat(session["messages"])
            session["messages"].append({"role": "assistant", "content": response})
            return {"response": response, "turn_count": 0, "is_final": False}

        if not user_message or not user_message.strip():
            return {"response": EMPTY_ANSWER_RESPONSE, "turn_count": session["turn_count"], "is_final": False}

        session["messages"].append({"role": "user", "content": user_message})
        session["turn_count"] += 1

        if session["turn_count"] >= settings.wrap_up_turn:
            session["messages"].append(WRAP_UP_INJECTION)

        response = await groq_chat(session["messages"])
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
        async for chunk in groq_stream_chat(session["messages"]):
            full_response += chunk
            yield chunk

        session["messages"].append({"role": "assistant", "content": full_response})

    def get_session_meta(self, session_id: str) -> dict:
        session = self.sessions[session_id]
        settings = get_settings()
        return {
            "turn_count": session["turn_count"],
            "is_final": session["turn_count"] >= settings.max_turns,
        }

    def get_messages(self, session_id: str) -> list:
        return self.sessions[session_id]["messages"]
