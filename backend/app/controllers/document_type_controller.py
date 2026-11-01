from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.document_type import (
    DocumentTypeCreate,
    DocumentTypeResponse,
    DocumentTypeUpdate,
)
from app.services.document_type_service import DocumentTypeService


router = APIRouter(
    prefix="/tipos-documento",
    tags=["Tipos de documento"]
)


@router.get(
    "/",
    response_model=list[DocumentTypeResponse]
)
def listar_tipos_documento(
    db: Session = Depends(get_db)
):
    service = DocumentTypeService(db)

    return service.get_all()


@router.get(
    "/activos",
    response_model=list[DocumentTypeResponse]
)
def listar_tipos_documento_activos(
    db: Session = Depends(get_db)
):
    service = DocumentTypeService(db)

    return service.get_active()


@router.get(
    "/{document_type_id}",
    response_model=DocumentTypeResponse
)
def obtener_tipo_documento(
    document_type_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentTypeService(db)

    document_type = service.get_by_id(
        document_type_id
    )

    if not document_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El tipo de documento no existe."
        )

    return document_type


@router.post(
    "/",
    response_model=DocumentTypeResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_tipo_documento(
    data: DocumentTypeCreate,
    db: Session = Depends(get_db)
):
    service = DocumentTypeService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{document_type_id}",
    response_model=DocumentTypeResponse
)
def actualizar_tipo_documento(
    document_type_id: int,
    data: DocumentTypeUpdate,
    db: Session = Depends(get_db)
):
    service = DocumentTypeService(db)

    try:
        return service.update(
            document_type_id,
            data
        )

    except ValueError as error:

        if str(error) == "El tipo de documento no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{document_type_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_tipo_documento(
    document_type_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentTypeService(db)

    try:
        service.delete(document_type_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None