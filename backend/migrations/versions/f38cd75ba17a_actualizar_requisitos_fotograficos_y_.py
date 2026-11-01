
"""actualizar requisitos fotograficos y eliminar tipos instalacion

Revision ID: f38cd75ba17a
Revises: b7c4e91a6f20
Create Date: 2026-10-11 02:59:41.524436
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f38cd75ba17a"
down_revision: Union[str, Sequence[str], None] = "b7c4e91a6f20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Los requisitos actuales son datos de prueba.
    # Se eliminan sus evidencias antes de eliminar los requisitos.
    op.execute(sa.text("DELETE FROM evidencias"))
    op.execute(sa.text("DELETE FROM requisitos_fotograficos"))

    # Relación muchos a muchos entre requisitos y tipos de documento.
    op.create_table(
        "requisitos_fotograficos_tipos_documento",
        sa.Column("requisito_id", sa.Integer(), nullable=False),
        sa.Column("tipo_documento_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["requisito_id"],
            ["requisitos_fotograficos.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tipo_documento_id"],
            ["tipos_documento.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "requisito_id",
            "tipo_documento_id",
        ),
    )

    # Eliminar la dependencia del tipo de instalación en asignaciones.
    op.drop_index(
        "ix_asignaciones_tipo_instalacion_id",
        table_name="asignaciones",
    )
    op.drop_constraint(
        "asignaciones_tipo_instalacion_id_fkey",
        "asignaciones",
        type_="foreignkey",
    )
    op.drop_column(
        "asignaciones",
        "tipo_instalacion_id",
    )

    # Incorporar el alcance a los requisitos fotográficos.
    op.add_column(
        "requisitos_fotograficos",
        sa.Column("alcance_id", sa.Integer(), nullable=False),
    )
    op.create_index(
        "ix_requisitos_fotograficos_alcance_id",
        "requisitos_fotograficos",
        ["alcance_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_requisitos_fotograficos_alcance_id_alcances",
        "requisitos_fotograficos",
        "alcances",
        ["alcance_id"],
        ["id"],
    )

    # Eliminar la dependencia anterior de los requisitos.
    op.drop_index(
        "ix_requisitos_fotograficos_tipo_instalacion_id",
        table_name="requisitos_fotograficos",
    )
    op.drop_constraint(
        "requisitos_fotograficos_tipo_instalacion_id_fkey",
        "requisitos_fotograficos",
        type_="foreignkey",
    )
    op.drop_column(
        "requisitos_fotograficos",
        "tipo_instalacion_id",
    )

    # Eliminar la tabla de tipos de instalación.
    op.drop_index(
        "ix_tipos_instalacion_id",
        table_name="tipos_instalacion",
    )
    op.drop_table("tipos_instalacion")


def downgrade() -> None:
    # Restaurar la estructura anterior.
    # Las columnas antiguas se crean inicialmente como opcionales
    # porque los datos eliminados durante upgrade no se recuperan.

    op.create_table(
        "tipos_instalacion",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="tipos_instalacion_pkey"),
        sa.UniqueConstraint(
            "nombre",
            name="tipos_instalacion_nombre_key",
        ),
    )
    op.create_index(
        "ix_tipos_instalacion_id",
        "tipos_instalacion",
        ["id"],
        unique=False,
    )

    op.add_column(
        "asignaciones",
        sa.Column("tipo_instalacion_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_asignaciones_tipo_instalacion_id",
        "asignaciones",
        ["tipo_instalacion_id"],
        unique=False,
    )
    op.create_foreign_key(
        "asignaciones_tipo_instalacion_id_fkey",
        "asignaciones",
        "tipos_instalacion",
        ["tipo_instalacion_id"],
        ["id"],
    )

    op.add_column(
        "requisitos_fotograficos",
        sa.Column("tipo_instalacion_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_requisitos_fotograficos_tipo_instalacion_id",
        "requisitos_fotograficos",
        ["tipo_instalacion_id"],
        unique=False,
    )
    op.create_foreign_key(
        "requisitos_fotograficos_tipo_instalacion_id_fkey",
        "requisitos_fotograficos",
        "tipos_instalacion",
        ["tipo_instalacion_id"],
        ["id"],
    )

    op.drop_constraint(
        "fk_requisitos_fotograficos_alcance_id_alcances",
        "requisitos_fotograficos",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_requisitos_fotograficos_alcance_id",
        table_name="requisitos_fotograficos",
    )
    op.drop_column(
        "requisitos_fotograficos",
        "alcance_id",
    )

    op.drop_table("requisitos_fotograficos_tipos_documento")
