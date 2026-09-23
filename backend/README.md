# Stay API (backend)

FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL, implementing `docs/api-contract.md`.
Auth is a Supabase-issued JWT (ES256), verified against the project's JWKS.

## Setup

```bash
cd backend
python3.14 -m venv .venv        # already present in this repo checkout
.venv/bin/pip install -r requirements-dev.txt
```

Postgres runs via the repo-root `docker-compose.yaml` (container `breather-db`,
user/password `app`, database `breather`):

```bash
docker compose up -d
```

`.env` holds:

```
DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/breather
SUPABASE_URL=...
SUPABASE_JWKS_URL=...
CORS_ORIGINS=["http://localhost:5180","http://localhost:5181"]   # optional, has a default
```

`pydantic-settings` loads `.env` first, then lets real environment variables
override it - set `DATABASE_URL` in the shell to point commands at a
different database (used by the test suite and the e2e stack script).

## Migrate

```bash
.venv/bin/python -m alembic upgrade head
```

Migration history was squashed once into `0001_baseline` (the schema as it
existed at the old head, `11a3222cbce4`) followed by `0002_practice_and_circle`
(practice profiles, richer sessions, the circle: threads/replies/helpful
marks/shared-sitting views, and the `devotion` intent seed). `0001_baseline`
creates every table from scratch, so `alembic upgrade head` works on a brand
new, empty database. The existing dev database was migrated in place: it was
`alembic stamp`-ed to `0001_baseline` (its schema was already equivalent),
then upgraded to `0002_practice_and_circle`, which adds the new columns as
nullable, backfills them, and only then applies `NOT NULL`. No dev data was
lost - the pre-existing user and its 3 sessions are intact.

## Seed data

```bash
.venv/bin/python -m app.db.seed_elements   # meditation elements (idempotent)
.venv/bin/python -m app.db.seed_intents    # intents, incl. "devotion" (idempotent)
.venv/bin/python -m app.db.seed_demo       # fake practitioners, sessions, circle threads (idempotent)
```

`seed_demo` requires the catalog seeds to have already run. It creates demo
users with `auth_provider_id` like `demo:mai`, a spread of plausible completed
sessions across each one's tenure (with several always landing in the current
calendar month, so `/api/circle/hours` has real data), Mai's shared Tuesday
sitting, the three sample circle threads with replies, and 1-2 in-progress
sessions (for `sitting_now`). Re-running it is a no-op once seeded.

## Run

```bash
.venv/bin/python -m uvicorn app.main:app --reload
```

`GET /health` checks DB connectivity. API title is "Stay API"; CORS defaults
to `http://localhost:5180` and `:5181`.

## Test

```bash
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest
.venv/bin/ruff check app tests
```

The test suite creates its own `stay_test` database (via `docker exec
breather-db psql`), runs real Alembic migrations against it, and truncates
all mutable tables before every test for isolation. `get_current_user_claims`
is overridden per-test so tests can act as different users without real JWTs;
use the `client` fixture's `client.set_user(sub, email=..., display_name=...)`.

## E2E stack (for Playwright)

```bash
backend/scripts/e2e_stack.sh
```

Recreates a `stay_e2e` database, migrates it, seeds catalog + demo data, then
`exec`s `uvicorn app.main:app` on port 8001 (no `--reload`, since Playwright
manages the process's lifetime directly). Runnable from any working
directory. `frontend/playwright.config.ts` invokes this script and waits for
`http://localhost:8001/health`.
