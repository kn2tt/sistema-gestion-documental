from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


password_hash = PasswordHash.recommended()


class UserService:

    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def get_by_id(self, user_id: int) -> User | None:
        return self.repository.get_by_id(user_id)

    def get_by_email(self, correo: str) -> User | None:
        return self.repository.get_by_email(correo)

    def get_all(self) -> list[User]:
        return self.repository.get_all()

    def create(self, data: UserCreate) -> User:
        existing_user = self.repository.get_by_email(data.correo)

        if existing_user:
            raise ValueError(
                "Ya existe un usuario registrado con ese correo."
            )

        hashed_password = password_hash.hash(data.password)

        user = User(
            nombre=data.nombre,
            apellido=data.apellido,
            correo=data.correo,
            password_hash=hashed_password,
            rol=data.rol,
        )

        return self.repository.create(user)

    def update(
        self,
        user_id: int,
        data: UserUpdate
    ) -> User:

        user = self.repository.get_by_id(user_id)

        if not user:
            raise ValueError(
                "El usuario no existe."
            )

        if data.correo is not None:
            existing_user = self.repository.get_by_email(
                data.correo
            )

            if existing_user and existing_user.id != user_id:
                raise ValueError(
                    "Ya existe otro usuario registrado con ese correo."
                )

        if data.nombre is not None:
            user.nombre = data.nombre

        if data.apellido is not None:
            user.apellido = data.apellido

        if data.correo is not None:
            user.correo = data.correo

        if data.rol is not None:
            user.rol = data.rol

        if data.activo is not None:
            user.activo = data.activo

        if data.password is not None and data.password.strip():
            user.password_hash = password_hash.hash(
                data.password
            )

        return self.repository.update(user)

    def delete(self, user_id: int) -> None:

        user = self.repository.get_by_id(user_id)

        if not user:
            raise ValueError(
                "El usuario no existe."
            )

        self.repository.delete(user)
        
        
        
        
    def actualizar_password(
        self,
        user_id: int,
        nueva_password: str
    ) -> User:

        user = self.repository.get_by_id(user_id)

        if not user:
            raise ValueError(
                "El usuario no existe."
            )

        user.password_hash = password_hash.hash(
            nueva_password
        )

        return self.repository.update(user)