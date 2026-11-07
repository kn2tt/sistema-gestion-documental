from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentUpdate,
    AssignmentEvidenceEditingUpdate,
)
from app.services.assignment_service import AssignmentService


router = APIRouter(
    prefix="/asignaciones",
    tags=["Asignaciones"],
)

@router.get(
    "/tecnico/mis-asignaciones",
    response_model=list[AssignmentResponse],
)
def listar_mis_asignaciones(
    db: Session = Depends(get_db),
    tecnico: User = Depends(require_roles("tecnico")),
):
    service = AssignmentService(db)
    return service.get_by_tecnico(tecnico.id)

@router.get(
    "/documentador/mis-asignaciones",
    response_model=list[AssignmentResponse],
)
def listar_asignaciones_documentador(
    db: Session = Depends(get_db),
    documentador: User = Depends(
        require_roles("documentador")
    ),
):
    service = AssignmentService(db)

    return service.get_by_documentador(
        documentador.id
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
    usuario: User = Depends(get_current_user),
):
    service = AssignmentService(db)
    assignment = service.get_by_id(assignment_id)

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La asignación no existe.",
        )

    if (
        usuario.rol.strip().lower() == "documentador"
        and assignment["documentador_id"] != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta asignación.",
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


@router.patch(
    "/{assignment_id}/edicion-evidencias",
    dependencies=[Depends(require_roles("administrador"))],
)
def actualizar_edicion_evidencias(
    assignment_id: int,
    data: AssignmentEvidenceEditingUpdate,
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)

    try:
        return service.actualizar_edicion_evidencias(
            assignment_id=assignment_id,
            habilitada=data.habilitada,
        )

    except ValueError as error:
        mensaje = str(error)

        codigo = (
            status.HTTP_404_NOT_FOUND
            if mensaje == "La asignación no existe."
            else status.HTTP_400_BAD_REQUEST
        )

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
