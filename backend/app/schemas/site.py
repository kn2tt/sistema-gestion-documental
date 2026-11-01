from pydantic import BaseModel, ConfigDict


class SiteBase(BaseModel):
    proyecto_id: int
    nombre: str
    direccion: str | None = None
    departamento: str | None = None
    provincia: str | None = None
    distrito: str | None = None
    estado: bool = True


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    proyecto_id: int | None = None
    nombre: str | None = None
    direccion: str | None = None
    departamento: str | None = None
    provincia: str | None = None
    distrito: str | None = None
    estado: bool | None = None


class SiteResponse(SiteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)