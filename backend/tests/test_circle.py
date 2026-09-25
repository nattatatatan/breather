from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.environment import Environment
from app.models.meditation_element import MeditationElement
from app.models.meditation_session import MeditationSession
from app.models.practice_mode import PracticeMode
from app.models.session_element import SessionElement
from app.models.visibility import Visibility
from app.models.sound import Sound
from app.services.circle import LONG_PRACTITIONER_SECONDS
from app.models.user import User


def _user_id(client, sub: str, display_name: str | None = None) -> int:
    client.set_user(sub, display_name=display_name)
    return client.get("/api/me").json()["id"]


def _element_id(db, slug: str) -> int:
    return db.scalar(
        select(MeditationElement.id).where(MeditationElement.slug == slug)
    )


def _insert_completed_session(
    db,
    user_id: int,
    *,
    started_at: datetime,
    duration_seconds: int,
    mode: PracticeMode = PracticeMode.SAMATHA,
    element_slugs: tuple[str, ...] = ("breath",),
    visibility: Visibility = Visibility.PRIVATE,
    returns: list[int] | None = None,
    note: str | None = None,
) -> MeditationSession:
    session = MeditationSession(
        user_id=user_id,
        started_at=started_at,
        planned_seconds=duration_seconds,
        duration_seconds=duration_seconds,
        completed_at=started_at + timedelta(seconds=duration_seconds),
        mode=mode,
        environment=Environment.STILL,
        sound=Sound.SILENT,
        timer_visible=False,
        returns=returns or [],
        note=note,
        visibility=visibility,
    )
    for slug in element_slugs:
        session.elements.append(SessionElement(element_id=_element_id(db, slug)))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def test_create_thread_with_attached_completed_session(client):
    client.set_user("u-thread-owner")
    element_id = client.get("/api/elements").json()[0]["id"]
    session_resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [element_id],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "still",
            "sound": "silent",
            "timer_visible": False,
        },
    ).json()
    client.post(f"/api/sessions/{session_resp['id']}/complete", json={"returns": []})

    resp = client.post(
        "/api/circle/threads",
        json={
            "title": "How do you settle before a sit?",
            "body": "Curious what people do.",
            "session_id": session_resp["id"],
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["attached"]["session_id"] == session_resp["id"]
    assert body["attached"]["return_count"] == 0
    assert body["reply_count"] == 0

    # Attaching does not change the session's diary visibility.
    session_after = client.get(f"/api/sessions/{session_resp['id']}").json()
    assert session_after["thread_id"] == body["id"]
    assert session_after["visibility"] == "private"

def test_create_thread_rejects_incomplete_session(client):
    client.set_user("u-thread-incomplete")
    element_id = client.get("/api/elements").json()[0]["id"]
    session_resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [element_id],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "still",
            "sound": "silent",
            "timer_visible": False,
        },
    ).json()

    resp = client.post(
        "/api/circle/threads",
        json={"title": "Unfinished sitting", "body": "Body.", "session_id": session_resp["id"]},
    )
    assert resp.status_code == 400


def test_create_thread_rejects_session_attached_twice(client):
    client.set_user("u-thread-double-attach")
    element_id = client.get("/api/elements").json()[0]["id"]
    session_resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [element_id],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "still",
            "sound": "silent",
            "timer_visible": False,
        },
    ).json()
    client.post(f"/api/sessions/{session_resp['id']}/complete", json={"returns": []})

    ok = client.post(
        "/api/circle/threads",
        json={"title": "First attach", "body": "Body.", "session_id": session_resp["id"]},
    )
    assert ok.status_code == 201

    dupe = client.post(
        "/api/circle/threads",
        json={"title": "Second attach attempt", "body": "Body.", "session_id": session_resp["id"]},
    )
    assert dupe.status_code == 400


def test_create_thread_rejects_others_session(client):
    client.set_user("u-thread-victim")
    element_id = client.get("/api/elements").json()[0]["id"]
    session_resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [element_id],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "still",
            "sound": "silent",
            "timer_visible": False,
        },
    ).json()
    client.post(f"/api/sessions/{session_resp['id']}/complete", json={"returns": []})

    client.set_user("u-thread-attacker")
    resp = client.post(
        "/api/circle/threads",
        json={"title": "Stealing a sitting", "body": "Body.", "session_id": session_resp["id"]},
    )
    assert resp.status_code == 400


