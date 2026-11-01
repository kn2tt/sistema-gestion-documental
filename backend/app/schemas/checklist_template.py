from pydantic import BaseModel, ConfigDict, Field


class ChecklistTemplateItemCreate(BaseModel):
    requisito_fotografico_id: int
    titulo: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    obligatorio: bool = True
    orden: int = 1


class ChecklistTemplateItemUpdate(BaseModel):
    requisito_fotografico_id: int | None = None
    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    obligatorio: bool | None = None
    orden: int | None = None


class ChecklistRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None


class ChecklistTemplateItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plantilla_checklist_id: int
    requisito_fotografico_id: int
    titulo: str
    descripcion: str | None
    obligatorio: bool
    orden: int
    requisito_fotografico: ChecklistRequirementResponse


class ChecklistTemplateCreate(BaseModel):
    tipo_documento_id: int
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    activo: bool = True


class ChecklistTemplateUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    activo: bool | None = None


class ChecklistTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo_documento_id: int
    nombre: str
    descripcion: str | None
    activo: bool
    items: list[ChecklistTemplateItemResponse] = []
