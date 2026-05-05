import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    StartSessionRequest, StartSessionResponse,
    RespondRequest, RespondResponse,
    EndSessionRequest, EndSessionResponse,
)
from app.models.database import save_session, update_session, save_report
from app.services.repo_parser import parse_repo
from app.services.context_builder import build_context
from app.services.conversation import SessionManager
from app.services.evaluator import evaluate_session
from app.auth import get_current_user

router = APIRouter()

_manager = SessionManager()


@router.post("/start-session", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest, user_id: str = Depends(get_current_user)):
    try:
        parsed = await parse_repo(request.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    repo_context = build_context(parsed)
    session_id = str(uuid.uuid4())

    _manager.start_session(session_id, request.persona, repo_context, request.repo_url)

    first_message_result = await _manager.respond(session_id, "__INIT__")
    first_message = first_message_result["response"]

    await save_session(
        session_id, request.persona, request.repo_url,
        _manager.get_messages(session_id), 0, user_id,
    )

    return StartSessionResponse(session_id=session_id, first_message=first_message)


@router.post("/respond", response_model=RespondResponse)
async def respond(request: RespondRequest, user_id: str = Depends(get_current_user)):
    if request.session_id not in _manager.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await _manager.respond(request.session_id, request.message)

    await update_session(
        request.session_id,
        _manager.get_messages(request.session_id),
        result["turn_count"],
    )

    return RespondResponse(**result)


@router.post("/end-session", response_model=EndSessionResponse)
async def end_session(request: EndSessionRequest, user_id: str = Depends(get_current_user)):
    if request.session_id not in _manager.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = _manager.get_messages(request.session_id)
    report = await evaluate_session(messages)

    await save_report(request.session_id, report)

    return EndSessionResponse(report=report)
