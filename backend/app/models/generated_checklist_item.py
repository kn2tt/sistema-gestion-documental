from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GeneratedChecklistItem(Base):
    __tablename__ = "checklist_items_generados"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    checklist_id: Mapped[int] = mapped_column(
        ForeignKey("checklists_generados.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    item_plantilla_id: Mapped[int | None] = mapped_column(
        ForeignKey("plantillas_checklist_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    requisito_fotografico_id: Mapped[int] = mapped_column(
        ForeignKey("requisitos_fotograficos.id", ondelete="RESTRICT"),
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

    checklist = relationship(
        "GeneratedChecklist",
        back_populates="items"
    )

    item_plantilla = relationship(
        "ChecklistTemplateItem"
    )

    requisito_fotografico = relationship(
        "PhotoRequirement"
    )

    evidencias = relationship(
        "Evidence",
        back_populates="item_checklist"
    )
