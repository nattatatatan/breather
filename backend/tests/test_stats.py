from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.models.environment import Environment
from app.models.meditation_element import MeditationElement
from app.models.meditation_session import MeditationSession
from app.models.practice_mode import PracticeMode
from app.models.session_element import SessionElement
from app.models.visibility import Visibility
from app.models.sound import Sound


def _user_id(client, sub: str) -> int:
    client.set_user(sub)
    return client.get("/api/me").json()["id"]


def _element_id(db, slug: str) -> int:
    return db.scalar(
        select(MeditationElement.id).where(MeditationElement.slug == slug)
    )


def _insert_session(
    db,
    user_id: int,
    *,
    started_at: datetime,
    duration_seconds: int,
    mode: PracticeMode = PracticeMode.SAMATHA,
    element_slugs: tuple[str, ...] = ("breath",),
    visibility: Visibility = Visibility.PRIVATE,
    completed: bool = True,
) -> MeditationSession:
    session = MeditationSession(
        user_id=user_id,
        started_at=started_at,
        planned_seconds=duration_seconds,
        mode=mode,
        environment=Environment.STILL,
        sound=Sound.SILENT,
        timer_visible=False,
        returns=[],
        visibility=visibility,
    )
    if completed:
        session.duration_seconds = duration_seconds
        session.completed_at = started_at + timedelta(seconds=duration_seconds)
    for slug in element_slugs:
        session.elements.append(
            SessionElement(element_id=_element_id(db, slug))
        )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def test_stats_totals_longest_and_shared_count(client, db):
    user_id = _user_id(client, "u-stats-totals")
    now = datetime.now(timezone.utc)

    _insert_session(db, user_id, started_at=now - timedelta(days=2), duration_seconds=600)
    _insert_session(
        db,
        user_id,
        started_at=now - timedelta(days=1),
        duration_seconds=1800,
        visibility=Visibility.COMMUNITY,
    )
    # An incomplete session must not count at all.
    _insert_session(db, user_id, started_at=now, duration_seconds=900, completed=False)

    stats = client.get("/api/me/stats").json()
    assert stats["session_count"] == 2
    assert stats["total_seconds"] == 2400
    assert stats["longest_seconds"] == 1800
    assert stats["shared_count"] == 1


def test_stats_mode_split_and_by_element(client, db):
    user_id = _user_id(client, "u-stats-split")
    now = datetime.now(timezone.utc)

    _insert_session(
        db, user_id, started_at=now - timedelta(days=1), duration_seconds=1000,
        mode=PracticeMode.SAMATHA, element_slugs=("breath",),
    )
    _insert_session(
        db, user_id, started_at=now - timedelta(days=2), duration_seconds=500,
        mode=PracticeMode.VIPASSANA, element_slugs=("light",),
    )

    stats = client.get("/api/me/stats").json()
    mode_split = {m["mode"]: m["seconds"] for m in stats["mode_split"]}
    assert mode_split == {"samatha": 1000, "vipassana": 500}

    by_element = {e["element_id"]: e["seconds"] for e in stats["by_element"]}
    breath_id = _element_id(db, "breath")
    light_id = _element_id(db, "light")
    assert by_element[breath_id] == 1000
    assert by_element[light_id] == 500
    # sorted desc by seconds
    assert stats["by_element"][0]["element_id"] == breath_id


def test_stats_month_seconds_uses_tz(client, db):
    user_id = _user_id(client, "u-stats-month")
    tz = ZoneInfo("Asia/Bangkok")
    now_local = datetime.now(tz)

    # A session at 00:30 local time on the 1st of this month is 17:30 UTC
    # the day before - still counts as "this month" in Bangkok time.
    first_of_month_local = now_local.replace(
        day=1, hour=0, minute=30, second=0, microsecond=0
    )
    _insert_session(
        db,
        user_id,
        started_at=first_of_month_local.astimezone(timezone.utc),
        duration_seconds=1200,
    )

    stats = client.get("/api/me/stats", params={"tz": "Asia/Bangkok"}).json()
    assert stats["month_seconds"] == 1200


def test_stats_streak_counts_consecutive_local_days(client, db):
    user_id = _user_id(client, "u-stats-streak")
    tz = ZoneInfo("Asia/Bangkok")
    today_local = datetime.now(tz).date()

    for offset in (0, 1, 2):
        day = today_local - timedelta(days=offset)
        started_local = datetime(day.year, day.month, day.day, 8, 0, tzinfo=tz)
        _insert_session(
            db, user_id, started_at=started_local.astimezone(timezone.utc),
            duration_seconds=600,
        )

    stats = client.get("/api/me/stats", params={"tz": "Asia/Bangkok"}).json()
    assert stats["current_streak_days"] == 3


def test_stats_streak_is_zero_when_gap_before_yesterday(client, db):
    user_id = _user_id(client, "u-stats-streak-gap")
    tz = ZoneInfo("Asia/Bangkok")
    today_local = datetime.now(tz).date()

    stale_day = today_local - timedelta(days=5)
    started_local = datetime(
        stale_day.year, stale_day.month, stale_day.day, 8, 0, tzinfo=tz
    )
    _insert_session(
        db, user_id, started_at=started_local.astimezone(timezone.utc),
        duration_seconds=600,
    )

    stats = client.get("/api/me/stats", params={"tz": "Asia/Bangkok"}).json()
    assert stats["current_streak_days"] == 0
