"""Idempotent demo data: fake practitioners, a spread of completed sessions,
Mai's shared sitting, and the sample circle threads from the design boards.

Run with: python -m app.db.seed_demo

Requires the catalog (elements/intents) to already be seeded - run
app.db.seed_elements and app.db.seed_intents first (the e2e stack script
does this for you).
"""
import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from app.db.db import SessionLocal
from app.models.environment import Environment
from app.models.intent import Intent
from app.models.meditation_element import MeditationElement
from app.models.meditation_session import MeditationSession
from app.models.practice_mode import PracticeMode
from app.models.reply import Reply
from app.models.reply_helpful import ReplyHelpful
from app.models.session_element import SessionElement
from app.models.visibility import Visibility
from app.models.sound import Sound
from app.models.thread import Thread
from app.models.user import User

RNG_SEED = 20260101


def _months_ago(today: date, months: int) -> date:
    month_index = today.month - 1 - months
    year = today.year + month_index // 12
    month = month_index % 12 + 1
    day = min(today.day, 28)
    return date(year, month, day)


def _years_ago(today: date, years: int) -> date:
    return date(today.year - years, today.month, min(today.day, 28))


def _element(db, slug: str) -> MeditationElement:
    el = db.scalar(select(MeditationElement).where(MeditationElement.slug == slug))
    if el is None:
        raise RuntimeError(
            f"Meditation element '{slug}' not found. "
            "Run `python -m app.db.seed_elements` first."
        )
    return el


def _intent(db, slug: str) -> Intent:
    it = db.scalar(select(Intent).where(Intent.slug == slug))
    if it is None:
        raise RuntimeError(
            f"Intent '{slug}' not found. Run `python -m app.db.seed_intents` first."
        )
    return it


