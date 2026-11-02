from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GeneratedChecklistDraft(Base):
    __tablename__ = "checklists_generados_borradores"

    __table_args__ = (
        UniqueConstraint(
            "checklist_id",
            name="uq_checklists_generados_borradores_checklist_id"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    checklist_id: Mapped[int] = mapped_column(
        ForeignKey(
            "checklists_generados.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    checklist = relationship(
        "GeneratedChecklist"
    )

    items = relationship(
        "GeneratedChecklistDraftItem",
        back_populates="borrador",
        cascade="all, delete-orphan",
        order_by="GeneratedChecklistDraftItem.orden"
    )


class GeneratedChecklistDraftItem(Base):
    __tablename__ = "checklist_items_generados_borradores"

    __table_args__ = (
        UniqueConstraint(
            "borrador_id",
            "item_origen_id",
            name="uq_borrador_item_origen"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    borrador_id: Mapped[int] = mapped_column(
        ForeignKey(
            "checklists_generados_borradores.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    item_origen_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "checklist_items_generados.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    item_plantilla_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "plantillas_checklist_items.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    requisito_fotografico_id: Mapped[int] = mapped_column(
        ForeignKey(
            "requisitos_fotograficos.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    titulo: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    obligatorio: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    orden: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    borrador = relationship(
        "GeneratedChecklistDraft",
        back_populates="items"
    )

    requisito_fotografico = relationship(
        "PhotoRequirement"
    )

    item_origen = relationship(
        "GeneratedChecklistItem"
    )
