"""make session timestamps timezone aware

Revision ID: 39b72d602f40
Revises: 1ce9c9fcdc62
Create Date: 2026-09-21 09:54:20.321782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39b72d602f40'
down_revision: Union[str, Sequence[str], None] = '1ce9c9fcdc62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.alter_column(
        "meditation_sessions",
        "started_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        postgresql_using="started_at AT TIME ZONE 'UTC'",
    )

    op.alter_column(
        "meditation_sessions",
        "completed_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        postgresql_using="completed_at AT TIME ZONE 'UTC'",
    )


def downgrade() -> None:
    op.alter_column(
        "meditation_sessions",
        "started_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        postgresql_using="started_at AT TIME ZONE 'UTC'",
    )

    op.alter_column(
        "meditation_sessions",
        "completed_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        postgresql_using="completed_at AT TIME ZONE 'UTC'",
    )