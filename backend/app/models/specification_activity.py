from sqlalchemy import Boolean, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SpecificationActivity(Base):
    __tablename__ = "especificacion_actividades"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    especificacion_id: Mapped[int] = mapped_column(
        ForeignKey(
            "asignacion_especificaciones.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    descripcion: Mapped[str] = mapped_column(
        Text,
        nullable=False,
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

    especificacion = relationship(
        "AssignmentSpecification",
        back_populates="actividades",
    )
