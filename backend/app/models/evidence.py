from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Evidence(Base):
    __tablename__ = "evidencias"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    asignacion_id: Mapped[int] = mapped_column(
        ForeignKey("asignaciones.id"),
        nullable=False,
        index=True
    )

    requisito_id: Mapped[int] = mapped_column(
        ForeignKey("requisitos_fotograficos.id"),
        nullable=False,
        index=True
    )

    item_checklist_id: Mapped[int] = mapped_column(
        ForeignKey(
            "checklist_items_generados.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    archivo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    nombre_archivo: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # Identificador interno del archivo almacenado en Backblaze.
    storage_key: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    fecha_carga: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=True,
        index=True
    )

    # Estado funcional de la evidencia.
    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pendiente"
    )

    # Estado independiente del almacenamiento físico.
    estado_almacenamiento: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pendiente",
        server_default="pendiente"
    )

    # Información del archivo archivado en Google Drive.
    drive_file_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    drive_web_view_link: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True
    )

    fecha_archivado: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    usuario_archivado_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=True,
        index=True
    )

    asignacion = relationship(
        "Assignment",
        backref="evidencias"
    )

    requisito = relationship(
        "PhotoRequirement",
        backref="evidencias"
    )

    item_checklist = relationship(
        "GeneratedChecklistItem",
        back_populates="evidencias"
    )

    usuario = relationship(
        "User",
        foreign_keys=[usuario_id],
        backref="evidencias_cargadas"
    )

    usuario_archivado = relationship(
        "User",
        foreign_keys=[usuario_archivado_id]
    )
