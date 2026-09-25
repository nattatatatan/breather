"""generalize visibility from community to public

Revision ID: 0003_visibility
Revises: 0002_practice_and_circle
Create Date: 2026-09-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_visibility"
down_revision: Union[str, Sequence[str], None] = "0002_practice_and_circle"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE sessionvisibility RENAME VALUE 'COMMUNITY' TO 'PUBLIC'"
    )

    op.add_column(
        "users",
        sa.Column(
            "visibility",
            sa.Enum(
                "PRIVATE",
                "PUBLIC",
                name="sessionvisibility",
            ),
            nullable=True,
        ),
    )

    op.execute(
        "UPDATE users SET visibility = 'PUBLIC' "
        "WHERE visibility IS NULL"
    )

    op.alter_column(
        "users",
        "visibility",
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column("users", "visibility")

    op.execute(
        "ALTER TYPE sessionvisibility RENAME VALUE 'PUBLIC' TO 'COMMUNITY'"
    )