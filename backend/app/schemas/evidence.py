from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvidenceBase(BaseModel):
    asignacion_id: int
    requisito_id: int
    item_checklist_id: int

    archivo_url: str | None = None
    nombre_archivo: str | None = None
    fecha_carga: datetime | None = None
    usuario_id: int | None = None

    estado: str = "pendiente"
    estado_almacenamiento: str = "pendiente"

    drive_file_id: str | None = None
    drive_web_view_link: str | None = None
    fecha_archivado: datetime | None = None
    usuario_archivado_id: int | None = None


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
