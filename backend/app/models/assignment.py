
from datetime import date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    ForeignKey,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


asignacion_tecnicos = Table(
    "asignacion_tecnicos",
    Base.metadata,
    Column(
        "asignacion_id",
        ForeignKey("asignaciones.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tecnico_id",
        ForeignKey("usuarios.id"),
        primary_key=True,
    ),
)


class Assignment(Base):
    __tablename__ = "asignaciones"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id"),
        nullable=False,
        index=True,
    )

    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id"),
        nullable=False,
        index=True,
    )

    subproyecto_id: Mapped[int] = mapped_column(
        ForeignKey("subproyectos.id"),
        nullable=False,
        index=True,
    )

    tipo_documento_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_documento.id"),
        nullable=False,
        index=True,
    )

    plantilla_id: Mapped[int] = mapped_column(
        ForeignKey("plantillas.id"),
        nullable=False,
        index=True,
    )

    # Campo heredado: se conserva durante la transición.
    tecnico_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True,
    )

    documentador_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=True,
        index=True,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        default="pendiente",
        nullable=False,
    )

    edicion_evidencias_habilitada: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    fecha_asignacion: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False,
    )

    fecha_limite: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    proyecto = relationship("Project")
    site = relationship("Site")
    subproyecto = relationship("Subproject")
    tipo_documento = relationship("DocumentType")
    plantilla = relationship("Template")

    tecnico = relationship(
        "User",
        foreign_keys=[tecnico_id],
    )

    tecnicos = relationship(
        "User",
        secondary=asignacion_tecnicos,
    )

    documentador = relationship(
        "User",
        foreign_keys=[documentador_id],
    )

    especificaciones = relationship(
        "AssignmentSpecification",
        back_populates="asignacion",
        cascade="all, delete-orphan",
        order_by="AssignmentSpecification.orden",
    )

    checklist_generado = relationship(
        "GeneratedChecklist",
        back_populates="asignacion",
        uselist=False,
        cascade="all, delete-orphan"
    )
