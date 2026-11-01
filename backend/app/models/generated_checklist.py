from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GeneratedChecklist(Base):
    __tablename__ = "checklists_generados"

    __table_args__ = (
        UniqueConstraint(
            "asignacion_id",
            name="uq_checklists_generados_asignacion_id"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    asignacion_id: Mapped[int] = mapped_column(
        ForeignKey("asignaciones.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    plantilla_checklist_id: Mapped[int | None] = mapped_column(
        ForeignKey("plantillas_checklist.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    fecha_generacion: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    estado: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="borrador",
        server_default="borrador"
    )

    asignacion = relationship(
        "Assignment",
        back_populates="checklist_generado"
    )

    plantilla = relationship(
        "ChecklistTemplate"
    )

    items = relationship(
        "GeneratedChecklistItem",
        back_populates="checklist",
        cascade="all, delete-orphan",
        order_by="GeneratedChecklistItem.orden"
    )