# Stay API contract (v1)

Single source of truth for the shape of every endpoint the frontend uses.
Backend (`backend/app`) implements it; frontend (`frontend/src/api`) mirrors it in TypeScript.
If you need to change a shape, change this file first.

Conventions

- Base path `/api`. JSON in and out. Timestamps are ISO-8601 UTC (`2026-09-23T12:40:00Z`).
- Durations are integer **seconds** everywhere.
- Auth: `Authorization: Bearer <supabase access token>` on every endpoint except `GET /api/elements`, `GET /api/intents`, `GET /health`.
- Errors: FastAPI default `{"detail": "..."}` with 400 / 401 / 403 / 404 / 422.
- Enums are lowercase strings.
- Timezone-sensitive endpoints take `tz` (IANA name, e.g. `Asia/Bangkok`); default `UTC`.

Enums

| Name | Values |
|---|---|
| `PracticeMode` | `samatha`, `vipassana` |
| `Visibility` | `private`, `public` |
| `Environment` | `still`, `dissolve` (`dissolve` only meaningful for `fire`) |
| `Sound` | `silent`, `bell` |

Constants

- `LONG_PRACTITIONER_SECONDS = 300 * 3600` - a replier counts as a "long practitioner" at or above this total held time.

---

## Catalog

### `GET /api/elements` -> `Element[]`
```json
{ "id": 4, "name": "Breath", "slug": "breath", "domain": "rupa", "description": "...", "image_url": null }
```
Slugs the UI uses (the frontend owns labels, icons and order): `breath`, `light`, `fire`, `water`, `earth`, `buddha-recollection`, `loving-kindness`, `walking`.

### `GET /api/intents` -> `Intent[]`
```json
{ "id": 1, "name": "Calm", "slug": "calm", "description": "..." }
```
Slugs the UI uses: `calm`, `joy`, `devotion`, `kindness`, `clarity`. (Backend must seed `devotion`.)

---

## Me

A user row is **auto-provisioned** on the first authenticated request (no separate sign-up call).
`display_name` comes from the JWT `user_metadata.display_name`, else the local part of `email`.

### `GET /api/me` -> `Me`
```json
{
  "id": 1,
  "display_name": "Mai",
  "practising_since": "2025-07-01",
  "location": "Bangkok",
  "bio": "Breath most mornings before work. No teacher yet, one weekend retreat.",
  "created_at": "2026-09-22T06:00:00Z",
  "practice": null
}
```
`practice` is `PracticeProfile | null` (null until the user finishes the Mode -> Intention -> Object flow once).

### `PATCH /api/me` body `{ display_name?, practising_since?, location?, bio? }` -> `Me`
`display_name` 1-40 chars; `bio` <= 280; `location` <= 80.

### `PracticeProfile`
```json
{
  "mode": "samatha",
  "intent_id": 1,
  "element_id": 6,
  "environment": "dissolve",
  "duration_seconds": 1800,
  "sound": "silent",
  "timer_visible": false
}
```

### `PUT /api/me/practice` body `PracticeProfile` -> `PracticeProfile`
Upsert. Validation: `duration_seconds` in 60..10800; `intent_id`/`element_id` must exist; `environment=dissolve` only allowed when the element slug is `fire` (else 422).

### `GET /api/me/stats?tz=Asia/Bangkok` -> `PracticeStats`
Only **completed** sessions count.
```json
{
  "total_seconds": 496800,
  "longest_seconds": 2700,
  "session_count": 212,
  "shared_count": 12,
  "current_streak_days": 6,
  "month_seconds": 100800,
  "mode_split": [ { "mode": "samatha", "seconds": 457056 }, { "mode": "vipassana", "seconds": 39744 } ],
  "by_element": [ { "element_id": 4, "seconds": 424800 }, { "element_id": 5, "seconds": 50400 } ]
}
```
`current_streak_days`: consecutive local days (in `tz`) with >=1 completed session, ending today or yesterday. `by_element` sorted by seconds desc. `month_seconds` = current calendar month in `tz`.

---

## Sessions (own)

### `Session`
```json
{
  "id": 42,
  "started_at": "2026-09-22T12:40:00Z",
  "completed_at": "2026-09-22T13:10:00Z",
  "duration_seconds": 1800,
  "planned_seconds": 1800,
  "mode": "samatha",
  "intent_id": 4,
  "element_ids": [4],
  "environment": "still",
  "sound": "silent",
  "timer_visible": false,
  "returns": [95, 240, 530],
  "note": "Said the phrases for my sister ...",
  "feeling": null,
  "visibility": "private",
  "thread_id": null
}
```
`returns` = seconds-from-start at which the practitioner tapped to note "I wandered and came back". `thread_id` = the thread this sitting is attached to, if any.

### `POST /api/sessions` body `{ element_ids: int[], mode, intent_id?, planned_seconds, environment, sound, timer_visible }` -> `Session`
Server stamps `started_at`.

### `GET /api/sessions?limit=20&offset=0&completed=true` -> `Session[]` (newest first). `completed` optional filter.

### `GET /api/sessions/{id}` -> `Session` (own only, else 404)

