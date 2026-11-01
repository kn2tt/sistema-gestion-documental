
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ScopeCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    descripcion: str | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("El nombre del alcance es obligatorio.")

        return value


class ScopeUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=150)
    descripcion: str | None = None
    activo: bool | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, value: str | None) -> str | None:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("El nombre del alcance es obligatorio.")

        return value


class ScopeStatusUpdate(BaseModel):
    activo: bool


class ScopeResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    activo: bool

    model_config = ConfigDict(from_attributes=True)
