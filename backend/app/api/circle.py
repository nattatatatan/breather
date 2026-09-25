from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.dep import get_current_user
from app.db.db import get_db
from app.models.meditation_session import MeditationSession
from app.models.reply import Reply as ReplyModel
from app.models.reply_helpful import ReplyHelpful
from app.models.visibility import Visibility
from app.models.thread import Thread
from app.models.user import User
from app.schemas.circle import (
    AuthorSummary,
    HelpfulState,
    Hours,
    Practitioner,
    Reply,
    ReplyCreate,
    SharedSitting,
    ThreadCreate,
    ThreadDetail,
    ThreadSummary,
)
from app.services.authors import author_summaries, author_summary
from app.services.circle import (
    build_attached_sitting,
    compute_hours,
    has_read_sitting,
    record_view,
    reply_aggregates,
)
from app.services.stats import compute_stats

router = APIRouter(prefix="/api/circle", tags=["circle"])


def _excerpt(body: str, length: int = 180) -> str:
    return body[:length]


def _thread_summary(
    thread: Thread,
    author: AuthorSummary,
    reply_count: int,
    long_practitioner_reply_count: int,
    db: Session,
) -> ThreadSummary:
    attached = build_attached_sitting(db, thread.session)

    mode = thread.mode
    element_id = thread.element_id
    if attached is not None:
        if mode is None:
            mode = attached.mode
        if element_id is None:
            element_id = attached.element_id

    return ThreadSummary(
        id=thread.id,
        author=author,
        title=thread.title,
        excerpt=_excerpt(thread.body),
        created_at=thread.created_at,
        mode=mode,
        element_id=element_id,
        attached=attached,
        reply_count=reply_count,
        long_practitioner_reply_count=long_practitioner_reply_count,
    )


