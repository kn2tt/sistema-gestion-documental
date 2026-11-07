
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    rol: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    correo: EmailStr | None = None
    rol: str | None = None
    activo: bool | None = None
    password: str | None = None


class UserResponse(UserBase):
    id: int
    activo: bool
    fecha_creacion: datetime
    online: bool = False
    ultimo_acceso: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