def _get_or_create_user(
    db,
    *,
    auth_provider_id: str,
    display_name: str,
    practising_since: date,
    location: str | None = None,
    bio: str | None = None,
) -> User:
    user = db.scalar(select(User).where(User.auth_provider_id == auth_provider_id))
    if user is not None:
        return user

    user = User(
        auth_provider_id=auth_provider_id,
        display_name=display_name,
        practising_since=practising_since,
        location=location,
        bio=bio,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()
    return user


def _add_session(
    db,
    user: User,
    *,
    started_at: datetime,
    planned_seconds: int,
    mode: PracticeMode,
    element_slugs: list[str],
    intent_slug: str | None = None,
    environment: Environment = Environment.STILL,
    sound: Sound = Sound.SILENT,
    visibility: Visibility = Visibility.PRIVATE,
    returns: list[int] | None = None,
    note: str | None = None,
    completed: bool = True,
) -> MeditationSession:
    intent_obj = _intent(db, intent_slug) if intent_slug else None

    session = MeditationSession(
        user_id=user.id,
        started_at=started_at,
        planned_seconds=planned_seconds,
        mode=mode,
        intent_id=intent_obj.id if intent_obj else None,
        environment=environment,
        sound=sound,
        timer_visible=False,
        returns=returns or [],
        note=note,
        visibility=visibility,
    )

    if completed:
        session.duration_seconds = planned_seconds
        session.completed_at = started_at + timedelta(seconds=planned_seconds)

    for slug in element_slugs:
        session.elements.append(SessionElement(element_id=_element(db, slug).id))

    db.add(session)
    db.flush()
    return session


def _seed_session_history(
    db,
    user: User,
    since: date,
    target_hours: float,
    profiles: list[tuple[float, dict]],
) -> None:
    """Spread plausible completed sessions across a user's tenure so that
    stats/hours/leaderboards look real. Skips entirely if the user already
    has any sessions (idempotency)."""
    already = db.scalar(
        select(func.count(MeditationSession.id)).where(
            MeditationSession.user_id == user.id
        )
    )
    if already:
        return

    rng = random.Random(f"{RNG_SEED}:{user.auth_provider_id}")

    durations = [600, 900, 1200, 1500, 1800, 2400, 3000]

    target_seconds = int(target_hours * 3600)
    avg_seconds = sum(durations) / len(durations)
    count = max(int(target_seconds / avg_seconds), 12)

    today = datetime.now(timezone.utc).date()
    span_days = max((today - since).days, 1)

    weights = [w for w, _ in profiles]
    choices = [p for _, p in profiles]

    hours_of_day = [6, 7, 8, 19, 20, 21]
    minutes = [0, 10, 15, 20, 30, 40, 45]

    current_month_sessions = 5

    for i in range(count):
        if i < current_month_sessions:
            # Guarantee recent activity so /circle/hours has data. Never
            # today - avoids landing in the future relative to "now".
            day_offset = rng.randint(1, min(21, span_days))
            day = today - timedelta(days=day_offset)
        else:
            day_offset = rng.randint(1, span_days)
            day = since + timedelta(days=day_offset)

        started_at = datetime(
            day.year,
            day.month,
            day.day,
            rng.choice(hours_of_day),
            rng.choice(minutes),
            tzinfo=timezone.utc,
        )

        profile = rng.choices(choices, weights=weights, k=1)[0]
        duration = rng.choice(durations)

        _add_session(
            db,
            user,
            started_at=started_at,
            planned_seconds=duration,
            **profile,
        )


def _get_or_create_thread(
    db,
    *,
    author: User,
    title: str,
    body: str,
    created_at: datetime,
    mode: PracticeMode | None = None,
    element_slug: str | None = None,
    session: MeditationSession | None = None,
) -> tuple[Thread, bool]:
    existing = db.scalar(select(Thread).where(Thread.title == title))
    if existing is not None:
        return existing, False

    thread = Thread(
        author_id=author.id,
        title=title,
        body=body,
        created_at=created_at,
        mode=mode,
        element_id=_element(db, element_slug).id if element_slug else None,
        session_id=session.id if session is not None else None,
    )
    db.add(thread)
    db.flush()
    return thread, True


def _add_reply(
    db, thread: Thread, author: User, body: str, created_at: datetime, read_context: bool
) -> Reply:
    reply = Reply(
        thread_id=thread.id,
        author_id=author.id,
        body=body,
        created_at=created_at,
        read_context=read_context,
    )
    db.add(reply)
    db.flush()
    return reply


def _mark_helpful(db, reply: Reply, user: User) -> None:
    existing = db.scalar(
        select(ReplyHelpful).where(
            ReplyHelpful.reply_id == reply.id, ReplyHelpful.user_id == user.id
        )
    )
    if existing is not None:
        return
    db.add(
        ReplyHelpful(
            reply_id=reply.id,
            user_id=user.id,
            created_at=datetime.now(timezone.utc),
        )
    )


def _last_weekday(today: date, weekday: int) -> date:
    """Most recent date strictly before today that falls on `weekday`
    (Monday=0 .. Sunday=6)."""
    offset = (today.weekday() - weekday) % 7
    offset = offset or 7
    return today - timedelta(days=offset)


def seed() -> None:
    with SessionLocal() as db:
        today = datetime.now(timezone.utc).date()

        mai = _get_or_create_user(
            db,
            auth_provider_id="demo:mai",
            display_name="Mai",
            practising_since=date(2025, 7, 1),
            location="Bangkok",
            bio=(
                "Breath most mornings before work. No teacher yet, "
                "one weekend retreat."
            ),
        )
        ari = _get_or_create_user(
            db,
            auth_provider_id="demo:ari",
            display_name="Ari",
            practising_since=date(2020, 5, 1),
            bio="Metta most days.",
        )
        nong = _get_or_create_user(
            db,
            auth_provider_id="demo:nong",
            display_name="Nong",
            practising_since=_years_ago(today, 2),
            bio="Vipassana practice.",
        )
        thira = _get_or_create_user(
            db,
            auth_provider_id="demo:thira",
            display_name="Thira",
            practising_since=_years_ago(today, 4),
            bio="Fire kasina.",
        )
        noor = _get_or_create_user(
            db,
            auth_provider_id="demo:noor",
            display_name="Noor",
            practising_since=_months_ago(today, 8),
            bio="New to vipassana.",
        )

        # Extra quiet demo users, used only to make Ari's reply's helpful
        # count realistic (14 marks from people other than the replier).
        quiet_users = [
            _get_or_create_user(
                db,
                auth_provider_id=f"demo:quiet{i}",
                display_name=f"Practitioner {i}",
                practising_since=_months_ago(today, rng_months),
            )
            for i, rng_months in enumerate(
                [3, 5, 9, 14, 18, 22, 30, 36, 44, 50], start=1
            )
        ]

        db.flush()

        # --- session history -------------------------------------------------
        _seed_session_history(
            db,
            mai,
            since=mai.practising_since,
            target_hours=138,
            profiles=[
                (0.70, dict(mode=PracticeMode.SAMATHA, element_slugs=["breath"], intent_slug="calm")),
                (0.15, dict(mode=PracticeMode.SAMATHA, element_slugs=["light"], intent_slug="clarity")),
                (0.15, dict(mode=PracticeMode.SAMATHA, element_slugs=["loving-kindness"], intent_slug="kindness")),
            ],
        )
        _seed_session_history(
            db,
            ari,
            since=ari.practising_since,
            target_hours=1240,
            profiles=[
                (0.85, dict(mode=PracticeMode.SAMATHA, element_slugs=["loving-kindness"], intent_slug="kindness")),
                (0.15, dict(mode=PracticeMode.SAMATHA, element_slugs=["breath"], intent_slug="calm")),
            ],
        )
        _seed_session_history(
            db,
            nong,
            since=nong.practising_since,
            target_hours=310,
            profiles=[
                (0.6, dict(mode=PracticeMode.VIPASSANA, element_slugs=["breath"], intent_slug="clarity")),
                (0.4, dict(mode=PracticeMode.VIPASSANA, element_slugs=["body"], intent_slug="clarity")),
            ],
        )
        _seed_session_history(
            db,
            thira,
            since=thira.practising_since,
            target_hours=600,
            profiles=[
                (0.6, dict(mode=PracticeMode.SAMATHA, element_slugs=["fire"], intent_slug="calm", environment=Environment.STILL)),
                (0.4, dict(mode=PracticeMode.SAMATHA, element_slugs=["fire"], intent_slug="calm", environment=Environment.DISSOLVE)),
            ],
        )
        _seed_session_history(
            db,
            noor,
            since=noor.practising_since,
            target_hours=40,
            profiles=[
                (1.0, dict(mode=PracticeMode.VIPASSANA, element_slugs=["breath"], intent_slug="clarity")),
            ],
        )

        db.flush()

        # --- Mai's shared Tuesday sitting -------------------------------------
        shared_session = db.scalar(
            select(MeditationSession).where(
                MeditationSession.user_id == mai.id,
                MeditationSession.note.isnot(None),
                MeditationSession.note.like("Said the phrases for my sister%"),
            )
        )
        if shared_session is None:
            tuesday = _last_weekday(today, weekday=1)
            started_at = datetime(
                tuesday.year, tuesday.month, tuesday.day, 19, 40, tzinfo=timezone.utc
            )
            shared_session = _add_session(
                db,
                mai,
                started_at=started_at,
                planned_seconds=30 * 60,
                mode=PracticeMode.SAMATHA,
                element_slugs=["breath"],
                intent_slug="kindness",
                visibility=Visibility.COMMUNITY,
                returns=[95, 240, 530],
                note=(
                    "Said the phrases for my sister and felt nothing for most "
                    "of it. Near the end something warm came for maybe two "
                    "minutes and then I lost it trying to hold on. Mostly it "
                    "felt like homework."
                ),
            )

        # --- circle threads ----------------------------------------------------
        thread1, created1 = _get_or_create_thread(
            db,
            author=mai,
            title="Metta feels like a script. How do you actually practise it?",
            body=(
                "I've been on the breath for about a year and that part is "
                "fine. Metta I don't understand. I say the phrases, I picture "
                "the person, and nothing happens - it's like reading a form "
                "out loud. Last night I set kindness as the intention and it "
                "went flat after a few minutes.\n\n"
                "I've attached the sitting so you can see what I actually did "
                "rather than guess. What am I missing?"
            ),
            created_at=shared_session.completed_at + timedelta(hours=10),
            mode=PracticeMode.SAMATHA,
            element_slug="breath",
            session=shared_session,
        )
        if created1:
            ari_reply = _add_reply(
                db,
                thread1,
                ari,
                (
                    "Your notes say the warmth came for about two minutes near "
                    "the end and then went. That's not a failure - that's the "
                    "whole practice showing up once. Everything before it was "
                    "you trying to manufacture it from the phrases.\n\n"
                    "The other thing I'd change: you're running breath as the "
                    "object with kindness as the intention. For a year of "
                    "samatha that's a fine pairing for calm, but metta wants a "
                    "being as the object. Put someone easy to love in the "
                    "centre - not yourself, not a difficult person - and let "
                    "the phrases be the way back when attention drifts, not "
                    "the practice itself.\n\n"
                    "Next sit: start from the two warm minutes. Find that "
                    "feeling first, however small, then say one phrase to keep "
                    "it there."
                ),
                created_at=thread1.created_at + timedelta(hours=2),
                read_context=True,
            )
            for helper_user in [mai, nong, thira, noor, *quiet_users]:
                _mark_helpful(db, ari_reply, helper_user)

            _add_reply(
                db,
                thread1,
                nong,
                (
                    "Also worth saying - your three returns are all in the "
                    "first ten minutes. You were settling, not failing. I'd "
                    "give it twenty before judging anything."
                ),
                created_at=thread1.created_at + timedelta(hours=3),
                read_context=False,
            )

        thread2, created2 = _get_or_create_thread(
            db,
            author=thira,
            title="Fire kasina: the afterimage keeps drifting. Do I follow it or drop it?",
            body=(
                "Every sit the afterimage drifts up and to the left within a "
                "minute or two. I've been chasing it back to centre, but that "
                "seems to be the thing that breaks concentration rather than "
                "the drift itself. Do I let it wander and keep attending to "
                "whatever image is there, or keep re-centring on the original "
                "spot on the wall?"
            ),
            created_at=datetime.now(timezone.utc) - timedelta(days=1, hours=4),
            mode=PracticeMode.SAMATHA,
            element_slug="fire",
        )
        if created2:
            _add_reply(
                db,
                thread2,
                ari,
                (
                    "Follow it. The nimitta moving is normal in the early "
                    "stages - chasing it back to a fixed point is you adding "
                    "effort the practice doesn't need. Let it settle on its "
                    "own pace."
                ),
                created_at=thread2.created_at + timedelta(hours=5),
                read_context=False,
            )

        thread3, created3 = _get_or_create_thread(
            db,
            author=noor,
            title="Switched from noting to breath and everything got duller. Normal?",
            body=(
                "I'd been noting for a couple of months and things felt sharp, "
                "if a bit tiring. My teacher suggested resting on the breath "
                "instead and now every sit feels flat and sleepy. Is this a "
                "normal adjustment or a sign I'm doing the breath instruction "
                "wrong?"
            ),
            created_at=datetime.now(timezone.utc) - timedelta(days=2, hours=6),
            mode=PracticeMode.VIPASSANA,
        )
        if created3:
            _add_reply(
                db,
                thread3,
                nong,
                (
                    "Normal for the first couple of weeks. Noting keeps the "
                    "mind busy labelling, so dropping it can feel like losing "
                    "an anchor. Give it ten days before deciding it isn't "
                    "working."
                ),
                created_at=thread3.created_at + timedelta(hours=8),
                read_context=False,
            )

        # --- in-progress sessions, so /circle/hours sitting_now > 0 ------------
        now = datetime.now(timezone.utc)
        for user in (nong, thira):
            in_progress = db.scalar(
                select(MeditationSession).where(
                    MeditationSession.user_id == user.id,
                    MeditationSession.completed_at.is_(None),
                )
            )
            if in_progress is None:
                _add_session(
                    db,
                    user,
                    started_at=now - timedelta(minutes=5),
                    planned_seconds=20 * 60,
                    mode=PracticeMode.SAMATHA
                    if user is thira
                    else PracticeMode.VIPASSANA,
                    element_slugs=["fire"] if user is thira else ["breath"],
                    intent_slug="calm",
                    completed=False,
                )

        db.commit()
        print("Demo data seeded.")


if __name__ == "__main__":
    seed()