@router.get("/threads", response_model=list[ThreadSummary])
def list_threads(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    threads = db.scalars(
        select(Thread)
        .options(
            selectinload(Thread.session).selectinload(
                MeditationSession.elements
            )
        )
        .order_by(Thread.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    if not threads:
        return []

    author_ids = [t.author_id for t in threads]
    authors = author_summaries(db, author_ids)

    aggregates = reply_aggregates(db, [t.id for t in threads])

    return [
        _thread_summary(
            thread,
            authors[thread.author_id],
            *aggregates.get(thread.id, (0, 0)),
            db,
        )
        for thread in threads
    ]


def _thread_detail(
    thread: Thread, db: Session, viewer_id: int
) -> ThreadDetail:
    author = author_summary(db, thread.author_id)
    reply_count, long_count = reply_aggregates(db, [thread.id]).get(
        thread.id, (0, 0)
    )
    summary = _thread_summary(thread, author, reply_count, long_count, db)

    reply_rows = db.scalars(
        select(ReplyModel)
        .where(ReplyModel.thread_id == thread.id)
        .order_by(ReplyModel.created_at.asc())
    ).all()

    reply_author_ids = [r.author_id for r in reply_rows]
    reply_authors = author_summaries(db, reply_author_ids)

    helpful_counts: dict[int, int] = {}
    my_marks: set[int] = set()
    if reply_rows:
        reply_ids = [r.id for r in reply_rows]
        count_rows = db.execute(
            select(ReplyHelpful.reply_id)
            .where(ReplyHelpful.reply_id.in_(reply_ids))
        ).all()
        for (reply_id,) in count_rows:
            helpful_counts[reply_id] = helpful_counts.get(reply_id, 0) + 1

        my_mark_rows = db.execute(
            select(ReplyHelpful.reply_id).where(
                ReplyHelpful.reply_id.in_(reply_ids),
                ReplyHelpful.user_id == viewer_id,
            )
        ).all()
        my_marks = {reply_id for (reply_id,) in my_mark_rows}

    replies = [
        Reply(
            id=r.id,
            author=reply_authors[r.author_id],
            body=r.body,
            created_at=r.created_at,
            helpful_count=helpful_counts.get(r.id, 0),
            marked_helpful_by_me=r.id in my_marks,
            read_context=r.read_context,
        )
        for r in reply_rows
    ]

    return ThreadDetail(
        **summary.model_dump(),
        body=thread.body,
        replies=replies,
    )


@router.post("/threads", response_model=ThreadDetail, status_code=201)
def create_thread(
    data: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mode = data.mode
    element_id = data.element_id
    session = None

    if data.session_id is not None:
        session = db.scalar(
            select(MeditationSession).where(
                MeditationSession.id == data.session_id,
                MeditationSession.user_id == current_user.id,
            )
        )
        if session is None:
            raise HTTPException(
                status_code=400,
                detail="session_id must reference your own session.",
            )
        if session.completed_at is None:
            raise HTTPException(
                status_code=400,
                detail="Only a completed session can be attached.",
            )
        existing = db.scalar(
            select(Thread).where(Thread.session_id == session.id)
        )
        if existing is not None:
            raise HTTPException(
                status_code=400,
                detail="This session is already attached to a thread.",
            )

        attached = build_attached_sitting(db, session)
        if mode is None:
            mode = attached.mode
        if element_id is None:
            element_id = attached.element_id

    thread = Thread(
        author_id=current_user.id,
        title=data.title,
        body=data.body,
        created_at=datetime.now(timezone.utc),
        mode=mode,
        element_id=element_id,
        session_id=session.id if session is not None else None,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    return _thread_detail(thread, db, current_user.id)


@router.get("/threads/{thread_id}", response_model=ThreadDetail)
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = db.get(Thread, thread_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found.")

    return _thread_detail(thread, db, current_user.id)


@router.post(
    "/threads/{thread_id}/replies", response_model=Reply, status_code=201
)
def create_reply(
    thread_id: int,
    data: ReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = db.get(Thread, thread_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Thread not found.")

    read_context = False
    if thread.session_id is not None:
        read_context = has_read_sitting(
            db, current_user.id, thread.session_id
        )

    reply = ReplyModel(
        thread_id=thread.id,
        author_id=current_user.id,
        body=data.body,
        created_at=datetime.now(timezone.utc),
        read_context=read_context,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    author = author_summary(db, current_user.id)

    return Reply(
        id=reply.id,
        author=author,
        body=reply.body,
        created_at=reply.created_at,
        helpful_count=0,
        marked_helpful_by_me=False,
        read_context=reply.read_context,
    )


def _helpful_state(db: Session, reply_id: int, user_id: int) -> HelpfulState:
    count = len(
        db.scalars(
            select(ReplyHelpful.id).where(ReplyHelpful.reply_id == reply_id)
        ).all()
    )
    marked = (
        db.scalar(
            select(ReplyHelpful.id).where(
                ReplyHelpful.reply_id == reply_id,
                ReplyHelpful.user_id == user_id,
            )
        )
        is not None
    )
    return HelpfulState(helpful_count=count, marked_helpful_by_me=marked)


@router.put("/replies/{reply_id}/helpful", response_model=HelpfulState)
def mark_helpful(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reply = db.get(ReplyModel, reply_id)
    if reply is None:
        raise HTTPException(status_code=404, detail="Reply not found.")

    if reply.author_id == current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot mark your own reply as helpful.",
        )

    existing = db.scalar(
        select(ReplyHelpful).where(
            ReplyHelpful.reply_id == reply_id,
            ReplyHelpful.user_id == current_user.id,
        )
    )
    if existing is None:
        db.add(
            ReplyHelpful(
                reply_id=reply_id,
                user_id=current_user.id,
                created_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    return _helpful_state(db, reply_id, current_user.id)


@router.delete("/replies/{reply_id}/helpful", response_model=HelpfulState)
def unmark_helpful(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reply = db.get(ReplyModel, reply_id)
    if reply is None:
        raise HTTPException(status_code=404, detail="Reply not found.")

    existing = db.scalar(
        select(ReplyHelpful).where(
            ReplyHelpful.reply_id == reply_id,
            ReplyHelpful.user_id == current_user.id,
        )
    )
    if existing is not None:
        db.delete(existing)
        db.commit()

    return _helpful_state(db, reply_id, current_user.id)


@router.get("/shared/{session_id}", response_model=SharedSitting)
def get_shared_sitting(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.get(MeditationSession, session_id)
    # place holder will later add condition if session is attached to a thread
    if session is None:
        raise HTTPException(status_code=404, detail="Sitting not found.")

    if session.user_id != current_user.id:
        record_view(db, current_user.id, session.id)
        db.commit()

    element_id = None
    if session.elements:
        element_id = min(session.elements, key=lambda e: e.id).element_id

    thread = db.scalar(
        select(Thread).where(Thread.session_id == session.id)
    )

    author = author_summary(db, session.user_id)

    return SharedSitting(
        session_id=session.id,
        author=author,
        started_at=session.started_at,
        mode=session.mode,
        intent_id=session.intent_id,
        element_id=element_id,
        duration_seconds=session.duration_seconds or 0,
        planned_seconds=session.planned_seconds,
        environment=session.environment,
        sound=session.sound,
        timer_visible=session.timer_visible,
        returns=list(session.returns or []),
        note=session.note,
        thread_id=thread.id if thread is not None else None,
    )


@router.get("/practitioners/{user_id}", response_model=Practitioner)
def get_practitioner(
    user_id: int,
    tz: str = Query(default="UTC"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Practitioner not found.")

    author = author_summary(db, user_id)
    stats = compute_stats(db, user_id, tz)

    shared_sessions = db.scalars(
        select(MeditationSession).where(
            MeditationSession.user_id == user_id,
            MeditationSession.completed_at.isnot(None),
        )
        .order_by(MeditationSession.started_at.desc())
    ).all()

    shared_sittings = [
        build_attached_sitting(db, s) for s in shared_sessions
    ]

    latest_thread = db.scalar(
        select(Thread)
        .where(Thread.author_id == user_id)
        .order_by(Thread.created_at.desc())
        .limit(1)
    )

    return Practitioner(
        author=author,
        location=user.location,
        bio=user.bio,
        stats=stats,
        shared_sittings=shared_sittings,
        open_thread_id=latest_thread.id if latest_thread is not None else None,
    )


@router.get("/hours", response_model=Hours)
def get_hours(
    tz: str = Query(default="UTC"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_hours(db, current_user.id, tz)
