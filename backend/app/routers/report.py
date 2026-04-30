from fastapi import APIRouter, HTTPException
from app.models.database import get_report

router = APIRouter()


@router.get("/report/{session_id}")
async def get_report_endpoint(session_id: str):
    report = await get_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": report}
