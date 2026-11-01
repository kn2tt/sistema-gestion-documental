from pydantic import BaseModel, ConfigDict, EmailStr


class ClientBase(BaseModel):
    nombre: str
    ruc: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    correo: EmailStr | None = None


class ClientCreate(ClientBase):
    activo: bool = True


class ClientUpdate(BaseModel):
    nombre: str | None = None
    ruc: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    correo: EmailStr | None = None
    activo: bool | None = None


class ClientResponse(ClientBase):
    id: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)