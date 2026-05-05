from __future__ import annotations

from fastapi import APIRouter, HTTPException

from apps.recommender_api.app.models.schemas import (
    FeedbackRequest,
    RecommendationResult,
    SessionPreferences,
    SessionTitleResponse,
    StartSessionRequest,
    StopRequest,
)

from apps.recommender_api.app.services.catalog import by_id
from apps.recommender_api.app.services.recommender import service


router = APIRouter(prefix="/session", tags=["session"])


@router.post("/start", response_model=SessionTitleResponse)
def start_session(payload: StartSessionRequest) -> SessionTitleResponse:
    preferences = SessionPreferences(
        contentMode=payload.contentMode,
        adventureLevel=payload.adventureLevel,
    )
    return service.start_session(preferences)


@router.post("/next-title", response_model=SessionTitleResponse)
def next_title(payload: StopRequest) -> SessionTitleResponse:
    try:
        return service.next_title(payload.sessionId)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/feedback", response_model=SessionTitleResponse)
def feedback(payload: FeedbackRequest) -> SessionTitleResponse:
    try:
        by_id(payload.titleId)
        return service.submit_feedback(payload)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Session or title not found") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/stop", response_model=RecommendationResult)
def stop(payload: StopRequest) -> RecommendationResult:
    try:
        return service.stop(payload.sessionId)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Session not found") from error
