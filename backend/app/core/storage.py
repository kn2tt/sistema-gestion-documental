
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from pydantic_settings import BaseSettings, SettingsConfigDict


class StorageSettings(BaseSettings):
    # Cuenta actual: almacenamiento de plantillas.
    B2_ENDPOINT_URL: str
    B2_BUCKET_NAME: str
    B2_KEY_ID: str
    B2_APPLICATION_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


class EvidenceStorageSettings(BaseSettings):
    # Cuenta independiente: almacenamiento de fotografías.
    B2_EVIDENCE_ENDPOINT_URL: str | None = None
    B2_EVIDENCE_BUCKET_NAME: str | None = None
    B2_EVIDENCE_KEY_ID: str | None = None
    B2_EVIDENCE_APPLICATION_KEY: str | None = None
    B2_EVIDENCE_REGION: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


storage_settings = StorageSettings()
evidence_storage_settings = EvidenceStorageSettings()


# =========================================================
# CLIENTE DE LA CUENTA ACTUAL (PLANTILLAS)
# =========================================================

s3_client = boto3.client(
    "s3",
    endpoint_url=storage_settings.B2_ENDPOINT_URL,
    aws_access_key_id=storage_settings.B2_KEY_ID,
    aws_secret_access_key=storage_settings.B2_APPLICATION_KEY,
    region_name="us-east-005",
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
# CLIENTE INDEPENDIENTE (EVIDENCIAS)
# Se crea únicamente cuando se utiliza.
# =========================================================

_evidence_s3_client = None


def obtener_cliente_evidencias():
    global _evidence_s3_client

    if _evidence_s3_client is not None:
        return _evidence_s3_client

    configuracion = evidence_storage_settings

    if not all([
        configuracion.B2_EVIDENCE_ENDPOINT_URL,
        configuracion.B2_EVIDENCE_BUCKET_NAME,
        configuracion.B2_EVIDENCE_KEY_ID,
        configuracion.B2_EVIDENCE_APPLICATION_KEY,
    ]):
        raise RuntimeError(
            "El almacenamiento de evidencias no está configurado. "
            "Revisa las variables B2_EVIDENCE en el archivo .env."
        )

    _evidence_s3_client = boto3.client(
        "s3",
        endpoint_url=configuracion.B2_EVIDENCE_ENDPOINT_URL,
        aws_access_key_id=configuracion.B2_EVIDENCE_KEY_ID,
        aws_secret_access_key=configuracion.B2_EVIDENCE_APPLICATION_KEY,
        region_name=configuracion.B2_EVIDENCE_REGION or None,
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

    return _evidence_s3_client


# =========================================================
# ALMACENAMIENTO ACTUAL (PLANTILLAS)
# =========================================================

def verificar_conexion_storage():
    try:
        s3_client.head_bucket(
            Bucket=storage_settings.B2_BUCKET_NAME
        )

        return {
            "conexion": "exitosa",
            "servicio": "Backblaze B2",
            "bucket": storage_settings.B2_BUCKET_NAME,
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
            "No se pudo establecer conexión con Backblaze B2."
        ) from None


def subir_archivo(
    ruta_local: str,
    clave_archivo: str,
    tipo_contenido: str = "application/octet-stream",
):
    try:
        s3_client.upload_file(
            ruta_local,
            storage_settings.B2_BUCKET_NAME,
            clave_archivo,
            ExtraArgs={
                "ContentType": tipo_contenido,
            },
        )

        return {
            "estado": "subido",
            "bucket": storage_settings.B2_BUCKET_NAME,
            "clave_archivo": clave_archivo,
        }

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo subir el archivo a Backblaze B2."
        ) from None


def descargar_archivo(
    clave_archivo: str,
    ruta_destino: str,
):
    try:
        s3_client.download_file(
            storage_settings.B2_BUCKET_NAME,
            clave_archivo,
            ruta_destino,
        )

        return {
            "estado": "descargado",
            "bucket": storage_settings.B2_BUCKET_NAME,
            "clave_archivo": clave_archivo,
            "ruta_destino": ruta_destino,
        }

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo descargar el archivo desde Backblaze B2."
        ) from None


# =========================================================
# ALMACENAMIENTO DE EVIDENCIAS (CUENTA NUEVA)
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
            evidence_storage_settings.B2_EVIDENCE_BUCKET_NAME,
            clave_archivo,
            ExtraArgs={
                "ContentType": tipo_contenido,
            },
        )

        return {
            "estado": "subido",
            "bucket": evidence_storage_settings.B2_EVIDENCE_BUCKET_NAME,
            "clave_archivo": clave_archivo,
        }

    except RuntimeError:
        raise

    except (ClientError, BotoCoreError, OSError):
        raise RuntimeError(
            "No se pudo subir la fotografía a Backblaze B2."
        ) from None


def eliminar_evidencia(
    clave_archivo: str,
):
    try:
        cliente = obtener_cliente_evidencias()

        cliente.delete_object(
            Bucket=evidence_storage_settings.B2_EVIDENCE_BUCKET_NAME,
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
            "No se pudo eliminar la fotografía de Backblaze B2."
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
                "Bucket": evidence_storage_settings.B2_EVIDENCE_BUCKET_NAME,
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
            Bucket=evidence_storage_settings.B2_EVIDENCE_BUCKET_NAME
        )

        return {
            "conexion": "exitosa",
            "servicio": "Backblaze B2",
            "bucket": evidence_storage_settings.B2_EVIDENCE_BUCKET_NAME,
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
            "No se pudo establecer conexión con el almacenamiento de evidencias."
        ) from None
