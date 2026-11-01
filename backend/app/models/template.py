from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


plantilla_alcances = Table(
    "plantilla_alcances",
    Base.metadata,
    Column(
        "plantilla_id",
        ForeignKey("plantillas.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "alcance_id",
        ForeignKey("alcances.id"),
        primary_key=True,
    ),
)


class Template(Base):
    __tablename__ = "plantillas"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    cliente_id: Mapped[int | None] = mapped_column(
        ForeignKey("clientes.id"),
        nullable=True,
        index=True,
    )

    tipo_documento_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_documento.id"),
        nullable=False,
        index=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    archivo_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    cliente = relationship(
        "Client",
        backref="plantillas",
    )

    tipo_documento = relationship(
        "DocumentType",
        backref="plantillas",
    )

    alcances = relationship(
        "Scope",
        secondary=plantilla_alcances,
        lazy="selectin",
    )

    versiones = relationship(
        "TemplateVersion",
        back_populates="plantilla",
        order_by="TemplateVersion.numero_version.desc()",
        lazy="selectin",
    )
