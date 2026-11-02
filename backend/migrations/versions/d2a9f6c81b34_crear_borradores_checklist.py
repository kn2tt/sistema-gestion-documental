"""crear borradores temporales para checklists generados

Revision ID: d2a9f6c81b34
Revises: c46bc26fee0f
Create Date: 2026-11-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d2a9f6c81b34"
down_revision: Union[str, Sequence[str], None] = "c46bc26fee0f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "checklists_generados_borradores",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False
        ),

        sa.Column(
            "checklist_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "fecha_creacion",
            sa.DateTime(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["checklist_id"],
            ["checklists_generados.id"],
            ondelete="CASCADE"
        ),

        sa.UniqueConstraint(
            "checklist_id",
            name="uq_checklists_generados_borradores_checklist_id"
        )
    )

    op.create_index(
        "ix_checklists_generados_borradores_id",
        "checklists_generados_borradores",
        ["id"]
    )

    op.create_index(
        "ix_checklists_generados_borradores_checklist_id",
        "checklists_generados_borradores",
        ["checklist_id"]
    )

    op.create_table(
        "checklist_items_generados_borradores",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False
        ),

        sa.Column(
            "borrador_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "item_origen_id",
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            "item_plantilla_id",
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            "requisito_fotografico_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "titulo",
            sa.String(length=255),
            nullable=False
        ),

        sa.Column(
            "descripcion",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "obligatorio",
            sa.Boolean(),
            nullable=False
        ),

        sa.Column(
            "orden",
            sa.Integer(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["borrador_id"],
            ["checklists_generados_borradores.id"],
            ondelete="CASCADE"
        ),

        sa.ForeignKeyConstraint(
            ["item_origen_id"],
            ["checklist_items_generados.id"],
            ondelete="SET NULL"
        ),

        sa.ForeignKeyConstraint(
            ["item_plantilla_id"],
            ["plantillas_checklist_items.id"],
            ondelete="SET NULL"
        ),

        sa.ForeignKeyConstraint(
            ["requisito_fotografico_id"],
            ["requisitos_fotograficos.id"],
            ondelete="RESTRICT"
        ),

        sa.UniqueConstraint(
            "borrador_id",
            "item_origen_id",
            name="uq_borrador_item_origen"
        )
    )

    op.create_index(
        "ix_checklist_items_generados_borradores_id",
        "checklist_items_generados_borradores",
        ["id"]
    )

    op.create_index(
        "ix_checklist_items_generados_borradores_borrador_id",
        "checklist_items_generados_borradores",
        ["borrador_id"]
    )

    op.create_index(
        "ix_checklist_items_generados_borradores_item_origen_id",
        "checklist_items_generados_borradores",
        ["item_origen_id"]
    )

    op.create_index(
        "ix_checklist_items_generados_borradores_item_plantilla_id",
        "checklist_items_generados_borradores",
        ["item_plantilla_id"]
    )

    op.create_index(
        "ix_borrador_items_requisito_id",
        "checklist_items_generados_borradores",
        ["requisito_fotografico_id"]
    )


def downgrade() -> None:

    op.drop_table(
        "checklist_items_generados_borradores"
    )

    op.drop_table(
        "checklists_generados_borradores"
    )
