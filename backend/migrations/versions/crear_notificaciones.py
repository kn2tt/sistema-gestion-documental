"""crear tabla de notificaciones

Revision ID: f31a8b7c2d90
Revises: d927103835cd
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f31a8b7c2d90"
down_revision: Union[str, Sequence[str], None] = "d927103835cd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notificaciones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("tipo", sa.String(length=60), nullable=False),
        sa.Column("titulo", sa.String(length=120), nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("entidad_tipo", sa.String(length=30), nullable=True),
        sa.Column("entidad_id", sa.Integer(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("fecha_lectura", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["actor_id"],
            ["usuarios.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_notificaciones_usuario_id",
        "notificaciones",
        ["usuario_id"],
    )

    op.create_index(
        "ix_notificaciones_usuario_lectura",
        "notificaciones",
        ["usuario_id", "fecha_lectura"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notificaciones_usuario_lectura",
        table_name="notificaciones",
    )

    op.drop_index(
        "ix_notificaciones_usuario_id",
        table_name="notificaciones",
    )

    op.drop_table("notificaciones")
