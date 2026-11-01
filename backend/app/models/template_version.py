from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TemplateVersion(Base):
    __tablename__ = "plantilla_versiones"
    
    __table_args__ = (
        UniqueConstraint(
            "plantilla_id",
            "numero_version",
            name="uq_plantilla_version_numero",
        ),
    )
    

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    plantilla_id: Mapped[int] = mapped_column(
        ForeignKey("plantillas.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    numero_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    nombre_archivo: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    clave_archivo: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    motivo: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=True,
        index=True,
    )

    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    version_restaurada_id: Mapped[int | None] = mapped_column(
        ForeignKey("plantilla_versiones.id"),
        nullable=True,
    )

    plantilla = relationship(
        "Template",
        back_populates="versiones",
    )

    usuario = relationship("User")

    version_restaurada = relationship(
        "TemplateVersion",
        remote_side="TemplateVersion.id",
    )
