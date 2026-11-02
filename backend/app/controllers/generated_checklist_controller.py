
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.services.generated_checklist_service import (
    GeneratedChecklistService,
)
from app.services.generated_checklist_draft_service import (
    GeneratedChecklistDraftService,
)

from app.schemas.generated_checklist import (
    GeneratedChecklistCreate,
    GeneratedChecklistResponse,
    GeneratedChecklistItemCreate,
    GeneratedChecklistItemUpdate,
    GeneratedChecklistDraftItemCreate,
    GeneratedChecklistDraftItemUpdate,
    GeneratedChecklistDraftResponse,
)


router = APIRouter(
    prefix="/asignaciones",
    tags=["Checklists generados"],
)


def convertir_error(error: ValueError):
    mensaje = str(error)

    codigo = (
        status.HTTP_404_NOT_FOUND
        if "no existe" in mensaje.lower()
        else status.HTTP_400_BAD_REQUEST
    )

    raise HTTPException(
        status_code=codigo,
        detail=mensaje,
    )


# =========================================================
# CHECKLIST INICIAL
# =========================================================

@router.post(
    "/{assignment_id}/checklist",
    response_model=GeneratedChecklistResponse,
    status_code=status.HTTP_201_CREATED,
)
def generar_checklist(
    assignment_id: int,
    data: GeneratedChecklistCreate,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        return service.generate(
            assignment_id,
            data.item_plantilla_ids,
        )

    except ValueError as error:
        convertir_error(error)


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
                detail=(
                    "La asignación todavía no tiene "
                    "un checklist generado."
                ),
            )

        return checklist

    except ValueError as error:
        convertir_error(error)


@router.post(
    "/checklist/{checklist_id}/items",
    response_model=GeneratedChecklistResponse,
    status_code=status.HTTP_201_CREATED,
)
def agregar_item_checklist(
    checklist_id: int,
    data: GeneratedChecklistItemCreate,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        return service.add_item(
            checklist_id,
            data.model_dump(),
        )

    except ValueError as error:
        convertir_error(error)


@router.put(
    "/checklist/items/{item_id}",
    response_model=GeneratedChecklistResponse,
)
def actualizar_item_checklist(
    item_id: int,
    data: GeneratedChecklistItemUpdate,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        return service.update_item(
            item_id,
            data.model_dump(exclude_unset=True),
        )

    except ValueError as error:
        convertir_error(error)


@router.delete(
    "/checklist/items/{item_id}",
    response_model=GeneratedChecklistResponse,
)
def eliminar_item_checklist(
    item_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        return service.delete_item(item_id)

    except ValueError as error:
        convertir_error(error)


@router.post(
    "/checklist/{checklist_id}/publicar",
    response_model=GeneratedChecklistResponse,
)
def publicar_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistService(db)

    try:
        return service.publish(checklist_id)

    except ValueError as error:
        convertir_error(error)


# =========================================================
# ACTUALIZACIÓN TEMPORAL DEL CHECKLIST PUBLICADO
# =========================================================

@router.post(
    "/checklist/{checklist_id}/actualizacion",
    response_model=GeneratedChecklistDraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def iniciar_actualizacion_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        return service.start_update(checklist_id)

    except ValueError as error:
        convertir_error(error)


@router.get(
    "/checklist/{checklist_id}/actualizacion",
    response_model=GeneratedChecklistDraftResponse,
)
def obtener_actualizacion_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        borrador = service.get_by_checklist(checklist_id)

        if borrador is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Este checklist no tiene "
                    "una actualización en edición."
                ),
            )

        return borrador

    except ValueError as error:
        convertir_error(error)


@router.post(
    "/checklist/actualizacion/{draft_id}/items",
    response_model=GeneratedChecklistDraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def agregar_item_actualizacion(
    draft_id: int,
    data: GeneratedChecklistDraftItemCreate,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        return service.add_item(
            draft_id,
            data.model_dump(),
        )

    except ValueError as error:
        convertir_error(error)


@router.put(
    "/checklist/actualizacion/items/{draft_item_id}",
    response_model=GeneratedChecklistDraftResponse,
)
def actualizar_item_actualizacion(
    draft_item_id: int,
    data: GeneratedChecklistDraftItemUpdate,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        return service.update_item(
            draft_item_id,
            data.model_dump(exclude_unset=True),
        )

    except ValueError as error:
        convertir_error(error)


@router.delete(
    "/checklist/actualizacion/items/{draft_item_id}",
    response_model=GeneratedChecklistDraftResponse,
)
def eliminar_item_actualizacion(
    draft_item_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        return service.delete_item(draft_item_id)

    except ValueError as error:
        convertir_error(error)


@router.delete(
    "/checklist/actualizacion/{draft_id}",
)
def descartar_actualizacion_checklist(
    draft_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        return service.discard(draft_id)

    except ValueError as error:
        convertir_error(error)


@router.post(
    "/checklist/actualizacion/{draft_id}/publicar",
    response_model=GeneratedChecklistResponse,
)
def publicar_actualizacion_checklist(
    draft_id: int,
    db: Session = Depends(get_db),
):
    service = GeneratedChecklistDraftService(db)

    try:
        return service.publish(draft_id)

    except ValueError as error:
        convertir_error(error)
