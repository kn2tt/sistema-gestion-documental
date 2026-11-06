from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_roles
from app.models.user import User

from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceResponse,
    EvidenceUpdate,
)

from app.services.evidence_service import EvidenceService


router = APIRouter(
    prefix="/evidencias",
    tags=["Evidencias"],
)


# =========================================================
# MANEJO DE ERRORES
# =========================================================

def convertir_error(error: Exception):
    mensaje = str(error)

    if isinstance(error, PermissionError):
        codigo = status.HTTP_403_FORBIDDEN

    elif isinstance(error, ValueError):
        codigo = (
            status.HTTP_404_NOT_FOUND
            if "no existe" in mensaje.lower()
            else status.HTTP_400_BAD_REQUEST
        )

    elif isinstance(error, RuntimeError):
        codigo = status.HTTP_502_BAD_GATEWAY

    else:
        codigo = status.HTTP_500_INTERNAL_SERVER_ERROR

    raise HTTPException(
        status_code=codigo,
        detail=mensaje,
    )


# =========================================================
# OPERACIONES DEL TÉCNICO
# =========================================================

@router.post(
    "/tecnico/asignaciones/{asignacion_id}/enviar",
)
def enviar_checklist_tecnico(
    asignacion_id: int,
    db: Session = Depends(get_db),
    tecnico: User = Depends(require_roles("tecnico")),
):
    service = EvidenceService(db)

    try:
        return service.enviar_checklist_tecnico(
            assignment_id=asignacion_id,
            tecnico_id=tecnico.id,
        )

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)

@router.post(
    "/tecnico/asignaciones/{asignacion_id}/items/{item_id}",
    status_code=status.HTTP_201_CREATED,
)
async def subir_fotografia_tecnico(
    asignacion_id: int,
    item_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    tecnico: User = Depends(require_roles("tecnico")),
):
    service = EvidenceService(db)

    try:
        # Se limita la lectura a 10 MB + 1 byte
        # para detectar archivos que superen el límite.
        contenido = await archivo.read(
            10 * 1024 * 1024 + 1
        )

        return service.subir_fotografia(
            assignment_id=asignacion_id,
            item_id=item_id,
            tecnico_id=tecnico.id,
            nombre_archivo=archivo.filename or "",
            tipo_contenido=archivo.content_type or "",
            contenido=contenido,
        )

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)

    finally:
        await archivo.close()


@router.get(
    "/tecnico/asignaciones/{asignacion_id}/items/{item_id}",
)
def listar_fotografias_tecnico(
    asignacion_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    tecnico: User = Depends(require_roles("tecnico")),
):
    service = EvidenceService(db)

    try:
        return service.listar_por_item_tecnico(
            assignment_id=asignacion_id,
            item_id=item_id,
            tecnico_id=tecnico.id,
        )

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)


@router.delete(
    "/tecnico/asignaciones/{asignacion_id}/items/{item_id}/{evidence_id}",
)
def eliminar_fotografia_tecnico(
    asignacion_id: int,
    item_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    tecnico: User = Depends(require_roles("tecnico")),
):
    service = EvidenceService(db)

    try:
        return service.eliminar_fotografia_tecnico(
            assignment_id=asignacion_id,
            item_id=item_id,
            evidence_id=evidence_id,
            tecnico_id=tecnico.id,
        )

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)


# =========================================================
# OPERACIONES DEL ADMINISTRADOR
# =========================================================

@router.get(
    "/",
    response_model=list[EvidenceResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_evidencias(
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    return service.get_by_status("completa")


@router.get(
    "/asignacion/{asignacion_id}",
    response_model=list[EvidenceResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_evidencias_por_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    return service.get_by_assignment(
        asignacion_id
    )


@router.get(
    "/requisito/{requisito_id}",
    response_model=list[EvidenceResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_evidencias_por_requisito(
    requisito_id: int,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    return service.get_by_requirement(
        requisito_id
    )


@router.get(
    "/asignacion/{asignacion_id}/requisito/{requisito_id}",
    response_model=list[EvidenceResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_evidencias_por_asignacion_y_requisito(
    asignacion_id: int,
    requisito_id: int,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    return service.get_by_assignment_and_requirement(
        asignacion_id,
        requisito_id,
    )


@router.get(
    "/estado/{estado}",
    response_model=list[EvidenceResponse],
    dependencies=[Depends(require_roles("administrador"))],
)
def listar_evidencias_por_estado(
    estado: str,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    return service.get_by_status(estado)


@router.get(
    "/{evidence_id}/url",
    dependencies=[Depends(require_roles("administrador"))],
)
def obtener_url_evidencia(
    evidence_id: int,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    try:
        url = service.get_url_by_id(evidence_id)

        return {
            "url": url
        }

    except (ValueError, RuntimeError) as error:
        convertir_error(error)


@router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse,
    dependencies=[Depends(require_roles("administrador"))],
)
def obtener_evidencia(
    evidence_id: int,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    evidence = service.get_by_id(evidence_id)

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La evidencia no existe.",
        )

    return evidence


@router.post(
    "/",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("administrador"))],
)
def crear_evidencia(
    data: EvidenceCreate,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    try:
        return service.create(data)

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)


@router.put(
    "/{evidence_id}",
    response_model=EvidenceResponse,
    dependencies=[Depends(require_roles("administrador"))],
)
def actualizar_evidencia(
    evidence_id: int,
    data: EvidenceUpdate,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    try:
        return service.update(
            evidence_id,
            data,
        )

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)


@router.delete(
    "/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("administrador"))],
)
def eliminar_evidencia(
    evidence_id: int,
    db: Session = Depends(get_db),
):
    service = EvidenceService(db)

    try:
        service.delete(evidence_id)

    except (ValueError, PermissionError, RuntimeError) as error:
        convertir_error(error)

    return None
