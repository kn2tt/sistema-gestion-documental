
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class TemplateCreate(BaseModel):
    cliente_id: int
    tipo_documento_id: int
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    alcances_ids: list[int] = Field(min_length=1)

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("El nombre de la plantilla es obligatorio.")

        return value

    @field_validator("descripcion")
    @classmethod
    def limpiar_descripcion(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip() or None



class TemplateUpdate(BaseModel):
    cliente_id: int | None = None
    tipo_documento_id: int | None = None
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    alcances_ids: list[int] | None = None
    activo: bool | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("El nombre de la plantilla es obligatorio.")

        return value

    @field_validator("descripcion")
    @classmethod
    def limpiar_descripcion(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip() or None


class TemplateVersionResponse(BaseModel):
    id: int
    plantilla_id: int
    numero_version: int
    nombre_archivo: str
    motivo: str
    usuario_id: int | None
    fecha_carga: datetime
    version_restaurada_id: int | None

    model_config = ConfigDict(from_attributes=True)


class ScopeSummary(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)


class TemplateResponse(BaseModel):
    id: int
    cliente_id: int | None
    tipo_documento_id: int
    nombre: str
    descripcion: str | None
    archivo_url: str
    version: int
    activo: bool
    fecha_carga: datetime
    alcances: list[ScopeSummary] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
