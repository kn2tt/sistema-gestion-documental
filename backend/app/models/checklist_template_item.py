from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChecklistTemplateItem(Base):
    __tablename__ = "plantillas_checklist_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    plantilla_checklist_id: Mapped[int] = mapped_column(
        ForeignKey(
            "plantillas_checklist.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    requisito_fotografico_id: Mapped[int] = mapped_column(
        ForeignKey("requisitos_fotograficos.id"),
        nullable=False,
        index=True,
    )

    titulo: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    obligatorio: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    orden: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    plantilla = relationship(
        "ChecklistTemplate",
        back_populates="items",
    )

    requisito_fotografico = relationship("PhotoRequirement")