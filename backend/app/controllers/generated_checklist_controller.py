from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.generated_checklist_service import (
    GeneratedChecklistService,
)
from app.schemas.generated_checklist import GeneratedChecklistResponse


router = APIRouter(
    prefix="/asignaciones",
    tags=["Checklists generados"],
)


@router.post(
    "/{assignment_id}/checklist",
    response_model=GeneratedChecklistResponse,
    status_code=status.HTTP_201_CREATED,
)
def generar_checklist(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        return service.generate(assignment_id)

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


@router.get(
    "/{assignment_id}/checklist",
    response_model=GeneratedChecklistResponse,
)
def obtener_checklist(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        checklist = service.get_by_assignment(assignment_id)

        if checklist is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La asignación todavía no tiene un checklist generado.",
            )

        return checklist

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )
