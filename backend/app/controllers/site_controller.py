from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.site import (
    SiteCreate,
    SiteResponse,
    SiteUpdate,
)
from app.services.site_service import SiteService


router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


@router.get(
    "/",
    response_model=list[SiteResponse]
)
def listar_sites(
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    return service.get_all()


@router.get(
    "/activos",
    response_model=list[SiteResponse]
)
def listar_sites_activos(
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    return service.get_active()


@router.get(
    "/proyecto/{proyecto_id}",
    response_model=list[SiteResponse]
)
def listar_sites_por_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    return service.get_by_project(proyecto_id)


@router.get(
    "/{site_id}",
    response_model=SiteResponse
)
def obtener_site(
    site_id: int,
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    site = service.get_by_id(site_id)

    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El site no existe."
        )

    return site


@router.post(
    "/",
    response_model=SiteResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_site(
    data: SiteCreate,
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{site_id}",
    response_model=SiteResponse
)
def actualizar_site(
    site_id: int,
    data: SiteUpdate,
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    try:
        return service.update(
            site_id,
            data
        )

    except ValueError as error:

        if str(error) == "El site no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{site_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_site(
    site_id: int,
    db: Session = Depends(get_db)
):
    service = SiteService(db)

    try:
        service.delete(site_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None