### `PATCH /api/sessions/{id}` body `{ note?, feeling?, visibility? }` -> `Session`
`note` <= 2000 chars.

### `POST /api/sessions/{id}/complete` body `{ returns: int[] }` -> `Session`
Server stamps `completed_at`, computes `duration_seconds`. `returns` must be non-negative, ascending, each <= duration. 400 if already completed.

### `DELETE /api/sessions/{id}` -> 204
Used to discard a sitting abandoned in the first moments (client decides; e.g. held < 60 s). 409 if attached to a thread.

---

## Circle

### `AuthorSummary`
```json
{
  "id": 7,
  "display_name": "Ari",
  "initial": "A",
  "practising_since": "2020-05-01",
  "total_seconds": 4464000,
  "primary_mode": "samatha",
  "primary_element_id": 15
}
```
`primary_mode` / `primary_element_id`: by completed seconds, null if none. The UI renders tenure ("6y", "1y 2m") from `practising_since`.

### `AttachedSitting`
```json
{
  "session_id": 42,
  "started_at": "2026-09-22T12:40:00Z",
  "mode": "samatha",
  "element_id": 4,
  "intent_id": 4,
  "duration_seconds": 1800,
  "return_count": 3
}
```

### `ThreadSummary`
```json
{
  "id": 3,
  "author": { "...": "AuthorSummary" },
  "title": "Metta feels like a script. How do you actually practise it?",
  "excerpt": "I repeat the phrases at people and feel nothing. ...",
  "created_at": "2026-09-23T08:00:00Z",
  "mode": "samatha",
  "element_id": 4,
  "attached": { "...": "AttachedSitting" },
  "reply_count": 7,
  "long_practitioner_reply_count": 2
}
```
`excerpt` = first 180 chars of body. `mode`/`element_id` are optional tags (null when absent); when a sitting is attached they default to the sitting's. `attached` is null when none.

### `GET /api/circle/threads?limit=20&offset=0` -> `ThreadSummary[]` (newest first)

### `POST /api/circle/threads` body `{ title, body, mode?, element_id?, session_id? }` -> `ThreadDetail` (201)
`title` 4..140, `body` 1..5000. `session_id` must be the caller's own **completed** session not attached elsewhere; session_id must be the caller's own completed session not attached elsewhere; attaching the session to the thread does not change its diary visibility.

### `ThreadDetail` = `ThreadSummary` + `{ body: string, replies: Reply[] }` (replies oldest first)

### `GET /api/circle/threads/{id}` -> `ThreadDetail`

### `Reply`
```json
{
  "id": 11,
  "author": { "...": "AuthorSummary" },
  "body": "Your notes say the warmth came ...",
  "created_at": "2026-09-23T10:00:00Z",
  "helpful_count": 14,
  "marked_helpful_by_me": false,
  "read_context": true
}
```
`read_context` is stored at creation: true when the replier had opened the thread's attached sitting (see views below) **before** replying. The UI shows "Read your sitting and your history before answering".

### `POST /api/circle/threads/{id}/replies` body `{ body }` (1..5000) -> `Reply` (201)

### `PUT /api/circle/replies/{id}/helpful` -> `{ helpful_count, marked_helpful_by_me: true }`
### `DELETE /api/circle/replies/{id}/helpful` -> `{ helpful_count, marked_helpful_by_me: false }`
Idempotent. Cannot mark your own reply (403).

### `GET /api/circle/shared/{session_id}` -> `SharedSitting`
404 unless the session is attached to a Circle thread. When the viewer is not the owner, records a view `(viewer_id, session_id, viewed_at)`.
```json
{
  "session_id": 42,
  "author": { "...": "AuthorSummary" },
  "started_at": "2026-09-22T12:40:00Z",
  "mode": "samatha",
  "intent_id": 4,
  "element_id": 4,
  "duration_seconds": 1800,
  "planned_seconds": 1800,
  "environment": "still",
  "sound": "silent",
  "timer_visible": false,
  "returns": [95, 240, 530],
  "note": "Said the phrases for my sister ...",
  "thread_id": 3
}
```

### `GET /api/circle/practitioners/{user_id}` -> `Practitioner`
```json
{
  "author": { "...": "AuthorSummary" },
  "location": "Bangkok",
  "bio": "Breath most mornings before work. ...",
  "stats": { "...": "PracticeStats (streak/month use tz query param)" },
  "shared_sittings": [ { "...": "AttachedSitting" } ],
  "open_thread_id": 3
}
```
Aggregated stats are visible to circle members; individual sittings only when shared. `open_thread_id` = their most recent thread (for "Answer her question"), null if none.

### `GET /api/circle/hours?tz=Asia/Bangkok` -> `Hours`
Current calendar month (in `tz`), completed sessions only.
```json
{
  "month": "2026-09",
  "entries": [ { "rank": 1, "user_id": 9, "display_name": "Ari", "seconds": 147600, "is_me": false } ],
  "me": { "rank": 4, "user_id": 1, "display_name": "Mai", "seconds": 100800, "is_me": true },
  "sitting_now": 23
}
```
`entries` = top 5. `me` null when the caller has 0 seconds this month. `sitting_now` = sessions with `completed_at IS NULL AND started_at + planned_seconds > now()`.
