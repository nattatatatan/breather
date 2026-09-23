def _element_id(client, slug: str) -> int:
    elements = client.get("/api/elements").json()
    return next(e["id"] for e in elements if e["slug"] == slug)


def _create_session(client, *, element_slugs=("breath",), mode="samatha", **overrides):
    payload = {
        "element_ids": [_element_id(client, slug) for slug in element_slugs],
        "mode": mode,
        "intent_id": None,
        "planned_seconds": 1200,
        "environment": "still",
        "sound": "silent",
        "timer_visible": False,
    }
    payload.update(overrides)
    resp = client.post("/api/sessions", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_session_stamps_started_at(client):
    client.set_user("u-session-create")
    session = _create_session(client)
    assert session["started_at"] is not None
    assert session["completed_at"] is None
    assert session["duration_seconds"] is None
    assert session["planned_seconds"] == 1200
    assert session["visibility"] == "private"
    assert session["thread_id"] is None


def test_create_session_dissolve_requires_fire_element(client):
    client.set_user("u-session-dissolve")
    resp = client.post(
        "/api/sessions",
        json={
            "element_ids": [_element_id(client, "breath")],
            "mode": "samatha",
            "planned_seconds": 1200,
            "environment": "dissolve",
            "sound": "silent",
            "timer_visible": False,
        },
    )
    assert resp.status_code == 422


def test_list_sessions_completed_filter(client):
    client.set_user("u-session-list")
    incomplete = _create_session(client)
    complete = _create_session(client)
    client.post(f"/api/sessions/{complete['id']}/complete", json={"returns": []})

    all_sessions = client.get("/api/sessions").json()
    assert {s["id"] for s in all_sessions} == {incomplete["id"], complete["id"]}

    completed_only = client.get("/api/sessions", params={"completed": True}).json()
    assert [s["id"] for s in completed_only] == [complete["id"]]

    incomplete_only = client.get("/api/sessions", params={"completed": False}).json()
    assert [s["id"] for s in incomplete_only] == [incomplete["id"]]


def test_get_session_not_found_for_other_user(client):
    client.set_user("u-session-owner")
    session = _create_session(client)

    client.set_user("u-session-intruder")
    resp = client.get(f"/api/sessions/{session['id']}")
    assert resp.status_code == 404


def test_patch_session_updates_note_feeling_visibility(client):
    client.set_user("u-session-patch")
    session = _create_session(client)
    resp = client.patch(
        f"/api/sessions/{session['id']}",
        json={"note": "Quiet sit", "feeling": "calm", "visibility": "community"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["note"] == "Quiet sit"
    assert body["feeling"] == "calm"
    assert body["visibility"] == "community"


def test_complete_session_computes_duration(client):
    client.set_user("u-session-complete")
    session = _create_session(client)
    resp = client.post(
        f"/api/sessions/{session['id']}/complete", json={"returns": []}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["completed_at"] is not None
    assert body["duration_seconds"] >= 0
    assert body["returns"] == []


def test_complete_session_twice_is_rejected(client):
    client.set_user("u-session-complete-twice")
    session = _create_session(client)
    client.post(f"/api/sessions/{session['id']}/complete", json={"returns": []})
    resp = client.post(f"/api/sessions/{session['id']}/complete", json={"returns": []})
    assert resp.status_code == 400


def test_complete_session_rejects_non_ascending_returns(client):
    client.set_user("u-session-returns-order")
    session = _create_session(client)
    resp = client.post(
        f"/api/sessions/{session['id']}/complete", json={"returns": [10, 5]}
    )
    assert resp.status_code == 400


def test_complete_session_rejects_negative_returns(client):
    client.set_user("u-session-returns-negative")
    session = _create_session(client)
    resp = client.post(
        f"/api/sessions/{session['id']}/complete", json={"returns": [-1]}
    )
    assert resp.status_code == 400


def test_complete_session_rejects_returns_exceeding_duration(client):
    client.set_user("u-session-returns-exceed")
    session = _create_session(client)
    resp = client.post(
        f"/api/sessions/{session['id']}/complete", json={"returns": [10_000_000]}
    )
    assert resp.status_code == 400


def test_delete_uncompleted_session(client):
    client.set_user("u-session-delete")
    session = _create_session(client)
    resp = client.delete(f"/api/sessions/{session['id']}")
    assert resp.status_code == 204
    assert client.get(f"/api/sessions/{session['id']}").status_code == 404


def test_delete_session_attached_to_thread_is_rejected(client):
    client.set_user("u-session-delete-attached")
    session = _create_session(client)
    client.post(f"/api/sessions/{session['id']}/complete", json={"returns": []})

    thread_resp = client.post(
        "/api/circle/threads",
        json={
            "title": "Attached sitting thread for delete test",
            "body": "Body text.",
            "session_id": session["id"],
        },
    )
    assert thread_resp.status_code == 201

    resp = client.delete(f"/api/sessions/{session['id']}")
    assert resp.status_code == 409
