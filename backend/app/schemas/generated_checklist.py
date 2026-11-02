from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GeneratedChecklistItemCreate(BaseModel):
    requisito_fotografico_id: int = Field(gt=0)
    titulo: str = Field(min_length=1, max_length=255)
    descripcion: str | None = None
    obligatorio: bool = True
    orden: int = Field(default=1, ge=1)


class GeneratedChecklistItemUpdate(BaseModel):
    requisito_fotografico_id: int | None = Field(default=None, gt=0)
    titulo: str | None = Field(default=None, min_length=1, max_length=255)
    descripcion: str | None = None
    obligatorio: bool | None = None
    orden: int | None = Field(default=None, ge=1)


class GeneratedChecklistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    checklist_id: int
    item_plantilla_id: int | None
    requisito_fotografico_id: int
    requisito_nombre: str
    requisito_descripcion: str | None
    titulo: str
    descripcion: str | None
    obligatorio: bool
    orden: int


class GeneratedChecklistCreate(BaseModel):
    item_plantilla_ids: list[int] = Field(min_length=1)


class GeneratedChecklistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asignacion_id: int
    plantilla_checklist_id: int | None
    fecha_generacion: datetime
    estado: str
    items: list[GeneratedChecklistItemResponse]


class GeneratedChecklistDraftItemCreate(BaseModel):
    requisito_fotografico_id: int = Field(gt=0)
    titulo: str = Field(min_length=1, max_length=255)
    descripcion: str | None = None
    obligatorio: bool = True
    orden: int = Field(default=1, ge=1)


class GeneratedChecklistDraftItemUpdate(BaseModel):
    requisito_fotografico_id: int | None = Field(default=None, gt=0)
    titulo: str | None = Field(default=None, min_length=1, max_length=255)
    descripcion: str | None = None
    obligatorio: bool | None = None
    orden: int | None = Field(default=None, ge=1)


class GeneratedChecklistDraftItemResponse(BaseModel):
    id: int
    borrador_id: int
    item_origen_id: int | None
    item_plantilla_id: int | None
    requisito_fotografico_id: int
    requisito_nombre: str
    requisito_descripcion: str | None
    titulo: str
    descripcion: str | None
    obligatorio: bool
    orden: int


class GeneratedChecklistDraftResponse(BaseModel):
    id: int
    checklist_id: int
    fecha_creacion: datetime
    items: list[GeneratedChecklistDraftItemResponse]
