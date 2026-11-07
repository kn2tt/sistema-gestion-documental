
"""Preparar documentos únicos, bitácora y progreso documental."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d4c2a7b1e60"
down_revision: Union[str, Sequence[str], None] = "fc85053dcb8a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # Verificar que no existan varias filas por asignación.
    duplicados = bind.execute(
        sa.text(
            """
            SELECT asignacion_id, COUNT(*) AS cantidad
            FROM documentos
            GROUP BY asignacion_id
            HAVING COUNT(*) > 1
            ORDER BY asignacion_id
            """
        )
    ).fetchall()

    if duplicados:
        detalle = ", ".join(
            f"asignación {fila.asignacion_id}: {fila.cantidad} documentos"
            for fila in duplicados
        )
        raise RuntimeError(
            "No se puede establecer un documento por asignación. "
            "Se encontraron registros duplicados: "
            f"{detalle}. Revisa esos registros antes de continuar."
        )

    # -----------------------------------------------------
    # DOCUMENTOS
    # -----------------------------------------------------

    op.add_column(
        "documentos",
        sa.Column(
            "storage_key",
            sa.String(length=500),
            nullable=True,
        ),
    )

    op.add_column(
        "documentos",
        sa.Column(
            "storage_key_pendiente_eliminacion",
            sa.String(length=500),
            nullable=True,
        ),
    )

    op.alter_column(
        "documentos",
        "archivo_url",
        existing_type=sa.String(length=500),
        nullable=True,
    )

    op.add_column(
        "documentos",
        sa.Column(
            "eliminado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Retirar el valor predeterminado permanente.
    op.alter_column(
        "documentos",
        "eliminado",
        server_default=None,
    )

    op.add_column(
        "documentos",
        sa.Column(
            "fecha_eliminacion",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.add_column(
        "documentos",
        sa.Column(
            "eliminado_por_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_documentos_eliminado_por",
        "documentos",
        "usuarios",
        ["eliminado_por_id"],
        ["id"],
    )

    op.create_unique_constraint(
        "uq_documentos_asignacion_id",
        "documentos",
        ["asignacion_id"],
    )

    # -----------------------------------------------------
    # BITÁCORA DE OPERACIONES DOCUMENTALES
    # -----------------------------------------------------

    op.create_table(
        "documento_operaciones",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "documento_id",
            sa.Integer(),
            sa.ForeignKey(
                "documentos.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "usuario_id",
            sa.Integer(),
            sa.ForeignKey(
                "usuarios.id",
                ondelete="SET NULL",
            ),
            nullable=True,
        ),
        sa.Column(
            "tipo_operacion",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "nombre_archivo",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "detalles",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "fecha_operacion",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_documento_operaciones_documento_id",
        "documento_operaciones",
        ["documento_id"],
    )

    op.create_index(
        "ix_documento_operaciones_usuario_id",
        "documento_operaciones",
        ["usuario_id"],
    )

    # -----------------------------------------------------
    # PROGRESO DEL CHECKLIST DOCUMENTAL
    # -----------------------------------------------------

    op.create_table(
        "progreso_checklist_documental",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "item_checklist_id",
            sa.Integer(),
            sa.ForeignKey(
                "checklist_items_generados.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "completado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "usuario_id",
            sa.Integer(),
            sa.ForeignKey(
                "usuarios.id",
                ondelete="SET NULL",
            ),
            nullable=True,
        ),
        sa.Column(
            "fecha_actualizacion",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "item_checklist_id",
            name="uq_progreso_documental_item_checklist",
        ),
    )

    op.create_index(
        "ix_progreso_checklist_documental_item_checklist_id",
        "progreso_checklist_documental",
        ["item_checklist_id"],
    )


def downgrade() -> None:
    bind = op.get_bind()

    # Evitar que la reversión falle al restaurar archivo_url como NOT NULL.
    documentos_sin_url = bind.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM documentos
            WHERE archivo_url IS NULL
            """
        )
    ).scalar_one()

    if documentos_sin_url:
        raise RuntimeError(
            "No se puede revertir esta migración porque existen documentos "
            "con archivo_url nulo. Recupera o asigna las URL correspondientes "
            "antes de continuar."
        )

    op.drop_index(
        "ix_progreso_checklist_documental_item_checklist_id",
        table_name="progreso_checklist_documental",
    )
    op.drop_table("progreso_checklist_documental")

    op.drop_index(
        "ix_documento_operaciones_usuario_id",
        table_name="documento_operaciones",
    )
    op.drop_index(
        "ix_documento_operaciones_documento_id",
        table_name="documento_operaciones",
    )
    op.drop_table("documento_operaciones")

    op.drop_constraint(
        "uq_documentos_asignacion_id",
        "documentos",
        type_="unique",
    )

    op.drop_constraint(
        "fk_documentos_eliminado_por",
        "documentos",
        type_="foreignkey",
    )

    op.drop_column("documentos", "eliminado_por_id")
    op.drop_column("documentos", "fecha_eliminacion")
    op.drop_column("documentos", "eliminado")
    op.drop_column("documentos", "storage_key")
    op.drop_column("documentos", "storage_key_pendiente_eliminacion")

    op.alter_column(
        "documentos",
        "archivo_url",
        existing_type=sa.String(length=500),
        nullable=False,
    )
