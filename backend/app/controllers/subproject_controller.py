from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.subproject import (
    SubprojectCreate,
    SubprojectResponse,
    SubprojectUpdate,
)
from app.services.subproject_service import SubprojectService


router = APIRouter(
    prefix="/subproyectos",
    tags=["Subproyectos"],
)


@router.get("/", response_model=list[SubprojectResponse])
def listar_subproyectos(db: Session = Depends(get_db)):
    return SubprojectService(db).get_all()


@router.get("/activos", response_model=list[SubprojectResponse])
def listar_subproyectos_activos(db: Session = Depends(get_db)):
    return SubprojectService(db).get_active()


@router.get("/site/{site_id}", response_model=list[SubprojectResponse])
def listar_subproyectos_por_site(
    site_id: int,
    db: Session = Depends(get_db),
):
    return SubprojectService(db).get_by_site(site_id)


@router.get("/{subproject_id}", response_model=SubprojectResponse)
def obtener_subproyecto(
    subproject_id: int,
    db: Session = Depends(get_db),
):
    subproject = SubprojectService(db).get_by_id(subproject_id)

    if not subproject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El subproyecto no existe.",
        )

    return subproject


@router.post(
    "/",
    response_model=SubprojectResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_subproyecto(
    data: SubprojectCreate,
    db: Session = Depends(get_db),
):
    try:
        return SubprojectService(db).create(data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.put("/{subproject_id}", response_model=SubprojectResponse)
def actualizar_subproyecto(
    subproject_id: int,
    data: SubprojectUpdate,
    db: Session = Depends(get_db),
):
    try:
        return SubprojectService(db).update(subproject_id, data)
    except ValueError as error:
        code = (
            status.HTTP_404_NOT_FOUND
            if str(error) == "El subproyecto no existe."
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=code, detail=str(error))


@router.delete(
    "/{subproject_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_subproyecto(
    subproject_id: int,
    db: Session = Depends(get_db),
):
    try:
        SubprojectService(db).delete(subproject_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    return None

