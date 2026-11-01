from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Client(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    nombre: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    ruc: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    contacto: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    telefono: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    correo: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )