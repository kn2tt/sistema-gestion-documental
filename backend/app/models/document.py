from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documentos"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    asignacion_id: Mapped[int] = mapped_column(
        ForeignKey("asignaciones.id"),
        nullable=False,
        index=True
    )

    plantilla_id: Mapped[int] = mapped_column(
        ForeignKey("plantillas.id"),
        nullable=False,
        index=True
    )

    nombre_archivo: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    archivo_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="en_proceso"
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True
    )

    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    asignacion = relationship(
        "Assignment",
        backref="documentos"
    )

    plantilla = relationship(
        "Template",
        backref="documentos"
    )

    usuario = relationship(
        "User",
        backref="documentos_cargados"
    )