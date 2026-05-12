from fastapi import APIRouter, HTTPException, Depends
from app.models.database import get_report, get_session
from app.auth import get_current_user

router = APIRouter()


@router.get("/report/{session_id}")
async def get_report_endpoint(session_id: str, user_id: str = Depends(get_current_user)):
    session = await get_session(session_id)
    if not session or session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Report not found")
    report = await get_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": report}
