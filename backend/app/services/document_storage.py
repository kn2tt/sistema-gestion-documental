from pathlib import Path
from uuid import uuid4

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile

from app.core.storage import s3_client, storage_settings


EXTENSIONES_DOCUMENTOS = {
    ".xlsx",
    ".xls",
    ".docx",
    ".doc",
    ".pdf",
    ".pptx",
    ".ppt",
    ".odt",
    ".ods",
}


def validar_documento(nombre_archivo: str) -> str:
    extension = Path(nombre_archivo).suffix.lower()

    if extension not in EXTENSIONES_DOCUMENTOS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Formato no permitido. Utiliza Excel, Word, PDF, "
                "PowerPoint u OpenDocument."
            ),
        )

    return extension


async def guardar_documento(
    asignacion_id: int,
    archivo: UploadFile,
) -> tuple[str, str]:

    nombre_original = Path(
        archivo.filename or ""
    ).name.strip()

    if not nombre_original:
        raise HTTPException(
            status_code=400,
            detail="Debes seleccionar un documento.",
        )

    extension = validar_documento(nombre_original)

    contenido = await archivo.read()

    if not contenido:
        raise HTTPException(
            status_code=400,
            detail="El documento seleccionado está vacío.",
        )

    clave_archivo = (
        f"documentos/asignacion-{asignacion_id}/"
        f"{uuid4().hex}{extension}"
    )

    try:
        s3_client.put_object(
            Bucket=storage_settings.B2_BUCKET_NAME,
            Key=clave_archivo,
            Body=contenido,
            ContentType=(
                archivo.content_type
                or "application/octet-stream"
            ),
        )

    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=502,
            detail=(
                "No se pudo guardar el documento "
                "en Backblaze B2."
            ),
        ) from None

    return nombre_original[:255], clave_archivo


def obtener_documento(clave_archivo: str) -> bytes:
    if not clave_archivo or not clave_archivo.startswith("documentos/"):
        raise HTTPException(
            status_code=400,
            detail="La ubicación del documento no es válida.",
        )

    try:
        respuesta = s3_client.get_object(
            Bucket=storage_settings.B2_BUCKET_NAME,
            Key=clave_archivo,
        )

        return respuesta["Body"].read()

    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=404,
            detail=(
                "No se pudo recuperar el documento "
                "desde Backblaze B2."
            ),
        ) from None



def eliminar_documento(clave_archivo: str) -> None:
    if (
        not clave_archivo
        or not clave_archivo.startswith("documentos/")
    ):
        raise HTTPException(
            status_code=400,
            detail="La ubicación del documento no es válida.",
        )

    try:
        paginador = s3_client.get_paginator(
            "list_object_versions"
        )

        versiones_a_eliminar = []

        for pagina in paginador.paginate(
            Bucket=storage_settings.B2_BUCKET_NAME,
            Prefix=clave_archivo,
        ):
            for version in pagina.get("Versions", []):
                if version.get("Key") == clave_archivo:
                    versiones_a_eliminar.append({
                        "Key": clave_archivo,
                        "VersionId": version["VersionId"],
                    })

            for marcador in pagina.get("DeleteMarkers", []):
                if marcador.get("Key") == clave_archivo:
                    versiones_a_eliminar.append({
                        "Key": clave_archivo,
                        "VersionId": marcador["VersionId"],
                    })

        # Eliminar todas las versiones y marcadores encontrados.
        for objeto in versiones_a_eliminar:
            s3_client.delete_object(
                Bucket=storage_settings.B2_BUCKET_NAME,
                Key=objeto["Key"],
                VersionId=objeto["VersionId"],
            )

        # Si no hay versiones ni marcadores, no se ejecuta
        # un borrado normal que pueda crear otro marcador.

    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=502,
            detail=(
                "No se pudieron eliminar todas las versiones "
                "del documento en Backblaze B2."
            ),
        ) from None