def test_thread_excerpt_is_first_180_chars(client):
    client.set_user("u-thread-excerpt")
    long_body = "x" * 300
    resp = client.post(
        "/api/circle/threads", json={"title": "Long body thread", "body": long_body}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["excerpt"] == long_body[:180]
    assert len(body["excerpt"]) == 180


def test_list_threads_newest_first_and_reply_counts(client, db):
    client.set_user("u-thread-list-author")
    t1 = client.post(
        "/api/circle/threads", json={"title": "First thread posted", "body": "one"}
    ).json()
    t2 = client.post(
        "/api/circle/threads", json={"title": "Second thread posted", "body": "two"}
    ).json()

    client.set_user("u-thread-list-replier")
    client.post(f"/api/circle/threads/{t1['id']}/replies", json={"body": "a reply"})

    threads = client.get("/api/circle/threads").json()
    ids_in_order = [t["id"] for t in threads]
    assert ids_in_order.index(t2["id"]) < ids_in_order.index(t1["id"])

    by_id = {t["id"]: t for t in threads}
    assert by_id[t1["id"]]["reply_count"] == 1
    assert by_id[t2["id"]]["reply_count"] == 0


def test_long_practitioner_reply_count(client, db):
    client.set_user("u-thread-longprac-author")
    thread = client.post(
        "/api/circle/threads", json={"title": "Question for veterans", "body": "help"}
    ).json()

    veteran_id = _user_id(client, "u-thread-veteran", "Veteran")
    _insert_completed_session(
        db, veteran_id,
        started_at=datetime.now(timezone.utc) - timedelta(days=10),
        duration_seconds=LONG_PRACTITIONER_SECONDS,
    )
    client.set_user("u-thread-veteran")
    client.post(f"/api/circle/threads/{thread['id']}/replies", json={"body": "veteran reply"})

    newbie_id = _user_id(client, "u-thread-newbie", "Newbie")
    _insert_completed_session(
        db, newbie_id,
        started_at=datetime.now(timezone.utc) - timedelta(days=1),
        duration_seconds=600,
    )
    client.set_user("u-thread-newbie")
    client.post(f"/api/circle/threads/{thread['id']}/replies", json={"body": "newbie reply"})

    detail = client.get(f"/api/circle/threads/{thread['id']}").json()
    assert detail["reply_count"] == 2
    assert detail["long_practitioner_reply_count"] == 1


def test_helpful_mark_idempotent_and_own_reply_forbidden(client):
    client.set_user("u-helpful-author")
    thread = client.post(
        "/api/circle/threads", json={"title": "Asking for help please", "body": "help"}
    ).json()
    own_reply = client.post(
        f"/api/circle/threads/{thread['id']}/replies", json={"body": "self reply"}
    ).json()

    own_mark = client.put(f"/api/circle/replies/{own_reply['id']}/helpful")
    assert own_mark.status_code == 403

    client.set_user("u-helpful-replier")
    other_reply = client.post(
        f"/api/circle/threads/{thread['id']}/replies", json={"body": "other reply"}
    ).json()

    client.set_user("u-helpful-marker")
    first = client.put(f"/api/circle/replies/{other_reply['id']}/helpful")
    assert first.status_code == 200
    assert first.json() == {"helpful_count": 1, "marked_helpful_by_me": True}

    second = client.put(f"/api/circle/replies/{other_reply['id']}/helpful")
    assert second.json() == {"helpful_count": 1, "marked_helpful_by_me": True}

    removed = client.delete(f"/api/circle/replies/{other_reply['id']}/helpful")
    assert removed.json() == {"helpful_count": 0, "marked_helpful_by_me": False}

    removed_again = client.delete(f"/api/circle/replies/{other_reply['id']}/helpful")
    assert removed_again.json() == {"helpful_count": 0, "marked_helpful_by_me": False}

def test_shared_sitting_records_view_and_enables_read_context(client):
    client.set_user("u-shared-owner")
    element_id = client.get("/api/elements").json()[0]["id"]
    session_resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [element_id],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "still",
            "sound": "silent",
            "timer_visible": False,
        },
    ).json()
    client.post(f"/api/sessions/{session_resp['id']}/complete", json={"returns": []})
    thread = client.post(
        "/api/circle/threads",
        json={
            "title": "Please look at my sitting",
            "body": "notes",
            "session_id": session_resp["id"],
        },
    ).json()

    client.set_user("u-shared-viewer")
    shared = client.get(f"/api/circle/shared/{session_resp['id']}")
    assert shared.status_code == 200

    reply = client.post(
        f"/api/circle/threads/{thread['id']}/replies",
        json={"body": "I read your sitting"},
    ).json()
    assert reply["read_context"] is True


