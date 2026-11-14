
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from pydantic_settings import BaseSettings, SettingsConfigDict


# =========================================================
# CONFIGURACIÓN DE ALMACENAMIENTO
# =========================================================

class StorageSettings(BaseSettings):
    # Cloudflare R2: plantillas.
    R2_ENDPOINT_URL: str
    R2_BUCKET_NAME: str
    R2_KEY_ID: str
    R2_APPLICATION_KEY: str
    R2_REGION: str = "auto"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


class EvidenceStorageSettings(BaseSettings):
    # Cloudflare R2: evidencias.
    R2_EVIDENCE_ENDPOINT_URL: str | None = None
    R2_EVIDENCE_BUCKET_NAME: str | None = None
    R2_EVIDENCE_KEY_ID: str | None = None
    R2_EVIDENCE_APPLICATION_KEY: str | None = None
    R2_EVIDENCE_REGION: str = "auto"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


class DocumentStorageSettings(BaseSettings):
    # Cloudflare R2: documentos.
    R2_DOCUMENT_ENDPOINT_URL: str | None = None
    R2_DOCUMENT_BUCKET_NAME: str | None = None
    R2_DOCUMENT_KEY_ID: str | None = None
    R2_DOCUMENT_APPLICATION_KEY: str | None = None
    R2_DOCUMENT_REGION: str = "auto"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


storage_settings = StorageSettings()
evidence_storage_settings = EvidenceStorageSettings()
document_storage_settings = DocumentStorageSettings()


# =========================================================
# CONFIGURACIÓN COMÚN DE LOS CLIENTES S3
# =========================================================

def _crear_cliente_r2(
    endpoint_url: str,
    key_id: str,
    application_key: str,
    region: str = "auto",
):
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=key_id,
        aws_secret_access_key=application_key,
        region_name=region,
        config=Config(
            signature_version="s3v4",
            retries={
                "max_attempts": 3,
                "mode": "standard",
            },
            s3={
                "addressing_style": "path",
            },
        ),
    )


# =========================================================
# CLIENTE R2 (PLANTILLAS)
# =========================================================

s3_client = _crear_cliente_r2(
    endpoint_url=storage_settings.R2_ENDPOINT_URL,
    key_id=storage_settings.R2_KEY_ID,
    application_key=storage_settings.R2_APPLICATION_KEY,
    region=storage_settings.R2_REGION,
)


# =========================================================
# CLIENTE R2 (EVIDENCIAS)
# Se crea únicamente cuando se utiliza.
# =========================================================

_evidence_s3_client = None


def obtener_cliente_evidencias():
    global _evidence_s3_client

    if _evidence_s3_client is not None:
        return _evidence_s3_client

    configuracion = evidence_storage_settings

    if not all([
        configuracion.R2_EVIDENCE_ENDPOINT_URL,
        configuracion.R2_EVIDENCE_BUCKET_NAME,
        configuracion.R2_EVIDENCE_KEY_ID,
        configuracion.R2_EVIDENCE_APPLICATION_KEY,
    ]):
        raise RuntimeError(
            "El almacenamiento de evidencias no está configurado. "
            "Revisa las variables R2_EVIDENCE en el archivo .env."
        )

    _evidence_s3_client = _crear_cliente_r2(
        endpoint_url=configuracion.R2_EVIDENCE_ENDPOINT_URL,
        key_id=configuracion.R2_EVIDENCE_KEY_ID,
        application_key=configuracion.R2_EVIDENCE_APPLICATION_KEY,
        region=configuracion.R2_EVIDENCE_REGION,
    )

    return _evidence_s3_client


# =========================================================
# CLIENTE R2 (DOCUMENTOS)
# Se crea únicamente cuando se utiliza.
# =========================================================

_document_s3_client = None


def obtener_cliente_documentos():
    global _document_s3_client

    if _document_s3_client is not None:
        return _document_s3_client

    configuracion = document_storage_settings

    if not all([
        configuracion.R2_DOCUMENT_ENDPOINT_URL,
        configuracion.R2_DOCUMENT_BUCKET_NAME,
        configuracion.R2_DOCUMENT_KEY_ID,
        configuracion.R2_DOCUMENT_APPLICATION_KEY,
    ]):
        raise RuntimeError(
            "El almacenamiento de documentos no está configurado. "
            "Revisa las variables R2_DOCUMENT en el archivo .env."
        )

    _document_s3_client = _crear_cliente_r2(
        endpoint_url=configuracion.R2_DOCUMENT_ENDPOINT_URL,
        key_id=configuracion.R2_DOCUMENT_KEY_ID,
        application_key=configuracion.R2_DOCUMENT_APPLICATION_KEY,
        region=configuracion.R2_DOCUMENT_REGION,
    )

    return _document_s3_client


