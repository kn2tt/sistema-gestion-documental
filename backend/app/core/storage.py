import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from pydantic_settings import BaseSettings, SettingsConfigDict


class StorageSettings(BaseSettings):
    B2_ENDPOINT_URL: str
    B2_BUCKET_NAME: str
    B2_KEY_ID: str
    B2_APPLICATION_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


storage_settings = StorageSettings()

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
