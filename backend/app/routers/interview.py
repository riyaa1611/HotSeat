import logging
import uuid
from fastapi import APIRouter, HTTPException, Depends, Request, File, UploadFile, Form
from app.auth import get_current_user
from app.limiter import limiter
from app.models.schemas import StartSessionResponse, EndInterviewResponse, EndSessionRequest
from app.models.database import save_session, save_report, get_session as load_session_from_db
from app.services.resume_parser import parse_resume_pdf, fetch_github_profile
from app.services.interview_context_builder import build_interview_context
from app.services.interview_prompt_engine import get_interview_prompt, INTERVIEW_PERSONAS
from app.services.interview_evaluator import evaluate_interview
from app.services.conversation import session_manager as _manager

router = APIRouter()
logger = logging.getLogger(__name__)

_MAX_RESUME_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/start-interview", response_model=StartSessionResponse)
@limiter.limit("10/minute")
async def start_interview(
    request: Request,
    resume: UploadFile = File(...),
    github_url: str = Form(..., max_length=300),
    role: str = Form(..., max_length=120),
    persona: str = Form(..., max_length=80),
    display_name: str = Form("", max_length=80),
    user_id: str = Depends(get_current_user),
):
    if persona not in INTERVIEW_PERSONAS:
        raise HTTPException(status_code=400, detail=f"Invalid persona. Valid: {INTERVIEW_PERSONAS}")

    try:
        pdf_bytes = await resume.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")

    if len(pdf_bytes) > _MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Resume file too large. Maximum size is 5 MB.")
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        resume_text = await parse_resume_pdf(pdf_bytes)
        github = await fetch_github_profile(github_url)
    except Exception:
        logger.exception("start_interview failed during parsing")
        raise HTTPException(status_code=502, detail="Failed to parse resume or GitHub profile. Ensure the GitHub URL is valid and public.")

    candidate_context = build_interview_context(resume_text, github, role)
    system_prompt = get_interview_prompt(persona, candidate_context)
    session_id = str(uuid.uuid4())

    try:
        _manager.start_session(session_id, persona, candidate_context, github_url, [], user_id, system_prompt=system_prompt)
    except Exception:
        logger.exception("start_interview failed while creating session")
        raise HTTPException(status_code=500, detail="Failed to initialize interview session.")

    try:
        first_message_result = await _manager.respond(session_id, "__INIT__")
        first_message = first_message_result["response"]
    except Exception:
        logger.exception("start_interview failed generating first question")
        raise HTTPException(status_code=502, detail="Failed to generate first question.")

    try:
        await save_session(
            session_id, persona, github_url,
            _manager.get_messages(session_id), 0, user_id, display_name,
        )
    except Exception:
        logger.exception("start_interview failed saving session")
        raise HTTPException(status_code=500, detail="Session created but could not be saved.")

    return StartSessionResponse(session_id=session_id, first_message=first_message)


@router.post("/end-interview", response_model=EndInterviewResponse)
async def end_interview(
    body: EndSessionRequest,
    user_id: str = Depends(get_current_user),
):
    if body.session_id not in _manager.sessions:
        row = await load_session_from_db(body.session_id)
        if not row or row["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
        _manager.restore_session(body.session_id, row["persona"], row["repo_url"], row["messages"], row["turn_count"], row["user_id"])
    elif _manager.sessions[body.session_id].get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = _manager.get_messages(body.session_id)

    try:
        report = await evaluate_interview(messages)
    except Exception:
        logger.exception("end_interview: evaluate_interview failed for session %s", body.session_id)
        raise HTTPException(status_code=502, detail="Failed to generate report. Please try again.")

    try:
        await save_report(body.session_id, report)
    except Exception:
        logger.exception("end_interview: save_report failed for session %s", body.session_id)
        raise HTTPException(status_code=500, detail="Report generated but could not be saved.")

    return EndInterviewResponse(report=report)
