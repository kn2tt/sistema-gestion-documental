from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChecklistTemplate(Base):
    __tablename__ = "plantillas_checklist"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    tipo_documento_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_documento.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    items = relationship(
        "ChecklistTemplateItem",
        back_populates="plantilla",
        cascade="all, delete-orphan",
        order_by="ChecklistTemplateItem.orden",
        lazy="selectin",
    )

    tipo_documento = relationship("DocumentType")