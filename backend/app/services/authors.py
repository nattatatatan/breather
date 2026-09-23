from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.meditation_session import MeditationSession
from app.models.practice_mode import PracticeMode
from app.models.session_element import SessionElement
from app.models.user import User
from app.schemas.circle import AuthorSummary


def author_summaries(db: Session, user_ids: list[int]) -> dict[int, AuthorSummary]:
    """Batch-build AuthorSummary for a set of users in a fixed number of
    queries, regardless of how many users are requested (avoids N+1)."""
    unique_ids = sorted(set(user_ids))
    if not unique_ids:
        return {}

    users = db.scalars(select(User).where(User.id.in_(unique_ids))).all()
    user_map = {u.id: u for u in users}

    mode_rows = db.execute(
        select(
            MeditationSession.user_id,
            MeditationSession.mode,
            func.sum(MeditationSession.duration_seconds),
        )
        .where(
            MeditationSession.user_id.in_(unique_ids),
            MeditationSession.completed_at.isnot(None),
        )
        .group_by(MeditationSession.user_id, MeditationSession.mode)
    ).all()

    element_rows = db.execute(
        select(
            MeditationSession.user_id,
            SessionElement.element_id,
            func.sum(MeditationSession.duration_seconds),
        )
        .join(SessionElement, SessionElement.session_id == MeditationSession.id)
        .where(
            MeditationSession.user_id.in_(unique_ids),
            MeditationSession.completed_at.isnot(None),
        )
        .group_by(MeditationSession.user_id, SessionElement.element_id)
    ).all()

    totals: dict[int, int] = {}
    primary_mode: dict[int, tuple[PracticeMode, int]] = {}
    for user_id, mode, seconds in mode_rows:
        seconds = seconds or 0
        totals[user_id] = totals.get(user_id, 0) + seconds
        best = primary_mode.get(user_id)
        if best is None or seconds > best[1]:
            primary_mode[user_id] = (mode, seconds)

    primary_element: dict[int, tuple[int, int]] = {}
    for user_id, element_id, seconds in element_rows:
        seconds = seconds or 0
        best = primary_element.get(user_id)
        if best is None or seconds > best[1]:
            primary_element[user_id] = (element_id, seconds)

    result: dict[int, AuthorSummary] = {}
    for user_id in unique_ids:
        user = user_map.get(user_id)
        if user is None:
            continue
        result[user_id] = AuthorSummary(
            id=user.id,
            display_name=user.display_name,
            initial=(user.display_name[:1] or "?").upper(),
            practising_since=user.practising_since,
            total_seconds=totals.get(user_id, 0),
            primary_mode=primary_mode.get(user_id, (None, 0))[0],
            primary_element_id=primary_element.get(user_id, (None, 0))[0],
        )

    return result


def author_summary(db: Session, user_id: int) -> AuthorSummary | None:
    return author_summaries(db, [user_id]).get(user_id)
