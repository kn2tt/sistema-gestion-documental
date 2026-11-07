from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref

from app.core.database import Base


class Document(Base):
    __tablename__ = "documentos"

    __table_args__ = (
        UniqueConstraint(
            "asignacion_id",
            name="uq_documentos_asignacion_id",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    asignacion_id: Mapped[int] = mapped_column(
        ForeignKey("asignaciones.id"),
        nullable=False,
        index=True,
    )

    plantilla_id: Mapped[int] = mapped_column(
        ForeignKey("plantillas.id"),
        nullable=False,
        index=True,
    )

    nombre_archivo: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Se conserva por compatibilidad con los registros anteriores.
    archivo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Clave interna del archivo vigente en Backblaze B2.
    storage_key: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="en_proceso",
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True,
    )

    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Indica si el archivo físico fue eliminado.
    eliminado: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    fecha_eliminacion: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    eliminado_por_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=True,
    )

    asignacion = relationship(
        "Assignment",
        backref=backref("documento", uselist=False),
    )

    plantilla = relationship(
        "Template",
        backref="documentos",
    )

    usuario = relationship(
        "User",
        foreign_keys=[usuario_id],
        backref="documentos_cargados",
    )

    eliminado_por = relationship(
        "User",
        foreign_keys=[eliminado_por_id],
    )

    operaciones = relationship(
        "DocumentOperation",
        back_populates="documento",
        cascade="all, delete-orphan",
        order_by="DocumentOperation.fecha_operacion.desc()",
    )
