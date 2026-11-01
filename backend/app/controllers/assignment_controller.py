
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentUpdate,
)
from app.services.assignment_service import AssignmentService


router = APIRouter(
    prefix="/asignaciones",
    tags=["Asignaciones"],
)


@router.get(
    "/",
    response_model=list[AssignmentResponse],
)
def listar_asignaciones(
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    return service.get_all()


@router.get(
    "/estado/{estado}",
    response_model=list[AssignmentResponse],
)
def listar_asignaciones_por_estado(
    estado: str,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.get_by_estado(estado)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.get(
    "/proyecto/{proyecto_id}",
    response_model=list[AssignmentResponse],
)
def listar_asignaciones_por_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.get_by_proyecto(proyecto_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )


@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse,
)
def obtener_asignacion(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignment = service.get_by_id(assignment_id)

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La asignación no existe.",
        )

    return assignment


@router.post(
    "/",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_asignacion(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.put(
    "/{assignment_id}",
    response_model=AssignmentResponse,
)
def actualizar_asignacion(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.update(assignment_id, data)

    except ValueError as error:
        mensaje = str(error)

        if mensaje == "La asignación no existe.":
            codigo = status.HTTP_404_NOT_FOUND
        else:
            codigo = status.HTTP_400_BAD_REQUEST

        raise HTTPException(
            status_code=codigo,
            detail=mensaje,
        )


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_asignacion(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        service.delete(assignment_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    return None