# =========================================================
# ALMACENAMIENTO DE PLANTILLAS
# =========================================================

def verificar_conexion_storage():
    try:
        s3_client.head_bucket(
            Bucket=storage_settings.R2_BUCKET_NAME
        )

        return {
            "conexion": "exitosa",
            "servicio": "Cloudflare R2",
            "bucket": storage_settings.R2_BUCKET_NAME,
        }

    except ClientError as error:
        codigo = error.response.get(
            "Error", {}
        ).get("Code", "Error desconocido")

        raise RuntimeError(
            f"No se pudo verificar el bucket. Código: {codigo}"
        ) from None

    except BotoCoreError:
        raise RuntimeError(
            "No se pudo establecer conexión con Cloudflare R2."
        ) from None


def subir_archivo(
    ruta_local: str,
    clave_archivo: str,
    tipo_contenido: str = "application/octet-stream",
):
    try:
        s3_client.upload_file(
            ruta_local,
            storage_settings.R2_BUCKET_NAME,
            clave_archivo,
            ExtraArgs={
                "ContentType": tipo_contenido,
            },
        )

        return {
            "estado": "subido",
            "bucket": storage_settings.R2_BUCKET_NAME,
            "clave_archivo": clave_archivo,
        }

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo subir el archivo a Cloudflare R2."
        ) from None


def descargar_archivo(
    clave_archivo: str,
    ruta_destino: str,
):
    try:
        s3_client.download_file(
            storage_settings.R2_BUCKET_NAME,
            clave_archivo,
            ruta_destino,
        )

        return {
            "estado": "descargado",
            "bucket": storage_settings.R2_BUCKET_NAME,
            "clave_archivo": clave_archivo,
            "ruta_destino": ruta_destino,
        }

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo descargar el archivo desde Cloudflare R2."
        ) from None


# =========================================================
# ALMACENAMIENTO DE EVIDENCIAS
# =========================================================

def subir_evidencia(
    archivo,
    clave_archivo: str,
    tipo_contenido: str = "application/octet-stream",
):
    try:
        cliente = obtener_cliente_evidencias()

        cliente.upload_fileobj(
            archivo,
            evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME,
            clave_archivo,
            ExtraArgs={
                "ContentType": tipo_contenido,
            },
        )

        return {
            "estado": "subido",
            "bucket": evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME,
            "clave_archivo": clave_archivo,
        }

    except RuntimeError:
        raise

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo subir la fotografía a Cloudflare R2."
        ) from None


def eliminar_evidencia(
    clave_archivo: str,
):
    try:
        cliente = obtener_cliente_evidencias()

        cliente.delete_object(
            Bucket=evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME,
            Key=clave_archivo,
        )

        return {
            "estado": "eliminado",
            "clave_archivo": clave_archivo,
        }

    except RuntimeError:
        raise

    except (ClientError, BotoCoreError):
        raise RuntimeError(
            "No se pudo eliminar la fotografía de Cloudflare R2."
        ) from None


def descargar_evidencia_contenido(clave_archivo: str) -> bytes:
    try:
        cliente = obtener_cliente_evidencias()

        respuesta = cliente.get_object(
            Bucket=evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME,
            Key=clave_archivo,
        )

        return respuesta["Body"].read()

    except RuntimeError:
        raise

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo descargar la fotografía desde Cloudflare R2."
        ) from None


def generar_url_evidencia(
    clave_archivo: str,
    expiracion: int = 3600,
):
    try:
        cliente = obtener_cliente_evidencias()

        return cliente.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME,
                "Key": clave_archivo,
            },
            ExpiresIn=expiracion,
        )

    except RuntimeError:
        raise

    except (ClientError, BotoCoreError):
        raise RuntimeError(
            "No se pudo generar el enlace de la fotografía."
        ) from None


def verificar_conexion_storage_evidencias():
    try:
        cliente = obtener_cliente_evidencias()

        cliente.head_bucket(
            Bucket=evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME
        )

        return {
            "conexion": "exitosa",
            "servicio": "Cloudflare R2",
            "bucket": evidence_storage_settings.R2_EVIDENCE_BUCKET_NAME,
        }

    except RuntimeError:
        raise

    except ClientError as error:
        codigo = error.response.get(
            "Error", {}
        ).get("Code", "Error desconocido")

        raise RuntimeError(
            f"No se pudo verificar el bucket de evidencias. Código: {codigo}"
        ) from None

    except BotoCoreError:
        raise RuntimeError(
            "No se pudo establecer conexión con Cloudflare R2."
        ) from None
