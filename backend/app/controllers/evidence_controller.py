from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceResponse,
    EvidenceUpdate,
)
from app.services.evidence_service import EvidenceService


router = APIRouter(
    prefix="/evidencias",
    tags=["Evidencias"]
)


@router.get(
    "/",
    response_model=list[EvidenceResponse]
)
def listar_evidencias(
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    return service.get_by_status("completa")


@router.get(
    "/asignacion/{asignacion_id}",
    response_model=list[EvidenceResponse]
)
def listar_evidencias_por_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    return service.get_by_assignment(
        asignacion_id
    )


@router.get(
    "/requisito/{requisito_id}",
    response_model=list[EvidenceResponse]
)
def listar_evidencias_por_requisito(
    requisito_id: int,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    return service.get_by_requirement(
        requisito_id
    )


@router.get(
    "/asignacion/{asignacion_id}/requisito/{requisito_id}",
    response_model=list[EvidenceResponse]
)
def listar_evidencias_por_asignacion_y_requisito(
    asignacion_id: int,
    requisito_id: int,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    return service.get_by_assignment_and_requirement(
        asignacion_id,
        requisito_id
    )


@router.get(
    "/estado/{estado}",
    response_model=list[EvidenceResponse]
)
def listar_evidencias_por_estado(
    estado: str,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    return service.get_by_status(estado)


@router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse
)
def obtener_evidencia(
    evidence_id: int,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    evidence = service.get_by_id(evidence_id)

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La evidencia no existe."
        )

    return evidence


@router.post(
    "/",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_evidencia(
    data: EvidenceCreate,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put(
    "/{evidence_id}",
    response_model=EvidenceResponse
)
def actualizar_evidencia(
    evidence_id: int,
    data: EvidenceUpdate,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    try:
        return service.update(
            evidence_id,
            data
        )

    except ValueError as error:

        if str(error) == "La evidencia no existe.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(error)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.delete(
    "/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_evidencia(
    evidence_id: int,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)

    try:
        service.delete(evidence_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    return None