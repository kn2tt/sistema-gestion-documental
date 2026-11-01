from sqlalchemy import Boolean, Column, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


subproyecto_alcances = Table(
    "subproyecto_alcances",
    Base.metadata,
    Column(
        "subproyecto_id",
        ForeignKey("subproyectos.id"),
        primary_key=True,
    ),
    Column(
        "alcance_id",
        ForeignKey("alcances.id"),
        primary_key=True,
    ),
)


class Subproject(Base):
    __tablename__ = "subproyectos"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id"),
        nullable=False,
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

    estado: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    site = relationship(
        "Site",
        backref="subproyectos",
    )

    alcances = relationship(
        "Scope",
        secondary=subproyecto_alcances,
        lazy="selectin",
    )
