from datetime import datetime, timezone

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models.meditation_session import MeditationSession
from app.models.reply import Reply
from app.models.session_element import SessionElement
from app.models.shared_sitting_view import SharedSittingView
from app.models.user import User
from app.schemas.circle import AttachedSitting, Hours, HoursEntry
from app.services.tz import resolve_zone

LONG_PRACTITIONER_SECONDS = 300 * 3600


def _user_totals_subquery():
    return (
        select(
            MeditationSession.user_id.label("user_id"),
            func.sum(MeditationSession.duration_seconds).label("total_seconds"),
        )
        .where(MeditationSession.completed_at.isnot(None))
        .group_by(MeditationSession.user_id)
        .subquery()
    )


def reply_aggregates(
    db: Session, thread_ids: list[int]
) -> dict[int, tuple[int, int]]:
    """Return {thread_id: (reply_count, long_practitioner_reply_count)} for
    all given threads in one query (avoids per-thread N+1 queries)."""
    unique_ids = list(dict.fromkeys(thread_ids))
    if not unique_ids:
        return {}

    user_totals = _user_totals_subquery()

    rows = db.execute(
        select(
            Reply.thread_id,
            func.coalesce(user_totals.c.total_seconds, 0),
        ).outerjoin(user_totals, user_totals.c.user_id == Reply.author_id)
        .where(Reply.thread_id.in_(unique_ids))
    ).all()

    counts: dict[int, int] = {}
    long_counts: dict[int, int] = {}
    for thread_id, total_seconds in rows:
        counts[thread_id] = counts.get(thread_id, 0) + 1
        if (total_seconds or 0) >= LONG_PRACTITIONER_SECONDS:
            long_counts[thread_id] = long_counts.get(thread_id, 0) + 1

    return {
        thread_id: (counts.get(thread_id, 0), long_counts.get(thread_id, 0))
        for thread_id in unique_ids
    }


def is_long_practitioner(db: Session, user_id: int) -> bool:
    total = db.scalar(
        select(func.coalesce(func.sum(MeditationSession.duration_seconds), 0)).where(
            MeditationSession.user_id == user_id,
            MeditationSession.completed_at.isnot(None),
        )
    )
    return (total or 0) >= LONG_PRACTITIONER_SECONDS


def build_attached_sitting(
    db: Session, session: MeditationSession | None
) -> AttachedSitting | None:
    if session is None:
        return None

    element_id = db.scalar(
        select(SessionElement.element_id)
        .where(SessionElement.session_id == session.id)
        .order_by(SessionElement.id)
        .limit(1)
    )

    return AttachedSitting(
        session_id=session.id,
        started_at=session.started_at,
        mode=session.mode,
        element_id=element_id,
        intent_id=session.intent_id,
        duration_seconds=session.duration_seconds or 0,
        return_count=len(session.returns or []),
    )


def has_read_sitting(db: Session, viewer_id: int, session_id: int) -> bool:
    return (
        db.scalar(
            select(SharedSittingView.id).where(
                SharedSittingView.viewer_id == viewer_id,
                SharedSittingView.session_id == session_id,
            )
        )
        is not None
    )


def record_view(db: Session, viewer_id: int, session_id: int) -> None:
    db.add(
        SharedSittingView(
            viewer_id=viewer_id,
            session_id=session_id,
            viewed_at=datetime.now(timezone.utc),
        )
    )


def compute_hours(db: Session, user_id: int, tz: str) -> Hours:
    zone = resolve_zone(tz)
    now_local = datetime.now(zone)

    month_start_local = now_local.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    if now_local.month == 12:
        next_month_local = month_start_local.replace(
            year=now_local.year + 1, month=1
        )
    else:
        next_month_local = month_start_local.replace(month=now_local.month + 1)

    month_start_utc = month_start_local.astimezone(timezone.utc)
    month_end_utc = next_month_local.astimezone(timezone.utc)

    rows = db.execute(
        select(
            MeditationSession.user_id,
            func.sum(MeditationSession.duration_seconds),
        )
        .where(
            MeditationSession.completed_at.isnot(None),
            MeditationSession.completed_at >= month_start_utc,
            MeditationSession.completed_at < month_end_utc,
        )
        .group_by(MeditationSession.user_id)
    ).all()

    totals = {uid: (seconds or 0) for uid, seconds in rows}
    ranked = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)

    ranked_ids = [uid for uid, _ in ranked]
    users = (
        db.scalars(select(User).where(User.id.in_(ranked_ids))).all()
        if ranked_ids
        else []
    )
    name_map = {u.id: u.display_name for u in users}

    entries = [
        HoursEntry(
            rank=i + 1,
            user_id=uid,
            display_name=name_map.get(uid, ""),
            seconds=seconds,
            is_me=(uid == user_id),
        )
        for i, (uid, seconds) in enumerate(ranked[:5])
    ]

    me_entry = None
    my_seconds = totals.get(user_id, 0)
    if my_seconds > 0:
        my_rank = next(
            (i + 1 for i, (uid, _) in enumerate(ranked) if uid == user_id),
            None,
        )
        me_entry = HoursEntry(
            rank=my_rank,
            user_id=user_id,
            display_name=name_map.get(user_id, ""),
            seconds=my_seconds,
            is_me=True,
        )

    sitting_now = db.scalar(
        select(func.count())
        .select_from(MeditationSession)
        .where(
            MeditationSession.completed_at.is_(None),
            text(
                "meditation_sessions.started_at + "
                "(meditation_sessions.planned_seconds * interval '1 second') "
                "> now()"
            ),
        )
    ) or 0

    return Hours(
        month=f"{now_local.year:04d}-{now_local.month:02d}",
        entries=entries,
        me=me_entry,
        sitting_now=sitting_now,
    )
