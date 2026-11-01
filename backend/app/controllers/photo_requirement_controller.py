from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.photo_requirement import (
    PhotoRequirementCreate,
    PhotoRequirementUpdate,
    PhotoRequirementResponse,
)
from app.services.photo_requirement_service import (
    PhotoRequirementService,
)


router = APIRouter(
    prefix="/requisitos-fotograficos",
    tags=["Requisitos fotográficos"],
)


def get_service(
    db: Session = Depends(get_db),
) -> PhotoRequirementService:
    return PhotoRequirementService(db)


@router.get(
    "/",
    response_model=list[PhotoRequirementResponse],
)
def listar_requisitos(
    service: PhotoRequirementService = Depends(get_service),
):
    return service.get_all()


@router.get(
    "/alcance/{scope_id}",
    response_model=list[PhotoRequirementResponse],
)
def listar_requisitos_por_alcance(
    scope_id: int,
    service: PhotoRequirementService = Depends(get_service),
):
    return service.get_by_scope(scope_id)


@router.get(
    "/alcance/{scope_id}/activos",
    response_model=list[PhotoRequirementResponse],
)
def listar_requisitos_activos_por_alcance(
    scope_id: int,
    service: PhotoRequirementService = Depends(get_service),
):
    return service.get_active_by_scope(scope_id)


@router.get(
    "/{requirement_id}",
    response_model=PhotoRequirementResponse,
)
def obtener_requisito(
    requirement_id: int,
    service: PhotoRequirementService = Depends(get_service),
):
    requirement = service.get_by_id(requirement_id)

    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El requisito fotográfico no existe.",
        )

    return requirement


@router.post(
    "/",
    response_model=PhotoRequirementResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_requisito(
    data: PhotoRequirementCreate,
    service: PhotoRequirementService = Depends(get_service),
):
    try:
        return service.create(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.put(
    "/{requirement_id}",
    response_model=PhotoRequirementResponse,
)
def actualizar_requisito(
    requirement_id: int,
    data: PhotoRequirementUpdate,
    service: PhotoRequirementService = Depends(get_service),
):
    try:
        return service.update(requirement_id, data)
    except ValueError as exc:
        message = str(exc)
        code = (
            status.HTTP_404_NOT_FOUND
            if "no existe" in message.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=code,
            detail=message,
        ) from exc


@router.delete(
    "/{requirement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_requisito(
    requirement_id: int,
    service: PhotoRequirementService = Depends(get_service),
):
    try:
        service.delete(requirement_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return None
