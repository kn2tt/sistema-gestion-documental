from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.services.user_service import UserService


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.get(
    "/",
    response_model=list[UserResponse]
)
def listar_usuarios(
    db: Session = Depends(get_db)
):
    service = UserService(db)

    return service.get_all()


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def obtener_usuario(
    user_id: int,
    db: Session = Depends(get_db)
):
    service = UserService(db)

    user = service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no existe."
        )

    return user


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_usuario(
    data: UserCreate,
    db: Session = Depends(get_db)
):
    service = UserService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def actualizar_usuario(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db)
):
    service = UserService(db)

    try:
        return service.update(
            user_id,
            data
        )

    except ValueError as error:
        if str(error) == "El usuario no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db)
):
    service = UserService(db)

    try:
        service.delete(user_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None