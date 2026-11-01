from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.client import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
)
from app.services.client_service import ClientService


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)


@router.get(
    "/",
    response_model=list[ClientResponse]
)
def listar_clientes(
    db: Session = Depends(get_db)
):
    service = ClientService(db)

    return service.get_all()


@router.get(
    "/activos",
    response_model=list[ClientResponse]
)
def listar_clientes_activos(
    db: Session = Depends(get_db)
):
    service = ClientService(db)

    return service.get_active()


@router.get(
    "/{client_id}",
    response_model=ClientResponse
)
def obtener_cliente(
    client_id: int,
    db: Session = Depends(get_db)
):
    service = ClientService(db)

    client = service.get_by_id(client_id)

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El cliente no existe."
        )

    return client


@router.post(
    "/",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_cliente(
    data: ClientCreate,
    db: Session = Depends(get_db)
):
    service = ClientService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{client_id}",
    response_model=ClientResponse
)
def actualizar_cliente(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db)
):
    service = ClientService(db)

    try:
        return service.update(
            client_id,
            data
        )

    except ValueError as error:

        if str(error) == "El cliente no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_cliente(
    client_id: int,
    db: Session = Depends(get_db)
):
    service = ClientService(db)

    try:
        service.delete(client_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None