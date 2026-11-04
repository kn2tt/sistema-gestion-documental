from pydantic import BaseModel, EmailStr

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str


class LoginResponse(BaseModel):
    usuario: UserResponse
    csrf_token: str


class CsrfResponse(BaseModel):
    csrf_token: str