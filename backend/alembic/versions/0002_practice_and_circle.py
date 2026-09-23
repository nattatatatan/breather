"""practice profile, session detail, and circle (threads/replies)

Adds:
- users: display_name, practising_since, location, bio
- meditation_sessions: user_id FK (was a bare nullable int) + NOT NULL,
  planned_seconds, environment, sound, timer_visible, returns
- practice_profiles (1:1 with users)
- threads, replies, reply_helpful, shared_sitting_views
- seeds the "devotion" intent

All new NOT NULL columns are added nullable, backfilled, then constrained,
so this runs cleanly against the populated dev database.

Revision ID: 0002_practice_and_circle
Revises: 0001_baseline
Create Date: 2026-09-23 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_practice_and_circle"
down_revision: Union[str, Sequence[str], None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # create_type=False: types are created explicitly (checkfirst) below,
    # so create_table's own DDL cascade does not try to create them again.
    environment_enum = postgresql.ENUM(
        "STILL", "DISSOLVE", name="environment", create_type=False
    )
    sound_enum = postgresql.ENUM(
        "SILENT", "BELL", name="sound", create_type=False
    )
    practice_mode_enum = postgresql.ENUM(
        "SAMATHA", "VIPASSANA", name="practicemode", create_type=False
    )
    environment_enum.create(bind, checkfirst=True)
    sound_enum.create(bind, checkfirst=True)

    # --- users -----------------------------------------------------------
    op.add_column(
        "users", sa.Column("display_name", sa.String(length=40), nullable=True)
    )
    op.add_column(
        "users", sa.Column("practising_since", sa.Date(), nullable=True)
    )
    op.add_column(
        "users", sa.Column("location", sa.String(length=80), nullable=True)
    )
    op.add_column("users", sa.Column("bio", sa.String(length=280), nullable=True))

    op.execute(
        "UPDATE users SET display_name = 'Practitioner' "
        "WHERE display_name IS NULL"
    )
    op.execute(
        "UPDATE users SET practising_since = created_at::date "
        "WHERE practising_since IS NULL"
    )

    op.alter_column("users", "display_name", nullable=False)
    op.alter_column("users", "practising_since", nullable=False)

    # --- meditation_sessions ----------------------------------------------
    op.add_column(
        "meditation_sessions",
        sa.Column("planned_seconds", sa.Integer(), nullable=True),
    )
    op.add_column(
        "meditation_sessions",
        sa.Column("environment", environment_enum, nullable=True),
    )
    op.add_column(
        "meditation_sessions",
        sa.Column("sound", sound_enum, nullable=True),
    )
    op.add_column(
        "meditation_sessions",
        sa.Column(
            "timer_visible", sa.Boolean(), nullable=True
        ),
    )
    op.add_column(
        "meditation_sessions",
        sa.Column(
            "returns", postgresql.ARRAY(sa.Integer()), nullable=True
        ),
    )

    op.execute(
        "UPDATE meditation_sessions "
        "SET planned_seconds = COALESCE(duration_seconds, 1200) "
        "WHERE planned_seconds IS NULL"
    )
    op.execute(
        "UPDATE meditation_sessions SET environment = 'STILL' "
        "WHERE environment IS NULL"
    )
    op.execute(
        "UPDATE meditation_sessions SET sound = 'SILENT' "
        "WHERE sound IS NULL"
    )
    op.execute(
        "UPDATE meditation_sessions SET timer_visible = false "
        "WHERE timer_visible IS NULL"
    )
    op.execute(
        "UPDATE meditation_sessions SET returns = '{}' "
        "WHERE returns IS NULL"
    )

    op.alter_column("meditation_sessions", "planned_seconds", nullable=False)
    op.alter_column("meditation_sessions", "environment", nullable=False)
    op.alter_column("meditation_sessions", "sound", nullable=False)
    op.alter_column("meditation_sessions", "timer_visible", nullable=False)
    op.alter_column("meditation_sessions", "returns", nullable=False)

    # Backfill/repair user_id, then make it a real FK.
    op.execute(
        "UPDATE meditation_sessions SET user_id = NULL "
        "WHERE user_id IS NOT NULL "
        "AND user_id NOT IN (SELECT id FROM users)"
    )
    op.execute(
        "UPDATE meditation_sessions "
        "SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) "
        "WHERE user_id IS NULL "
        "AND EXISTS (SELECT 1 FROM users)"
    )
    op.alter_column("meditation_sessions", "user_id", nullable=False)
    op.create_foreign_key(
        "meditation_sessions_user_id_fkey",
        "meditation_sessions",
        "users",
        ["user_id"],
        ["id"],
    )

    # --- practice_profiles --------------------------------------------------
    op.create_table(
        "practice_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "mode",
            practice_mode_enum,
            nullable=False,
        ),
        sa.Column("intent_id", sa.Integer(), nullable=False),
        sa.Column("element_id", sa.Integer(), nullable=False),
        sa.Column("environment", environment_enum, nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("sound", sound_enum, nullable=False),
        sa.Column("timer_visible", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["intent_id"], ["intents.id"]),
        sa.ForeignKeyConstraint(["element_id"], ["meditation_elements.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_practice_profiles_user_id"),
    )

    # --- threads / replies / helpful / views --------------------------------
    op.create_table(
        "threads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "mode",
            practice_mode_enum,
            nullable=True,
        ),
        sa.Column("element_id", sa.Integer(), nullable=True),
        sa.Column("session_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["element_id"], ["meditation_elements.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["meditation_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", name="uq_threads_session_id"),
    )

    op.create_table(
        "replies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("thread_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "read_context", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"]),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.alter_column("replies", "read_context", server_default=None)

    op.create_table(
        "reply_helpful",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reply_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["reply_id"], ["replies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "reply_id", "user_id", name="uq_reply_helpful_user"
        ),
    )

    op.create_table(
        "shared_sitting_views",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("viewer_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["viewer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["meditation_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_shared_sitting_views_session_viewer",
        "shared_sitting_views",
        ["session_id", "viewer_id"],
    )

    # --- seed data -----------------------------------------------------
    op.execute(
        "INSERT INTO intents (name, slug, description) "
        "VALUES ('Devotion', 'devotion', 'Cultivate confidence and reverence.') "
        "ON CONFLICT (slug) DO NOTHING"
    )


def downgrade() -> None:
    op.drop_index(
        "ix_shared_sitting_views_session_viewer",
        table_name="shared_sitting_views",
    )
    op.drop_table("shared_sitting_views")
    op.drop_table("reply_helpful")
    op.drop_table("replies")
    op.drop_table("threads")
    op.drop_table("practice_profiles")

    op.drop_constraint(
        "meditation_sessions_user_id_fkey",
        "meditation_sessions",
        type_="foreignkey",
    )
    op.alter_column("meditation_sessions", "user_id", nullable=True)

    for column in (
        "returns",
        "timer_visible",
        "sound",
        "environment",
        "planned_seconds",
    ):
        op.drop_column("meditation_sessions", column)

    for column in ("bio", "location", "practising_since", "display_name"):
        op.drop_column("users", column)

    bind = op.get_bind()
    sa.Enum(name="sound").drop(bind, checkfirst=True)
    sa.Enum(name="environment").drop(bind, checkfirst=True)
