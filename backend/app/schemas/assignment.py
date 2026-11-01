from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SpecificationActivityCreate(BaseModel):
    descripcion: str = Field(min_length=1)
    obligatorio: bool = True
    orden: int = Field(default=1, ge=1)


class SpecificationActivityResponse(BaseModel):
    id: int
    descripcion: str
    obligatorio: bool
    orden: int

    model_config = ConfigDict(from_attributes=True)


class AssignmentSpecificationCreate(BaseModel):
    requisito_fotografico_id: int = Field(gt=0)
    titulo: str = Field(min_length=1, max_length=150)
    descripcion: str | None = None
    orden: int = Field(default=1, ge=1)
    actividades: list[SpecificationActivityCreate] = Field(
        default_factory=list
    )


class AssignmentSpecificationResponse(BaseModel):
    id: int
    requisito_fotografico_id: int
    titulo: str
    descripcion: str | None
    obligatorio: bool
    orden: int
    actividades: list[SpecificationActivityResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(BaseModel):
    proyecto_id: int = Field(gt=0)
    site_id: int = Field(gt=0)
    subproyecto_id: int = Field(gt=0)
    tipo_documento_id: int = Field(gt=0)
    plantilla_id: int = Field(gt=0)

    tecnicos_ids: list[int] = Field(min_length=1)
    documentador_id: int | None = Field(default=None, gt=0)

    estado: str = "pendiente"
    fecha_asignacion: date = Field(default_factory=date.today)
    fecha_limite: date | None = None

    especificaciones: list[AssignmentSpecificationCreate] = Field(
        default_factory=list
    )


class AssignmentUpdate(BaseModel):
    proyecto_id: int | None = Field(default=None, gt=0)
    site_id: int | None = Field(default=None, gt=0)
    subproyecto_id: int | None = Field(default=None, gt=0)
    tipo_documento_id: int | None = Field(default=None, gt=0)
    plantilla_id: int | None = Field(default=None, gt=0)

    tecnicos_ids: list[int] | None = None
    documentador_id: int | None = None

    estado: str | None = None
    fecha_asignacion: date | None = None
    fecha_limite: date | None = None

    especificaciones: list[AssignmentSpecificationCreate] | None = None

class AssignmentTechnicianResponse(BaseModel):
    id: int
    nombre: str
    apellido: str

    model_config = ConfigDict(from_attributes=True)

class AssignmentResponse(BaseModel):
    id: int
    cliente_nombre: str

    proyecto_id: int
    proyecto_nombre: str

    site_id: int
    site_nombre: str

    subproyecto_id: int
    subproyecto_nombre: str

    tipo_documento_id: int
    tipo_documento_nombre: str
    
    alcances: list[dict] = Field(default_factory=list)

    plantilla_id: int

    tecnico_id: int
    tecnicos_ids: list[int]
    tecnicos: list[AssignmentTechnicianResponse]

    documentador_id: int | None
    documentador_nombre: str | None

    estado: str
    fecha_asignacion: date
    fecha_limite: date | None

    especificaciones: list[AssignmentSpecificationResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)
