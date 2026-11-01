from pydantic import BaseModel, ConfigDict, Field, computed_field


class PhotoRequirementBase(BaseModel):
    alcance_id: int
    nombre: str
    descripcion: str | None = None
    obligatorio: bool = True
    orden: int = 1
    activo: bool = True


class PhotoRequirementCreate(PhotoRequirementBase):
    tipos_documento_ids: list[int] = Field(min_length=1)


class PhotoRequirementUpdate(BaseModel):
    alcance_id: int | None = None
    nombre: str | None = None
    descripcion: str | None = None
    obligatorio: bool | None = None
    orden: int | None = None
    activo: bool | None = None
    tipos_documento_ids: list[int] | None = Field(
        default=None,
        min_length=1,
    )


class PhotoRequirementResponse(PhotoRequirementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def tipos_documento_ids(self) -> list[int]:
        return [
            tipo.id
            for tipo in self.tipos_documento
        ]

    tipos_documento: list = Field(exclude=True)
