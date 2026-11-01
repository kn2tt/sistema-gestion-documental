from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id"),
        nullable=False,
        index=True
    )

    nombre: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    direccion: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True
    )

    departamento: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    provincia: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    distrito: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    estado: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    proyecto = relationship(
        "Project",
        backref="sites"
    )