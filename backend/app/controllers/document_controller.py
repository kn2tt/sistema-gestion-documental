from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
)
from app.services.document_service import DocumentService


router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"]
)


@router.get(
    "/",
    response_model=list[DocumentResponse]
)
def listar_documentos(
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    return service.get_all()


@router.get(
    "/asignacion/{asignacion_id}",
    response_model=list[DocumentResponse]
)
def listar_documentos_por_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    return service.get_by_assignment(
        asignacion_id
    )


@router.get(
    "/usuario/{usuario_id}",
    response_model=list[DocumentResponse]
)
def listar_documentos_por_usuario(
    usuario_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    return service.get_by_user(
        usuario_id
    )


@router.get(
    "/estado/{estado}",
    response_model=list[DocumentResponse]
)
def listar_documentos_por_estado(
    estado: str,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    return service.get_by_status(
        estado
    )


@router.get(
    "/asignacion/{asignacion_id}/ultimo",
    response_model=DocumentResponse
)
def obtener_ultimo_documento(
    asignacion_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    document = service.get_latest_by_assignment(
        asignacion_id
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe ningún documento para esta asignación."
        )

    return document


@router.get(
    "/{document_id}",
    response_model=DocumentResponse
)
def obtener_documento(
    document_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    document = service.get_by_id(document_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El documento no existe."
        )

    return document


@router.post(
    "/",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_documento(
    data: DocumentCreate,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{document_id}",
    response_model=DocumentResponse
)
def actualizar_documento(
    document_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    try:
        return service.update(
            document_id,
            data
        )

    except ValueError as error:

        if str(error) == "El documento no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_documento(
    document_id: int,
    db: Session = Depends(get_db)
):
    service = DocumentService(db)

    try:
        service.delete(document_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None