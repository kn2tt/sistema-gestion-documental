from datetime import date

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    cliente_id: int
    nombre: str
    descripcion: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    estado: str = "activo"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    cliente_id: int | None = None
    nombre: str | None = None
    descripcion: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    estado: str | None = None


class ProjectResponse(ProjectBase):
    id: int

    model_config = ConfigDict(from_attributes=True)