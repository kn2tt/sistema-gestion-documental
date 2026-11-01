from pathlib import Path
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import (
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate,
    TemplateVersionResponse,
)
from app.services.template_service import TemplateService
from app.services.template_storage import obtener_archivo


router = APIRouter(prefix="/plantillas", tags=["Plantillas"])


@router.get("/", response_model=list[TemplateResponse])
def listar_plantillas(db: Session = Depends(get_db)):
    return TemplateRepository(db).get_all()


@router.get("/{template_id}", response_model=TemplateResponse)
def obtener_plantilla(
    template_id: int,
    db: Session = Depends(get_db),
):
    plantilla = TemplateRepository(db).get_by_id(template_id)

    if not plantilla:
        raise HTTPException(
            status_code=404,
            detail="La plantilla no existe.",
        )

    return plantilla


@router.post("/", response_model=TemplateResponse, status_code=201)
async def crear_plantilla(
    cliente_id: int = Form(...),
    tipo_documento_id: int = Form(...),
    nombre: str = Form(...),
    descripcion: str | None = Form(None),
    alcances_ids: list[int] = Form(...),
    usuario_id: int | None = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    data = TemplateCreate(
        cliente_id=cliente_id,
        tipo_documento_id=tipo_documento_id,
        nombre=nombre,
        descripcion=descripcion,
        alcances_ids=alcances_ids,
    )

    return await TemplateService(db).crear(data, archivo, usuario_id)


@router.put("/{template_id}", response_model=TemplateResponse)
def actualizar_plantilla(
    template_id: int,
    data: TemplateUpdate,
    db: Session = Depends(get_db),
):
    return TemplateService(db).actualizar(template_id, data)


@router.post(
    "/{template_id}/versiones",
    response_model=TemplateResponse,
)
async def subir_version(
    template_id: int,
    motivo: str = Form(...),
    usuario_id: int | None = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await TemplateService(db).subir_version(
        template_id,
        archivo,
        usuario_id,
        motivo,
    )


@router.get(
    "/{template_id}/versiones",
    response_model=list[TemplateVersionResponse],
)
def listar_versiones(
    template_id: int,
    db: Session = Depends(get_db),
):
    plantilla = TemplateRepository(db).get_by_id(template_id)

    if not plantilla:
        raise HTTPException(
            status_code=404,
            detail="La plantilla no existe.",
        )

    return plantilla.versiones


@router.post(
    "/{template_id}/versiones/{version_id}/restaurar",
    response_model=TemplateResponse,
)
def restaurar_version(
    template_id: int,
    version_id: int,
    motivo: str = Form(...),
    usuario_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    return TemplateService(db).restaurar_version(
        template_id,
        version_id,
        usuario_id,
        motivo,
    )


@router.delete(
    "/{template_id}/versiones/{version_id}",
    status_code=204,
)
def eliminar_version(
    template_id: int,
    version_id: int,
    db: Session = Depends(get_db),
):
    TemplateService(db).eliminar_version(
        template_id,
        version_id,
    )
    return Response(status_code=204)



@router.get("/{template_id}/descargar")
def descargar_plantilla(
    template_id: int,
    numero_version: int | None = None,
    db: Session = Depends(get_db),
):
    repository = TemplateRepository(db)
    plantilla = repository.get_by_id(template_id)

    if not plantilla:
        raise HTTPException(
            status_code=404,
            detail="La plantilla no existe.",
        )

    if numero_version is None:
        clave = plantilla.archivo_url

        version_actual = next(
            (
                version
                for version in plantilla.versiones
                if version.numero_version == plantilla.version
            ),
            None,
        )

        nombre = (
            version_actual.nombre_archivo
            if version_actual
            else Path(clave).name
        )
    else:
        version = repository.get_version_by_number(
            template_id,
            numero_version,
        )

        if not version:
            raise HTTPException(
                status_code=404,
                detail="La versión solicitada no existe para esta plantilla.",
            )

        clave = version.clave_archivo
        nombre = version.nombre_archivo

    try:
        contenido = obtener_archivo(clave)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="No se pudo recuperar la plantilla de Backblaze B2.",
        ) from exc

    nombre_seguro = Path(nombre).name

    return Response(
        content=contenido,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{quote(nombre_seguro)}"'
            ),
        },
    )


@router.patch("/{template_id}/estado", response_model=TemplateResponse)
def cambiar_estado(
    template_id: int,
    activo: bool = Form(...),
    db: Session = Depends(get_db),
):
    return TemplateService(db).cambiar_estado(template_id, activo)
