def _element_id(client, slug: str) -> int:
    elements = client.get("/api/elements").json()
    return next(e["id"] for e in elements if e["slug"] == slug)


def _intent_id(client, slug: str) -> int:
    intents = client.get("/api/intents").json()
    return next(i["id"] for i in intents if i["slug"] == slug)


def test_devotion_intent_is_seeded(client):
    intents = client.get("/api/intents").json()
    slugs = {i["slug"] for i in intents}
    assert "devotion" in slugs


def test_patch_me_updates_profile_fields(client):
    client.set_user("u-patch", display_name="Original")
    resp = client.patch(
        "/api/me",
        json={"display_name": "Updated", "location": "Bangkok", "bio": "Hello"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["display_name"] == "Updated"
    assert body["location"] == "Bangkok"
    assert body["bio"] == "Hello"


def test_put_practice_upserts_and_returns_profile(client):
    client.set_user("u-practice")
    breath = _element_id(client, "breath")
    calm = _intent_id(client, "calm")

    payload = {
        "mode": "samatha",
        "intent_id": calm,
        "element_id": breath,
        "environment": "still",
        "duration_seconds": 1200,
        "sound": "silent",
        "timer_visible": False,
    }
    resp = client.put("/api/me/practice", json=payload)
    assert resp.status_code == 200
    assert resp.json() == payload

    me = client.get("/api/me").json()
    assert me["practice"] == payload

    # Upsert: calling again with different values replaces, not duplicates.
    payload["duration_seconds"] = 1800
    resp2 = client.put("/api/me/practice", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["duration_seconds"] == 1800


def test_put_practice_rejects_out_of_range_duration(client):
    client.set_user("u-practice-range")
    breath = _element_id(client, "breath")
    calm = _intent_id(client, "calm")

    payload = {
        "mode": "samatha",
        "intent_id": calm,
        "element_id": breath,
        "environment": "still",
        "duration_seconds": 30,
        "sound": "silent",
        "timer_visible": False,
    }
    resp = client.put("/api/me/practice", json=payload)
    assert resp.status_code == 422


def test_put_practice_rejects_dissolve_for_non_fire_element(client):
    client.set_user("u-practice-dissolve")
    breath = _element_id(client, "breath")
    calm = _intent_id(client, "calm")

    payload = {
        "mode": "samatha",
        "intent_id": calm,
        "element_id": breath,
        "environment": "dissolve",
        "duration_seconds": 1200,
        "sound": "silent",
        "timer_visible": False,
    }
    resp = client.put("/api/me/practice", json=payload)
    assert resp.status_code == 422


def test_put_practice_allows_dissolve_for_fire_element(client):
    client.set_user("u-practice-fire")
    fire = _element_id(client, "fire")
    calm = _intent_id(client, "calm")

    payload = {
        "mode": "samatha",
        "intent_id": calm,
        "element_id": fire,
        "environment": "dissolve",
        "duration_seconds": 1200,
        "sound": "silent",
        "timer_visible": False,
    }
    resp = client.put("/api/me/practice", json=payload)
    assert resp.status_code == 200


def test_put_practice_rejects_unknown_intent(client):
    client.set_user("u-practice-badintent")
    breath = _element_id(client, "breath")

    payload = {
        "mode": "samatha",
        "intent_id": 999999,
        "element_id": breath,
        "environment": "still",
        "duration_seconds": 1200,
        "sound": "silent",
        "timer_visible": False,
    }
    resp = client.put("/api/me/practice", json=payload)
    assert resp.status_code == 422
