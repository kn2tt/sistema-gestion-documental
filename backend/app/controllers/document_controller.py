from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_roles
from app.models.user import User
from app.services.document_service import DocumentService


router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"],
)


class DocumentChecklistProgressUpdate(BaseModel):
    completado: bool


# =====================================================
# LISTAR DOCUMENTOS
# Administrador: todos.
# Documentador: solo sus asignaciones.
# =====================================================

@router.get("/")
def listar_documentos(
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("administrador", "documentador")
    ),
):
    service = DocumentService(db)

    return service.listar_documentos(user)


# =====================================================
# CONSULTAR DOCUMENTO DE UNA ASIGNACIÓN
# =====================================================

@router.get("/asignacion/{asignacion_id}")
def obtener_documento_por_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("administrador", "documentador")
    ),
):
    service = DocumentService(db)

    return service.obtener_por_asignacion(
        asignacion_id,
        user,
    )


# =====================================================
# CHECKLIST DOCUMENTAL
# =====================================================

@router.get(
    "/asignacion/{asignacion_id}/checklist-documental"
)
def obtener_checklist_documental(
    asignacion_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("administrador", "documentador")
    ),
):
    service = DocumentService(db)

    return service.obtener_checklist_documental(
        asignacion_id,
        user,
    )


@router.patch(
    "/checklist-documental/items/{item_id}/progreso"
)
def actualizar_progreso_checklist(
    item_id: int,
    data: DocumentChecklistProgressUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("documentador")
    ),
):
    service = DocumentService(db)

    return service.actualizar_progreso_checklist(
        item_id=item_id,
        completado=data.completado,
        user=user,
    )


# =====================================================
# CARGAR O REEMPLAZAR DOCUMENTO
# Solo el documentador asignado.
# =====================================================

@router.post(
    "/asignacion/{asignacion_id}/archivo",
    status_code=status.HTTP_201_CREATED,
)
async def cargar_documento(
    asignacion_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("documentador")
    ),
):
    service = DocumentService(db)

    try:
        return await service.cargar_documento(
            asignacion_id=asignacion_id,
            archivo=archivo,
            user=user,
        )

    finally:
        await archivo.close()


# =====================================================
# CONTEXTO DE LA ASIGNACIÓN
# =====================================================

@router.get("/asignacion/{asignacion_id}/contexto")
def obtener_contexto_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("administrador", "documentador")
    ),
):
    service = DocumentService(db)

    return service.obtener_contexto_asignacion(
        asignacion_id,
        user,
    )


# =====================================================
# DESCARGAR PLANTILLA ASIGNADA
# =====================================================

@router.get("/asignacion/{asignacion_id}/plantilla")
def descargar_plantilla_asignada(
    asignacion_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("documentador")
    ),
):
    service = DocumentService(db)

    contenido, nombre_archivo = (
        service.descargar_plantilla_asignada(
            asignacion_id,
            user,
        )
    )

    nombre_codificado = quote(
        nombre_archivo,
        safe="",
    )

    return Response(
        content=contenido,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{nombre_codificado}"
            )
        },
    )


# =====================================================
# DESCARGAR DOCUMENTO
# Administrador o documentador asignado.
# =====================================================

@router.get("/{documento_id}/descargar")
def descargar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("administrador", "documentador")
    ),
):
    service = DocumentService(db)

    contenido, nombre_archivo = service.descargar_documento(
        documento_id,
        user,
    )

    nombre_codificado = quote(
        nombre_archivo,
        safe="",
    )

    return Response(
        content=contenido,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{nombre_codificado}"
            )
        },
    )


# =====================================================
# CONSULTAR BITÁCORA
# Administrador o documentador asignado.
# =====================================================

@router.get("/{documento_id}/operaciones")
def obtener_operaciones_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles("administrador", "documentador")
    ),
):
    service = DocumentService(db)

    return service.obtener_operaciones(
        documento_id,
        user,
    )


# =====================================================
# ELIMINAR DOCUMENTO
# Solo el administrador.
# =====================================================

@router.delete("/{documento_id}")
def eliminar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    administrador: User = Depends(
        require_roles("administrador")
    ),
):
    service = DocumentService(db)

    return service.eliminar_documento(
        documento_id,
        administrador,
    )