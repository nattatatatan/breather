from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.meditation_session import MeditationSession
from app.models.practice_mode import PracticeMode
from app.models.session_element import SessionElement
from app.models.visibility import Visibility
from app.schemas.me import ByElementItem, ModeSplitItem, PracticeStats
from app.services.tz import resolve_zone

LONG_PRACTITIONER_SECONDS = 300 * 3600


def _streak_length(local_dates: set[date], today_local: date) -> int:
    if today_local in local_dates:
        cursor = today_local
    elif (today_local - timedelta(days=1)) in local_dates:
        cursor = today_local - timedelta(days=1)
    else:
        return 0

    streak = 0
    while cursor in local_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def compute_stats(db: Session, user_id: int, tz: str) -> PracticeStats:
    zone = resolve_zone(tz)

    sessions = db.scalars(
        select(MeditationSession).where(
            MeditationSession.user_id == user_id,
            MeditationSession.completed_at.isnot(None),
        )
    ).all()

    total_seconds = sum(s.duration_seconds or 0 for s in sessions)
    longest_seconds = max((s.duration_seconds or 0 for s in sessions), default=0)
    session_count = len(sessions)
    shared_count = sum(
        1 for s in sessions if s.visibility == Visibility.COMMUNITY
    )

    now_local_dt = datetime.now(zone)
    today_local = now_local_dt.date()
    month_key = (today_local.year, today_local.month)

    month_seconds = 0
    local_dates: set[date] = set()
    mode_totals: dict[PracticeMode, int] = {}

    for s in sessions:
        local_dt = s.completed_at.astimezone(zone)
        local_dates.add(local_dt.date())
        if (local_dt.year, local_dt.month) == month_key:
            month_seconds += s.duration_seconds or 0
        mode_totals[s.mode] = mode_totals.get(s.mode, 0) + (s.duration_seconds or 0)

    current_streak_days = _streak_length(local_dates, today_local)

    mode_split = [
        ModeSplitItem(mode=mode, seconds=mode_totals.get(mode, 0))
        for mode in (PracticeMode.SAMATHA, PracticeMode.VIPASSANA)
    ]

    element_totals: dict[int, int] = {}
    if sessions:
        session_ids = [s.id for s in sessions]
        rows = db.execute(
            select(SessionElement.element_id, MeditationSession.duration_seconds)
            .join(
                MeditationSession,
                MeditationSession.id == SessionElement.session_id,
            )
            .where(SessionElement.session_id.in_(session_ids))
        ).all()
        for element_id, duration in rows:
            element_totals[element_id] = element_totals.get(
                element_id, 0
            ) + (duration or 0)

    by_element = [
        ByElementItem(element_id=element_id, seconds=seconds)
        for element_id, seconds in sorted(
            element_totals.items(), key=lambda kv: kv[1], reverse=True
        )
    ]

    return PracticeStats(
        total_seconds=total_seconds,
        longest_seconds=longest_seconds,
        session_count=session_count,
        shared_count=shared_count,
        current_streak_days=current_streak_days,
        month_seconds=month_seconds,
        mode_split=mode_split,
        by_element=by_element,
    )
