from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project_service import ProjectService


router = APIRouter(
    prefix="/proyectos",
    tags=["Proyectos"]
)


@router.get(
    "/",
    response_model=list[ProjectResponse]
)
def listar_proyectos(
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    return service.get_all()


@router.get(
    "/activos",
    response_model=list[ProjectResponse]
)
def listar_proyectos_activos(
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    return service.get_active()


@router.get(
    "/cliente/{cliente_id}",
    response_model=list[ProjectResponse]
)
def listar_proyectos_por_cliente(
    cliente_id: int,
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    return service.get_by_client(cliente_id)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse
)
def obtener_proyecto(
    project_id: int,
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    project = service.get_by_id(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El proyecto no existe."
        )

    return project


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_proyecto(
    data: ProjectCreate,
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse
)
def actualizar_proyecto(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    try:
        return service.update(
            project_id,
            data
        )

    except ValueError as error:

        if str(error) == "El proyecto no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_proyecto(
    project_id: int,
    db: Session = Depends(get_db)
):
    service = ProjectService(db)

    try:
        service.delete(project_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None