def test_reply_without_viewing_sitting_has_no_read_context(client):
    client.set_user("u-noview-owner")
    element_id = client.get("/api/elements").json()[0]["id"]
    session_resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [element_id],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "still",
            "sound": "silent",
            "timer_visible": False,
        },
    ).json()
    client.post(f"/api/sessions/{session_resp['id']}/complete", json={"returns": []})
    thread = client.post(
        "/api/circle/threads",
        json={
            "title": "No one has looked yet",
            "body": "notes",
            "session_id": session_resp["id"],
        },
    ).json()

    client.set_user("u-noview-replier")
    reply = client.post(
        f"/api/circle/threads/{thread['id']}/replies", json={"body": "blind reply"}
    ).json()
    assert reply["read_context"] is False


def test_practitioner_endpoint_exposes_shared_sittings_and_open_thread(client, db):
    target_id = _user_id(client, "u-practitioner-target", "Target")
    client.set_user("u-practitioner-target")
    client.patch("/api/me", json={"location": "Bangkok", "bio": "Practice notes."})

    _insert_completed_session(
        db, target_id,
        started_at=datetime.now(timezone.utc) - timedelta(days=1),
        duration_seconds=1500,
        visibility=Visibility.PUBLIC,
    )
    thread = client.post(
        "/api/circle/threads", json={"title": "My open question to circle", "body": "b"}
    ).json()

    client.set_user("u-practitioner-viewer")
    resp = client.get(f"/api/circle/practitioners/{target_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["location"] == "Bangkok"
    assert len(body["shared_sittings"]) == 1
    assert body["open_thread_id"] == thread["id"]
    assert body["stats"]["session_count"] == 1


def test_hours_ranking_me_outside_top5_and_sitting_now(client, db):
    now = datetime.now(timezone.utc)
    top_user_ids = []
    for i in range(5):
        uid = _user_id(client, f"u-hours-top-{i}", f"Top{i}")
        _insert_completed_session(
            db, uid, started_at=now - timedelta(hours=1), duration_seconds=3600 * (10 + i)
        )
        top_user_ids.append(uid)

    me_id = _user_id(client, "u-hours-me", "Me")
    _insert_completed_session(
        db, me_id, started_at=now - timedelta(hours=1), duration_seconds=600
    )

    in_progress_id = _user_id(client, "u-hours-sitting-now", "SittingNow")
    session = MeditationSession(
        user_id=in_progress_id,
        started_at=now - timedelta(minutes=2),
        planned_seconds=1200,
        mode=PracticeMode.SAMATHA,
        environment=Environment.STILL,
        sound=Sound.SILENT,
        timer_visible=False,
        returns=[],
        visibility=Visibility.PRIVATE,
    )
    db.add(session)
    db.commit()

    client.set_user("u-hours-me")
    hours = client.get("/api/circle/hours").json()

    assert len(hours["entries"]) == 5
    assert all(e["user_id"] in top_user_ids for e in hours["entries"])
    assert hours["me"]["user_id"] == me_id
    assert hours["me"]["rank"] == 6
    assert hours["me"]["is_me"] is True
    assert hours["sitting_now"] >= 1


def test_hours_me_is_null_with_zero_seconds(client):
    client.set_user("u-hours-zero")
    hours = client.get("/api/circle/hours").json()
    assert hours["me"] is None

# Sharing does not change visibility
def test_sharing_session_does_not_change_visibility(
    db: Session,
    user: User,
) -> None:
    session = create_completed_session(
        db,
        user,
        visibility=Visibility.PRIVATE,
    )

    create_thread(db, user, session)

    db.refresh(session)

    assert session.visibility == Visibility.PRIVATE

# Private sessions can be shared
def test_private_session_can_be_shared(
    db: Session,
    user: User,
) -> None:
    session = create_completed_session(
        db,
        user,
        visibility=Visibility.PRIVATE,
    )

    thread = create_thread(
        db,
        user,
        session,
    )

    assert thread.session_id == session.id
    assert session.visibility == Visibility.PRIVATE

def test_unshared_session_is_not_circle_sitting(
    client,
    db: Session,
    user: User,
) -> None:
    session = create_completed_session(
        db,
        user,
        visibility=Visibility.PUBLIC,
    )

    client.set_user(user.auth_provider_id)

    response = client.get(
        f"/api/circle/shared/{session.id}"
    )

    assert response.status_code == 404

def test_practitioner_only_returns_shared_sessions(
    client,
    db: Session,
    user: User,
) -> None:
    unshared = create_completed_session(
        db,
        user,
        visibility=Visibility.PRIVATE,
    )

    shared = create_completed_session(
        db,
        user,
        visibility=Visibility.PRIVATE,
    )

    create_thread(
        db,
        user,
        shared,
    )

    client.set_user(user.auth_provider_id)

    response = client.get(
        f"/api/circle/practitioners/{user.id}"
    )

    assert response.status_code == 200

    session_ids = {
        sitting["session_id"]
        for sitting in response.json()["shared_sittings"]
    }

    assert shared.id in session_ids
    assert unshared.id not in session_ids