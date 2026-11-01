from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from botocore.exceptions import BotoCoreError, ClientError

from app.core.storage import (
    s3_client,
    storage_settings,
)


EXTENSIONES_PERMITIDAS = {
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


def validar_archivo(nombre_archivo: str) -> str:
    extension = Path(nombre_archivo).suffix.lower()

    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Formato no permitido. Utiliza Excel, Word, PDF, "
                "PowerPoint u OpenDocument."
            ),
        )

    return extension


async def guardar_archivo(archivo: UploadFile) -> tuple[str, str]:
    nombre_original = Path(archivo.filename or "").name.strip()

    if not nombre_original:
        raise HTTPException(
            status_code=400,
            detail="Debes seleccionar un archivo.",
        )

    extension = validar_archivo(nombre_original)
    contenido = await archivo.read()

    if not contenido:
        raise HTTPException(
            status_code=400,
            detail="El archivo seleccionado está vacío.",
        )

    clave_archivo = f"plantillas/{uuid4().hex}{extension}"

    try:
        s3_client.put_object(
            Bucket=storage_settings.B2_BUCKET_NAME,
            Key=clave_archivo,
            Body=contenido,
            ContentType=archivo.content_type or "application/octet-stream",
        )
    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=502,
            detail="No se pudo guardar la plantilla en Backblaze B2.",
        ) from None

    return nombre_original, clave_archivo


def obtener_archivo(clave_archivo: str) -> bytes:
    try:
        respuesta = s3_client.get_object(
            Bucket=storage_settings.B2_BUCKET_NAME,
            Key=clave_archivo,
        )
        return respuesta["Body"].read()

    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=404,
            detail="No se pudo recuperar la plantilla de Backblaze B2.",
        ) from None


def eliminar_archivo(clave_archivo: str) -> None:
    try:
        paginador = s3_client.get_paginator("list_object_versions")

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

        for objeto in versiones_a_eliminar:
            s3_client.delete_object(
                Bucket=storage_settings.B2_BUCKET_NAME,
                Key=objeto["Key"],
                VersionId=objeto["VersionId"],
            )

    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=502,
            detail=(
                "No se pudieron eliminar todas las versiones del archivo "
                "en Backblaze B2."
            ),
        ) from None


def duplicar_archivo(clave_origen: str) -> str:
    extension = Path(clave_origen).suffix.lower()

    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail="La extensión del archivo de origen no es válida.",
        )

    clave_destino = f"plantillas/{uuid4().hex}{extension}"

    try:
        s3_client.copy_object(
            Bucket=storage_settings.B2_BUCKET_NAME,
            CopySource={
                "Bucket": storage_settings.B2_BUCKET_NAME,
                "Key": clave_origen,
            },
            Key=clave_destino,
        )

        return clave_destino

    except (ClientError, BotoCoreError):
        raise HTTPException(
            status_code=502,
            detail="No se pudo copiar la versión en Backblaze B2.",
        ) from None

