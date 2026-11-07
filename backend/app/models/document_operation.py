from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentOperation(Base):
    __tablename__ = "documento_operaciones"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    documento_id: Mapped[int] = mapped_column(
        ForeignKey("documentos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    tipo_operacion: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    nombre_archivo: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    detalles: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    fecha_operacion: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    documento = relationship(
        "Document",
        back_populates="operaciones",
    )

    usuario = relationship(
        "User",
    )
