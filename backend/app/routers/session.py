import uuid
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from app.limiter import limiter
from app.models.schemas import (
    StartSessionRequest, StartSessionResponse,
    RespondRequest, RespondResponse,
    EndSessionRequest, EndSessionResponse,
)
from app.models.database import save_session, update_session, save_report, get_session as load_session_from_db
from app.services.repo_parser import parse_repo
from app.services.url_scraper import scrape_url
from app.services.context_builder import build_context
from app.services.conversation import session_manager as _manager
from app.services.evaluator import evaluate_session
from app.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/start-session", response_model=StartSessionResponse)
@limiter.limit("10/minute")
async def start_session(request: Request, body: StartSessionRequest, user_id: str = Depends(get_current_user)):
    try:
        is_github = "github.com" in body.repo_url
        if is_github:
            parsed = await parse_repo(body.repo_url)
        else:
            scraped = await scrape_url(body.repo_url)
            github_url = scraped.get("github_url")
            if github_url:
                try:
                    parsed = await parse_repo(github_url)
                except Exception:
                    parsed = scraped
            else:
                parsed = scraped
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repo or project URL.")
    except Exception:
        logger.exception("start_session failed during project parsing")
        raise HTTPException(
            status_code=502,
            detail="Failed to prepare project context. Verify the repo/URL is reachable.",
        )

    if body.description:
        parsed["readme"] = parsed.get("readme", "") + f"\n\n## User Description\n{body.description}"

    repo_context = build_context(parsed)
    session_id = str(uuid.uuid4())

    try:
        _manager.start_session(session_id, body.persona, repo_context, body.repo_url, body.focus_areas, user_id)
    except Exception:
        logger.exception("start_session failed while creating in-memory session")
        raise HTTPException(status_code=500, detail="Failed to initialize interview session.")

    try:
        first_message_result = await _manager.respond(session_id, "__INIT__")
        first_message = first_message_result["response"]
    except Exception:
        logger.exception("start_session failed while generating first AI question")
        raise HTTPException(
            status_code=502,
            detail="Failed to generate the first question. Please try again.",
        )

    try:
        await save_session(
            session_id, body.persona, body.repo_url,
            _manager.get_messages(session_id), 0, user_id, body.display_name,
        )
    except Exception:
        logger.exception("start_session failed while saving session to database")
        raise HTTPException(
            status_code=500,
            detail="Session was created but could not be saved. Please try again.",
        )

    return StartSessionResponse(session_id=session_id, first_message=first_message)


async def _ensure_session_loaded(session_id: str, user_id: str) -> None:
    if session_id not in _manager.sessions:
        row = await load_session_from_db(session_id)
        if not row or row["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
        _manager.restore_session(session_id, row["persona"], row["repo_url"], row["messages"], row["turn_count"], row["user_id"])
    elif _manager.sessions[session_id].get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/respond", response_model=RespondResponse)
@limiter.limit("30/minute")
async def respond(request: Request, body: RespondRequest, user_id: str = Depends(get_current_user)):
    await _ensure_session_loaded(body.session_id, user_id)

    result = await _manager.respond(body.session_id, body.message)

    await update_session(
        body.session_id,
        _manager.get_messages(body.session_id),
        result["turn_count"],
    )

    return RespondResponse(**result)


@router.post("/respond-stream")
@limiter.limit("30/minute")
async def respond_stream(request: Request, body: RespondRequest, user_id: str = Depends(get_current_user)):
    await _ensure_session_loaded(body.session_id, user_id)

    async def generate():
        try:
            async for chunk in _manager.stream_respond(body.session_id, body.message):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            meta = _manager.get_session_meta(body.session_id)
            await update_session(
                body.session_id,
                _manager.get_messages(body.session_id),
                meta["turn_count"],
            )
            yield f"data: {json.dumps({'done': True, **meta})}\n\n"
        except Exception as e:
            logger.exception("respond_stream error for session %s", body.session_id)
            yield f"data: {json.dumps({'error': 'Stream error. Please try again.'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/end-session", response_model=EndSessionResponse)
async def end_session(request: EndSessionRequest, user_id: str = Depends(get_current_user)):
    await _ensure_session_loaded(request.session_id, user_id)

    messages = _manager.get_messages(request.session_id)
    report = await evaluate_session(messages)

    await save_report(request.session_id, report)

    return EndSessionResponse(report=report)
