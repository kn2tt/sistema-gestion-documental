
from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Scope(Base):
    __tablename__ = "alcances"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    nombre: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
