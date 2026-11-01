
"""agregar obligatorio a especificaciones

Revision ID: 6b0038605667
Revises: 4edcbce0f206
Create Date: 2026-10-27 23:46:26.423300
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6b0038605667"
down_revision: Union[str, Sequence[str], None] = "4edcbce0f206"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "asignacion_especificaciones",
        sa.Column(
            "obligatorio",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    # Elimina el valor predeterminado de la base de datos
    # después de inicializar los registros existentes.
    op.alter_column(
        "asignacion_especificaciones",
        "obligatorio",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("asignacion_especificaciones", "obligatorio")
