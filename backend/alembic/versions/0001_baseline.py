"""baseline schema

Recreates the schema exactly as it existed at the old head (11a3222cbce4)
before the migration history was squashed. This lets `alembic upgrade head`
build a correct schema on a brand-new database. On the existing dev database
this revision is never actually run - the dev database is instead
`alembic stamp`-ed to this revision because its schema is already equivalent.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-09-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001_baseline"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # create_type=False: the type is created explicitly below (checkfirst),
    # so create_table's own DDL cascade does not try to create it again.
    domain_enum = postgresql.ENUM(
        "RUPA", "NAMA", name="domain", create_type=False
    )
    practice_mode_enum = postgresql.ENUM(
        "SAMATHA", "VIPASSANA", name="practicemode", create_type=False
    )
    visibility_enum = postgresql.ENUM(
        "PRIVATE", "COMMUNITY", name="sessionvisibility", create_type=False
    )

    bind = op.get_bind()
    domain_enum.create(bind, checkfirst=True)
    practice_mode_enum.create(bind, checkfirst=True)
    visibility_enum.create(bind, checkfirst=True)

    op.create_table(
        "intents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="intents_slug_key"),
    )

    op.create_table(
        "meditation_elements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("domain", domain_enum, nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="meditation_elements_slug_key"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("auth_provider_id", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_users_auth_provider_id",
        "users",
        ["auth_provider_id"],
        unique=True,
    )

    op.create_table(
        "meditation_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column(
            "started_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column(
            "completed_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("mode", practice_mode_enum, nullable=False),
        sa.Column("intent_id", sa.Integer(), nullable=True),
        sa.Column("feeling", sa.String(length=50), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("visibility", visibility_enum, nullable=False),
        sa.ForeignKeyConstraint(
            ["intent_id"],
            ["intents.id"],
            name="meditation_sessions_intent_id_fkey",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "session_elements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("element_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["meditation_sessions.id"],
            name="session_elements_session_id_fkey",
        ),
        sa.ForeignKeyConstraint(
            ["element_id"],
            ["meditation_elements.id"],
            name="session_elements_element_id_fkey",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "session_id", "element_id", name="uq_session_element"
        ),
    )


def downgrade() -> None:
    op.drop_table("session_elements")
    op.drop_table("meditation_sessions")
    op.drop_index("ix_users_auth_provider_id", table_name="users")
    op.drop_table("users")
    op.drop_table("meditation_elements")
    op.drop_table("intents")

    bind = op.get_bind()
    sa.Enum(name="sessionvisibility").drop(bind, checkfirst=True)
    sa.Enum(name="practicemode").drop(bind, checkfirst=True)
    sa.Enum(name="domain").drop(bind, checkfirst=True)
