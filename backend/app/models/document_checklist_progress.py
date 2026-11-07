from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentChecklistProgress(Base):
    __tablename__ = "progreso_checklist_documental"

    __table_args__ = (
        UniqueConstraint(
            "item_checklist_id",
            name="uq_progreso_documental_item_checklist",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    item_checklist_id: Mapped[int] = mapped_column(
        ForeignKey(
            "checklist_items_generados.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    completado: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )

    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    item_checklist = relationship(
        "GeneratedChecklistItem",
    )

    usuario = relationship(
        "User",
    )
