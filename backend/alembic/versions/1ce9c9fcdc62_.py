"""empty message

Revision ID: 1ce9c9fcdc62
Revises: 
Create Date: 2026-09-21 09:28:53.996959

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ce9c9fcdc62'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    visibility_enum = sa.Enum(
        'PRIVATE',
        'COMMUNITY',
        name='sessionvisibility',
    )

    visibility_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    op.add_column(
        'meditation_sessions',
        sa.Column(
            'visibility',
            visibility_enum,
            nullable=False,
            server_default='PRIVATE',
        ),
    )

    op.alter_column(
        'meditation_sessions',
        'visibility',
        server_default=None,
    )

    op.create_unique_constraint(
        'uq_session_element',
        'session_elements',
        ['session_id', 'element_id'],
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_session_element',
        'session_elements',
        type_='unique',
    )

    op.drop_column(
        'meditation_sessions',
        'visibility',
    )

    visibility_enum = sa.Enum(
        'PRIVATE',
        'COMMUNITY',
        name='sessionvisibility',
    )

    visibility_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )
