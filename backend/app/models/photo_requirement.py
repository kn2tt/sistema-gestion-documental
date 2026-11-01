from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


requisitos_fotograficos_tipos_documento = Table(
    "requisitos_fotograficos_tipos_documento",
    Base.metadata,
    Column(
        "requisito_id",
        ForeignKey(
            "requisitos_fotograficos.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
    Column(
        "tipo_documento_id",
        ForeignKey(
            "tipos_documento.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    ),
)


class PhotoRequirement(Base):
    __tablename__ = "requisitos_fotograficos"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    alcance_id: Mapped[int] = mapped_column(
        ForeignKey("alcances.id"),
        nullable=False,
        index=True,
    )

    nombre: Mapped[str] = mapped_column(
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

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    alcance = relationship(
        "Scope",
        backref="requisitos_fotograficos",
    )

    tipos_documento = relationship(
        "DocumentType",
        secondary=requisitos_fotograficos_tipos_documento,
        lazy="selectin",
    )
