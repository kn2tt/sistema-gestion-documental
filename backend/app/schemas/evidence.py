from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvidenceBase(BaseModel):
    asignacion_id: int
    requisito_id: int
    archivo_url: str | None = None
    nombre_archivo: str | None = None
    fecha_carga: datetime | None = None
    usuario_id: int | None = None
    estado: str = "pendiente"


class EvidenceCreate(EvidenceBase):
    pass


class EvidenceUpdate(BaseModel):
    archivo_url: str | None = None
    nombre_archivo: str | None = None
    fecha_carga: datetime | None = None
    usuario_id: int | None = None
    estado: str | None = None


class EvidenceResponse(EvidenceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)