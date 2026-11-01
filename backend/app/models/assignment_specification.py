from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AssignmentSpecification(Base):
    __tablename__ = "asignacion_especificaciones"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    asignacion_id: Mapped[int] = mapped_column(
        ForeignKey("asignaciones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    requisito_fotografico_id: Mapped[int] = mapped_column(
        ForeignKey("requisitos_fotograficos.id"),
        nullable=False,
        index=True,
    )

    titulo: Mapped[str] = mapped_column(
        String(150),
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

    asignacion = relationship(
        "Assignment",
        back_populates="especificaciones",
    )

    requisito_fotografico = relationship(
        "PhotoRequirement",
    )

    actividades = relationship(
        "SpecificationActivity",
        back_populates="especificacion",
        cascade="all, delete-orphan",
        order_by="SpecificationActivity.orden",
    )