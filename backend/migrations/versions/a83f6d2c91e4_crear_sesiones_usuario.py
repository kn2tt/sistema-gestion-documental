"""crear sesiones de usuario

Revision ID: a83f6d2c91e4
Revises: d2a9f6c81b34
Create Date: 2026-11-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a83f6d2c91e4"
down_revision: Union[str, Sequence[str], None] = "d2a9f6c81b34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "sesiones_usuario",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "token_hash",
            sa.String(length=64),
            nullable=False,
        ),

        sa.Column(
            "csrf_token_hash",
            sa.String(length=64),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "last_activity_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "revoked_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["usuarios.id"],
            ondelete="CASCADE",
        ),

        sa.UniqueConstraint(
            "token_hash",
            name="uq_sesiones_usuario_token_hash",
        ),
    )

    op.create_index(
        "ix_sesiones_usuario_id",
        "sesiones_usuario",
        ["id"],
    )

    op.create_index(
        "ix_sesiones_usuario_user_id",
        "sesiones_usuario",
        ["user_id"],
    )

    op.create_index(
        "ix_sesiones_usuario_expires_at",
        "sesiones_usuario",
        ["expires_at"],
    )


def downgrade() -> None:

    op.drop_table("sesiones_usuario")