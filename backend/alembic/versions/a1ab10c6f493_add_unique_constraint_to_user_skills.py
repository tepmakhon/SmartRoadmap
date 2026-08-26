"""add unique constraint to user skills

Revision ID: a1ab10c6f493
Revises: b108b2302955
Create Date: 2026-08-27 00:12:15.560313

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1ab10c6f493'
down_revision: Union[str, Sequence[str], None] = 'b108b2302955'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
