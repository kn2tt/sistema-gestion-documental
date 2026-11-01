from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "proyectos"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id"),
        nullable=False,
        index=True
    )

    nombre: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    fecha_inicio: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    fecha_fin: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="activo"
    )

    cliente = relationship(
        "Client",
        backref="proyectos"
    )