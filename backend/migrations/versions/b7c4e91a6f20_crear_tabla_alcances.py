
"""Crear tabla de alcances.

Revision ID: b7c4e91a6f20
Revises: 1ed67a8b2ac4
"""

from alembic import op
import sqlalchemy as sa


revision = "b7c4e91a6f20"
down_revision = "1ed67a8b2ac4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "alcances",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),
        sa.Column(
            "nombre",
            sa.String(length=150),
            nullable=False
        ),
        sa.Column(
            "descripcion",
            sa.Text(),
            nullable=True
        ),
        sa.Column(
            "activo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        ),
        sa.UniqueConstraint("nombre"),
    )

    op.create_index(
        "ix_alcances_id",
        "alcances",
        ["id"],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(
        "ix_alcances_id",
        table_name="alcances"
    )

    op.drop_table("alcances")
