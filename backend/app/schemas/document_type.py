from pydantic import BaseModel, ConfigDict


class DocumentTypeBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    activo: bool = True


class DocumentTypeCreate(DocumentTypeBase):
    pass


class DocumentTypeUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    activo: bool | None = None


class DocumentTypeResponse(DocumentTypeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)