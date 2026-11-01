from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.checklist_template import ChecklistTemplate
from app.models.checklist_template_item import ChecklistTemplateItem
from app.models.document_type import DocumentType
from app.models.photo_requirement import PhotoRequirement
from app.schemas.checklist_template import (
    ChecklistTemplateCreate,
    ChecklistTemplateUpdate,
    ChecklistTemplateResponse,
    ChecklistTemplateItemCreate,
    ChecklistTemplateItemUpdate,
    ChecklistTemplateItemResponse,
)


router = APIRouter(
    prefix="/plantillas-checklist",
    tags=["Plantillas de checklist"],
)


def obtener_plantilla_o_error(
    db: Session,
    plantilla_id: int,
) -> ChecklistTemplate:
    plantilla = (
        db.query(ChecklistTemplate)
        .options(selectinload(ChecklistTemplate.items))
        .filter(ChecklistTemplate.id == plantilla_id)
        .first()
    )

    if not plantilla:
        raise HTTPException(
            status_code=404,
            detail="La plantilla de checklist no existe.",
        )

    return plantilla


def validar_requisito(
    db: Session,
    requisito_id: int,
    tipo_documento_id: int,
) -> PhotoRequirement:
    requisito = db.query(PhotoRequirement).filter(
        PhotoRequirement.id == requisito_id
    ).first()

    if not requisito:
        raise HTTPException(
            status_code=404,
            detail="El requisito fotográfico no existe.",
        )

    if not any(
        tipo.id == tipo_documento_id
        for tipo in requisito.tipos_documento
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "El requisito fotográfico no está asociado "
                "al tipo de documento seleccionado."
            ),
        )

    return requisito


@router.get(
    "/",
    response_model=list[ChecklistTemplateResponse],
)
def listar_plantillas_checklist(
    db: Session = Depends(get_db),
):
    return (
        db.query(ChecklistTemplate)
        .options(selectinload(ChecklistTemplate.items))
        .order_by(ChecklistTemplate.id.desc())
        .all()
    )


@router.get(
    "/tipo-documento/{tipo_documento_id}",
    response_model=ChecklistTemplateResponse,
)
def obtener_por_tipo_documento(
    tipo_documento_id: int,
    db: Session = Depends(get_db),
):
    tipo_documento = db.get(DocumentType, tipo_documento_id)

    if not tipo_documento:
        raise HTTPException(
            status_code=404,
            detail="El tipo de documento no existe.",
        )

    plantilla = (
        db.query(ChecklistTemplate)
        .options(selectinload(ChecklistTemplate.items))
        .filter(
            ChecklistTemplate.tipo_documento_id
            == tipo_documento_id
        )
        .first()
    )

    if not plantilla:
        raise HTTPException(
            status_code=404,
            detail="Este tipo de documento aún no tiene una plantilla de checklist.",
        )

    return plantilla


@router.post(
    "/",
    response_model=ChecklistTemplateResponse,
    status_code=201,
)
def crear_plantilla(
    data: ChecklistTemplateCreate,
    db: Session = Depends(get_db),
):
    tipo_documento = db.get(
        DocumentType,
        data.tipo_documento_id,
    )

    if not tipo_documento:
        raise HTTPException(
            status_code=404,
            detail="El tipo de documento no existe.",
        )

    existente = db.query(ChecklistTemplate).filter(
        ChecklistTemplate.tipo_documento_id
        == data.tipo_documento_id
    ).first()

    if existente:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una plantilla de checklist para este tipo de documento.",
        )

    plantilla = ChecklistTemplate(
        tipo_documento_id=data.tipo_documento_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        activo=data.activo,
    )

    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)

    return plantilla


@router.put(
    "/{plantilla_id}",
    response_model=ChecklistTemplateResponse,
)
def actualizar_plantilla(
    plantilla_id: int,
    data: ChecklistTemplateUpdate,
    db: Session = Depends(get_db),
):
    plantilla = obtener_plantilla_o_error(db, plantilla_id)

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(plantilla, campo, valor)

    db.commit()
    db.refresh(plantilla)

    return plantilla


@router.post(
    "/{plantilla_id}/items",
    response_model=ChecklistTemplateItemResponse,
    status_code=201,
)
def crear_item(
    plantilla_id: int,
    data: ChecklistTemplateItemCreate,
    db: Session = Depends(get_db),
):
    plantilla = obtener_plantilla_o_error(db, plantilla_id)

    validar_requisito(
        db,
        data.requisito_fotografico_id,
        plantilla.tipo_documento_id,
    )

    item = ChecklistTemplateItem(
        plantilla_checklist_id=plantilla.id,
        requisito_fotografico_id=data.requisito_fotografico_id,
        titulo=data.titulo,
        descripcion=data.descripcion,
        obligatorio=data.obligatorio,
        orden=data.orden,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.put(
    "/items/{item_id}",
    response_model=ChecklistTemplateItemResponse,
)
def actualizar_item(
    item_id: int,
    data: ChecklistTemplateItemUpdate,
    db: Session = Depends(get_db),
):
    item = db.get(ChecklistTemplateItem, item_id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="El ítem de checklist no existe.",
        )

    cambios = data.model_dump(exclude_unset=True)

    requisito_id = cambios.get(
        "requisito_fotografico_id",
        item.requisito_fotografico_id,
    )

    validar_requisito(
        db,
        requisito_id,
        item.plantilla.tipo_documento_id,
    )

    for campo, valor in cambios.items():
        setattr(item, campo, valor)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/items/{item_id}", status_code=204)
def eliminar_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = db.get(ChecklistTemplateItem, item_id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="El ítem de checklist no existe.",
        )

    db.delete(item)
    db.commit()

    return Response(status_code=204)
