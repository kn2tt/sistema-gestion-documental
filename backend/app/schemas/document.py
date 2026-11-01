from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    asignacion_id: int
    plantilla_id: int
    nombre_archivo: str
    archivo_url: str
    version: int = 1
    estado: str = "en_proceso"
    usuario_id: int


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    plantilla_id: int | None = None
    nombre_archivo: str | None = None
    archivo_url: str | None = None
    version: int | None = None
    estado: str | None = None
    usuario_id: int | None = None


class DocumentResponse(DocumentBase):
    id: int
    fecha_carga: datetime

    model_config = ConfigDict(from_attributes=True)