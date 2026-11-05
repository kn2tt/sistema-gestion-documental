"""agregar permiso de edicion de evidencias

Revision ID: fc85053dcb8a
Revises: 24e85179d077
Create Date: 2026-11-05 16:20:56.898682

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'fc85053dcb8a'
down_revision: Union[str, Sequence[str], None] = '24e85179d077'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "asignaciones",
        sa.Column(
            "edicion_evidencias_habilitada",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "asignaciones",
        "edicion_evidencias_habilitada",
    )