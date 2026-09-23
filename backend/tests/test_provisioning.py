from datetime import date


def test_auto_provisions_on_first_request(client):
    client.set_user("auth-1", display_name="Ari")
    resp = client.get("/api/me")
    assert resp.status_code == 200
    body = resp.json()
    assert body["display_name"] == "Ari"
    assert body["practice"] is None
    assert date.fromisoformat(body["practising_since"]) <= date.today()


def test_display_name_falls_back_to_email_local_part(client):
    client.set_user("auth-2", email="mai.practice@example.com")
    body = client.get("/api/me").json()
    assert body["display_name"] == "mai.practice"


def test_display_name_falls_back_to_practitioner(client):
    client.set_user("auth-3")
    body = client.get("/api/me").json()
    assert body["display_name"] == "Practitioner"


def test_same_user_reused_across_requests(client):
    client.set_user("auth-4", display_name="Nong")
    first = client.get("/api/me").json()
    second = client.get("/api/me").json()
    assert first["id"] == second["id"]


def test_concurrent_first_requests_do_not_duplicate_user():
    """Two concurrent first requests for the same Supabase account must
    resolve to a single provisioned user (unique constraint + retry)."""
    import threading

    from sqlalchemy import select

    from app.auth.dep import get_current_user
    from app.db.db import SessionLocal
    from app.models.user import User

    claims = {"sub": "auth-race", "user_metadata": {"display_name": "Race"}}
    results: list[int] = []
    errors: list[Exception] = []
    barrier = threading.Barrier(2)

    def worker():
        session = SessionLocal()
        try:
            barrier.wait()
            user = get_current_user(claims=claims, db=session)
            results.append(user.id)
        except Exception as exc:  # pragma: no cover - failure path
            errors.append(exc)
        finally:
            session.close()

    threads = [threading.Thread(target=worker) for _ in range(2)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors
    assert len(results) == 2
    assert results[0] == results[1]

    verify_session = SessionLocal()
    try:
        rows = verify_session.scalars(
            select(User).where(User.auth_provider_id == "auth-race")
        ).all()
    finally:
        verify_session.close()
    assert len(rows) == 1


def test_removed_legacy_auth_me_route(client):
    client.set_user("auth-5")
    resp = client.get("/api/auth/me")
    assert resp.status_code == 404
