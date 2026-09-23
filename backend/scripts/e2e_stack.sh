#!/usr/bin/env bash
# Boots a clean backend stack for Playwright e2e runs: a fresh `stay_e2e`
# database, migrations, catalog + demo seed data, then the API on :8001
# (no --reload, since Playwright expects a stable process to exec/kill).
#
# Runnable from any working directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

CONTAINER="${STAY_DB_CONTAINER:-breather-db}"
DB_USER="${STAY_DB_USER:-app}"
DB_PASSWORD="${STAY_DB_PASSWORD:-app}"
DB_HOST="${STAY_DB_HOST:-localhost}"
DB_PORT="${STAY_DB_PORT:-5432}"
DB_NAME="stay_e2e"

echo "==> Recreating database '$DB_NAME' in container '$CONTAINER'"
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE $DB_NAME;"

export DATABASE_URL="postgresql+psycopg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "==> Running migrations"
"$BACKEND_DIR/.venv/bin/python" -m alembic upgrade head

echo "==> Seeding catalog and demo data"
"$BACKEND_DIR/.venv/bin/python" -m app.db.seed_elements
"$BACKEND_DIR/.venv/bin/python" -m app.db.seed_intents
"$BACKEND_DIR/.venv/bin/python" -m app.db.seed_demo

echo "==> Starting API on :8001"
exec "$BACKEND_DIR/.venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port 8001
