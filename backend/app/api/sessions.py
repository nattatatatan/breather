from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.dep import get_current_user
from app.db.db import get_db
from app.models.meditation_element import MeditationElement
from app.models.meditation_session import MeditationSession
from app.models.session_element import SessionElement
from app.models.thread import Thread
from app.models.user import User
from app.schemas.meditation_session import (
    MeditationSessionComplete,
    MeditationSessionCreate,
    MeditationSessionResponse,
    MeditationSessionUpdate,
)

router = APIRouter(
    prefix="/api/sessions",
    tags=["sessions"],
)


def to_response(session: MeditationSession) -> MeditationSessionResponse:
    return MeditationSessionResponse(
        id=session.id,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        planned_seconds=session.planned_seconds,
        mode=session.mode,
        intent_id=session.intent_id,
        element_ids=[
            session_element.element_id
            for session_element in session.elements
        ],
        environment=session.environment,
        sound=session.sound,
        timer_visible=session.timer_visible,
        returns=list(session.returns or []),
        note=session.note,
        feeling=session.feeling,
        visibility=session.visibility,
        thread_id=session.thread.id if session.thread is not None else None,
    )


def _get_own_session(
    db: Session, session_id: int, user_id: int
) -> MeditationSession:
    session = db.scalar(
        select(MeditationSession)
        .options(selectinload(MeditationSession.elements))
        .where(
            MeditationSession.id == session_id,
            MeditationSession.user_id == user_id,
        )
    )

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    return session


@router.post(
    "",
    response_model=MeditationSessionResponse,
    status_code=201,
)
def create_session(
    data: MeditationSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    if data.environment.value == "dissolve" and not any(
        e.slug == "fire" for e in elements
    ):
        raise HTTPException(
            status_code=422,
            detail="environment=dissolve is only valid for the fire element.",
        )

    session = MeditationSession(
        user_id=current_user.id,
        started_at=datetime.now(timezone.utc),
        planned_seconds=data.planned_seconds,
        mode=data.mode,
        intent_id=data.intent_id,
        environment=data.environment,
        sound=data.sound,
        timer_visible=data.timer_visible,
        returns=[],
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
    completed: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(MeditationSession)
        .options(selectinload(MeditationSession.elements))
        .where(MeditationSession.user_id == current_user.id)
    )

    if completed is True:
        stmt = stmt.where(MeditationSession.completed_at.isnot(None))
    elif completed is False:
        stmt = stmt.where(MeditationSession.completed_at.is_(None))

    stmt = (
        stmt.order_by(MeditationSession.started_at.desc())
        .limit(limit)
        .offset(offset)
    )

    sessions = db.scalars(stmt).all()

    return [to_response(session) for session in sessions]


@router.get(
    "/{session_id}",
    response_model=MeditationSessionResponse,
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_own_session(db, session_id, current_user.id)
    return to_response(session)


@router.patch(
    "/{session_id}",
    response_model=MeditationSessionResponse,
)
def update_session(
    session_id: int,
    data: MeditationSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_own_session(db, session_id, current_user.id)

    if data.note is not None:
        session.note = data.note

    if data.feeling is not None:
        session.feeling = data.feeling

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
    data: MeditationSessionComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_own_session(db, session_id, current_user.id)

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

    duration_seconds = int((completed_at - session.started_at).total_seconds())

    returns = data.returns
    if any(r < 0 for r in returns):
        raise HTTPException(
            status_code=400,
            detail="returns must be non-negative.",
        )
    if any(a > b for a, b in zip(returns, returns[1:])):
        raise HTTPException(
            status_code=400,
            detail="returns must be ascending.",
        )
    if any(r > duration_seconds for r in returns):
        raise HTTPException(
            status_code=400,
            detail="returns must not exceed the session duration.",
        )

    session.completed_at = completed_at
    session.duration_seconds = duration_seconds
    session.returns = list(returns)

    db.commit()
    db.refresh(session)

    return to_response(session)


@router.delete(
    "/{session_id}",
    status_code=204,
)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_own_session(db, session_id, current_user.id)

    attached_thread = db.scalar(
        select(Thread).where(Thread.session_id == session.id)
    )
    if attached_thread is not None:
        raise HTTPException(
            status_code=409,
            detail="Session is attached to a thread and cannot be deleted.",
        )

    db.delete(session)
    db.commit()

    return None
