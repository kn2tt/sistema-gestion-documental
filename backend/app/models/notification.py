
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notificaciones"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )

    tipo: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
    )

    titulo: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    mensaje: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    entidad_tipo: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    entidad_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    fecha_lectura: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    __table_args__ = (
        Index(
            "ix_notificaciones_usuario_lectura",
            "usuario_id",
            "fecha_lectura",
        ),
    )
