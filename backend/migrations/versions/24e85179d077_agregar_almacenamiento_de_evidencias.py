"""agregar almacenamiento de evidencias

Revision ID: 24e85179d077
Revises: a83f6d2c91e4
Create Date: 2026-11-05 02:52:46.148739

"""

from alembic import op
import sqlalchemy as sa


# Conserva el revision generado por Alembic.
revision = "24e85179d077"
down_revision = "a83f6d2c91e4"
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.add_column(
        "evidencias",
        sa.Column(
            "storage_key",
            sa.String(length=500),
            nullable=True
        )
    )

    op.add_column(
        "evidencias",
        sa.Column(
            "estado_almacenamiento",
            sa.String(length=30),
            server_default="pendiente",
            nullable=False
        )
    )

    op.add_column(
        "evidencias",
        sa.Column(
            "drive_file_id",
            sa.String(length=255),
            nullable=True
        )
    )

    op.add_column(
        "evidencias",
        sa.Column(
            "drive_web_view_link",
            sa.String(length=1000),
            nullable=True
        )
    )

    op.add_column(
        "evidencias",
        sa.Column(
            "fecha_archivado",
            sa.DateTime(),
            nullable=True
        )
    )

    op.add_column(
        "evidencias",
        sa.Column(
            "usuario_archivado_id",
            sa.Integer(),
            nullable=True
        )
    )

    op.create_index(
        "ix_evidencias_usuario_archivado_id",
        "evidencias",
        ["usuario_archivado_id"],
        unique=False
    )

    op.create_foreign_key(
        "fk_evidencias_usuario_archivado_id",
        "evidencias",
        "usuarios",
        ["usuario_archivado_id"],
        ["id"]
    )


def downgrade() -> None:

    op.drop_constraint(
        "fk_evidencias_usuario_archivado_id",
        "evidencias",
        type_="foreignkey"
    )

    op.drop_index(
        "ix_evidencias_usuario_archivado_id",
        table_name="evidencias"
    )

    op.drop_column(
        "evidencias",
        "usuario_archivado_id"
    )

    op.drop_column(
        "evidencias",
        "fecha_archivado"
    )

    op.drop_column(
        "evidencias",
        "drive_web_view_link"
    )

    op.drop_column(
        "evidencias",
        "drive_file_id"
    )

    op.drop_column(
        "evidencias",
        "estado_almacenamiento"
    )

    op.drop_column(
        "evidencias",
        "storage_key"
    )
