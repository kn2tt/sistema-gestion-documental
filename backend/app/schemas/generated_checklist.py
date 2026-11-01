from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GeneratedChecklistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    checklist_id: int
    item_plantilla_id: int | None
    requisito_fotografico_id: int
    titulo: str
    descripcion: str | None
    obligatorio: bool
    orden: int


class GeneratedChecklistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asignacion_id: int
    plantilla_checklist_id: int | None
    fecha_generacion: datetime
    items: list[GeneratedChecklistItemResponse]
