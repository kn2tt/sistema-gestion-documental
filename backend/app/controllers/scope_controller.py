
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.scope import (
    ScopeCreate,
    ScopeResponse,
    ScopeStatusUpdate,
    ScopeUpdate,
)
from app.services.scope_service import ScopeService


router = APIRouter(
    prefix="/alcances",
    tags=["Alcances"]
)


@router.get(
    "/",
    response_model=list[ScopeResponse]
)
def listar_alcances(
    db: Session = Depends(get_db)
):
    return ScopeService(db).get_all()


@router.get(
    "/activos",
    response_model=list[ScopeResponse]
)
def listar_alcances_activos(
    db: Session = Depends(get_db)
):
    return ScopeService(db).get_active()


@router.get(
    "/{scope_id}",
    response_model=ScopeResponse
)
def obtener_alcance(
    scope_id: int,
    db: Session = Depends(get_db)
):
    scope = ScopeService(db).get_by_id(scope_id)

    if scope is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El alcance no existe."
        )

    return scope


@router.post(
    "/",
    response_model=ScopeResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_alcance(
    data: ScopeCreate,
    db: Session = Depends(get_db)
):
    try:
        return ScopeService(db).create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{scope_id}",
    response_model=ScopeResponse
)
def actualizar_alcance(
    scope_id: int,
    data: ScopeUpdate,
    db: Session = Depends(get_db)
):
    try:
        return ScopeService(db).update(scope_id, data)

    except ValueError as error:
        codigo = (
            status.HTTP_404_NOT_FOUND
            if str(error) == "El alcance no existe."
            else status.HTTP_400_BAD_REQUEST
        )

        raise HTTPException(
            status_code=codigo,
            detail=str(error)
        )


@router.patch(
    "/{scope_id}/estado",
    response_model=ScopeResponse
)
def cambiar_estado_alcance(
    scope_id: int,
    data: ScopeStatusUpdate,
    db: Session = Depends(get_db)
):
    try:
        return ScopeService(db).update_status(
            scope_id,
            data.activo
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

@router.delete(
    "/{scope_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_alcance(
    scope_id: int,
    db: Session = Depends(get_db)
):
    try:
        ScopeService(db).delete(scope_id)

    except ValueError as error:
        mensaje = str(error)

        codigo = (
            status.HTTP_404_NOT_FOUND
            if mensaje == "El alcance no existe."
            else status.HTTP_409_CONFLICT
        )

        raise HTTPException(
            status_code=codigo,
            detail=mensaje
        )
