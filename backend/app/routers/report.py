from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.models.database import get_report, get_session, get_leaderboard, save_feedback
from app.auth import get_current_user

router = APIRouter()


class FeedbackBody(BaseModel):
    session_id: str = Field(max_length=128)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


@router.post("/feedback")
async def submit_feedback(body: FeedbackBody, user_id: str = Depends(get_current_user)):
    session = await get_session(body.session_id)
    if not session or session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    await save_feedback(body.session_id, body.rating, body.comment)
    return {"status": "ok"}


@router.get("/leaderboard")
async def leaderboard_endpoint():
    entries = await get_leaderboard(20)
    return {"entries": entries}


@router.get("/report/{session_id}")
async def get_report_endpoint(session_id: str, user_id: str = Depends(get_current_user)):
    session = await get_session(session_id)
    if not session or session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Report not found")
    report = await get_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": report}
