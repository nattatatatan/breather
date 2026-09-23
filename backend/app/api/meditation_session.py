from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.db import get_db
from app.models.meditation_element import MeditationElement
from app.models.meditation_session import MeditationSession
from app.models.session_element import SessionElement
from app.schemas.meditation_session import (
    MeditationSessionCreate,
    MeditationSessionResponse,
    MeditationSessionUpdate,
)
from app.models.user import User
from app.auth.dep import get_current_user

router = APIRouter(
    prefix="/api/sessions",
    tags=["sessions"],
)

def to_response(
    session: MeditationSession,
) -> MeditationSessionResponse:
    return MeditationSessionResponse(
        id=session.id,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        mode=session.mode,
        intent_id=session.intent_id,
        feeling=session.feeling,
        note=session.note,
        visibility=session.visibility,
        element_ids=[
            session_element.element_id
            for session_element in session.elements
        ],
    )


@router.post(
    "",
    response_model=MeditationSessionResponse,
)
def create_session(
    data: MeditationSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    element_ids = set(data.element_ids)

    if not element_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one meditation element is required.",
        )

    elements = db.scalars(
        select(MeditationElement).where(
            MeditationElement.id.in_(element_ids)
        )
    ).all()

    if len(elements) != len(element_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more meditation elements do not exist.",
        )

    session = MeditationSession(
        user_id=current_user.id,
        started_at=datetime.now(timezone.utc),
        mode=data.mode,
        intent_id=data.intent_id,
    )

    for element_id in element_ids:
        session.elements.append(
            SessionElement(
                element_id=element_id,
            )
        )
        
    db.add(session)
    db.commit()
    db.refresh(session)

    return to_response(session)


@router.get(
    "",
    response_model=list[MeditationSessionResponse],
)
def get_sessions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.scalars(
        select(MeditationSession)
        .where(
            MeditationSession.user_id == current_user.id
        )
        .order_by(
            MeditationSession.started_at.desc()
        )
        .limit(limit)
        .offset(offset)
    ).all()

    return [to_response(session) for session in sessions]


@router.get(
    "/{session_id}",
    response_model=MeditationSessionResponse,
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.scalar(
        select(MeditationSession).where(
            MeditationSession.id == session_id,
            MeditationSession.user_id == current_user.id,
        )
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found.",
        )

    return to_response(session)


@router.patch(
    "/{session_id}",
    response_model=MeditationSessionResponse,
)
def update_session(
    session_id: int,
    data: MeditationSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.scalar(
        select(MeditationSession).where(
            MeditationSession.id == session_id,
            MeditationSession.user_id == current_user.id,
        )
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found.",
        )

    if data.mode is not None:
        session.mode = data.mode

    if data.feeling is not None:
        session.feeling = data.feeling

    if data.note is not None:
        session.note = data.note

    if data.visibility is not None:
        session.visibility = data.visibility

    db.commit()
    db.refresh(session)

    return to_response(session)

@router.post(
    "/{session_id}/complete",
    response_model=MeditationSessionResponse,
)
def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.scalar(
        select(MeditationSession).where(
            MeditationSession.id == session_id,
            MeditationSession.user_id == current_user.id,
        )
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found.",
        )

    if session.completed_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Session is already completed.",
        )

    completed_at = datetime.now(timezone.utc)

    if completed_at < session.started_at:
        raise HTTPException(
            status_code=400,
            detail="Invalid time of completion (completion time < started time).",
        )

    session.completed_at = completed_at
    session.duration_seconds = int(
        (completed_at - session.started_at).total_seconds()
    )

    db.commit()
    db.refresh(session)

    return to_response(session)