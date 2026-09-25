import os
import subprocess
import sys
from pathlib import Path
from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.meditation_session import MeditationSession
from app.models.practice_mode import PracticeMode
from app.models.visibility import Visibility
from app.models.user import User
from app.models.thread import Thread

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_DB_NAME = "stay_test"
TEST_DATABASE_URL = (
    f"postgresql+psycopg://app:app@localhost:5432/{TEST_DB_NAME}"
)

# Must happen before any `app.*` import anywhere in the test session, since
# app.config.config.Settings() (and the SQLAlchemy engine built from it) are
# instantiated at import time.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

DATA_TABLES = [
    "reply_helpful",
    "replies",
    "threads",
    "shared_sitting_views",
    "session_elements",
    "meditation_sessions",
    "practice_profiles",
    "users",
]


def _psql(sql: str, dbname: str = "postgres") -> None:
    subprocess.run(
        [
            "docker", "exec", "breather-db",
            "psql", "-U", "app", "-d", dbname,
            "-v", "ON_ERROR_STOP=1", "-c", sql,
        ],
        check=True,
        capture_output=True,
        text=True,
    )


@pytest.fixture(scope="session", autouse=True)
def _test_database():
    _psql(f"DROP DATABASE IF EXISTS {TEST_DB_NAME} WITH (FORCE);")
    _psql(f"CREATE DATABASE {TEST_DB_NAME};")

    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        check=True,
        env=os.environ.copy(),
    )

    from app.db.seed_elements import seed as seed_elements
    from app.db.seed_intents import seed as seed_intents

    seed_elements()
    seed_intents()

    yield


@pytest.fixture(autouse=True)
def _clean_tables():
    """Truncate all mutable data before every test so tests don't leak into
    each other. The catalog tables (intents/meditation_elements) are seeded
    once per session and left alone."""
    from app.db.db import engine

    with engine.begin() as conn:
        conn.execute(
            text(
                f"TRUNCATE {', '.join(DATA_TABLES)} RESTART IDENTITY CASCADE"
            )
        )
    yield


@pytest.fixture
def db():
    from app.db.db import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.auth.dep import get_current_user_claims
    from app.main import app

    holder = {"claims": {"sub": "test-default-user"}}

    def _override():
        return holder["claims"]

    app.dependency_overrides[get_current_user_claims] = _override

    test_client = TestClient(app)

    def set_user(sub: str, email: str | None = None, display_name: str | None = None):
        claims: dict = {"sub": sub}
        if email:
            claims["email"] = email
        if display_name:
            claims["user_metadata"] = {"display_name": display_name}
        holder["claims"] = claims

    test_client.set_user = set_user  # type: ignore[attr-defined]

    yield test_client

    app.dependency_overrides.pop(get_current_user_claims, None)


@pytest.fixture
def user(db: Session) -> User:
    user = User(
        auth_provider_id="test-user",
        display_name="Test User",
        practising_since=date.today(),
        visibility=Visibility.PRIVATE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_completed_session(
    db: Session,
    user: User,
    visibility: Visibility = Visibility.PRIVATE,
) -> MeditationSession:
    session = MeditationSession(
        user_id=user.id,
        mode=PracticeMode.SAMATHA,
        started_at=datetime.now(timezone.utc) - timedelta(minutes=20),
        completed_at=datetime.now(timezone.utc),
        duration_seconds=1200,
        visibility=visibility,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session

def create_thread(
    db: Session,
    user: User,
    session: MeditationSession | None = None,
) -> Thread:
    thread = Thread(
        author_id=user.id,
        title="Test thread",
        body="Test body",
        mode=session.mode if session else PracticeMode.SAMATHA,
        session_id=session.id if session else None,
    )

    db.add(thread)
    db.commit()
    db.refresh(thread)

    return thread