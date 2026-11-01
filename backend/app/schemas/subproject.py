from pydantic import BaseModel, ConfigDict, Field


class SubprojectScopeResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class SubprojectCreate(BaseModel):
    site_id: int
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    alcances_ids: list[int] = Field(min_length=1)


class SubprojectUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    alcances_ids: list[int] | None = Field(default=None, min_length=1)
    estado: bool | None = None


class SubprojectResponse(BaseModel):
    id: int
    site_id: int
    nombre: str
    descripcion: str | None = None
    estado: bool
    alcances: list[SubprojectScopeResponse]

    model_config = ConfigDict(from_attributes=True)
