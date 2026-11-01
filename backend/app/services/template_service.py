from datetime import datetime

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.document_type import DocumentType
from app.models.scope import Scope
from app.models.template import Template
from app.models.template_version import TemplateVersion
from app.models.user import User
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.services.template_storage import (
    guardar_archivo,
    obtener_archivo,
    duplicar_archivo,
    eliminar_archivo,
)


class TemplateService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = TemplateRepository(db)

    def _validar_referencias(
        self,
        cliente_id: int,
        tipo_documento_id: int,
        alcances_ids: list[int],
    ) -> list[Scope]:
        cliente = self.db.get(Client, cliente_id)
        if not cliente or not cliente.activo:
            raise HTTPException(
                status_code=400,
                detail="El cliente no existe o está inactivo.",
            )

        tipo = self.db.get(DocumentType, tipo_documento_id)
        if not tipo or not tipo.activo:
            raise HTTPException(
                status_code=400,
                detail="El tipo de documento no existe o está inactivo.",
            )

        ids = set(alcances_ids)
        if not ids or len(ids) != len(alcances_ids):
            raise HTTPException(
                status_code=400,
                detail="Selecciona uno o más alcances sin repetir.",
            )

        alcances = list(
            self.db.execute(
                select(Scope).where(Scope.id.in_(ids))
            ).scalars().all()
        )

        if len(alcances) != len(ids):
            raise HTTPException(
                status_code=400,
                detail="Uno o más alcances no existen.",
            )

        if any(not alcance.activo for alcance in alcances):
            raise HTTPException(
                status_code=400,
                detail="Todos los alcances seleccionados deben estar activos.",
            )

        return alcances

    def _validar_usuario(self, usuario_id: int | None) -> User | None:
        if usuario_id is None:
            return None

        usuario = self.db.get(User, usuario_id)

        if not usuario or not usuario.activo:
            raise HTTPException(
                status_code=400,
                detail="El usuario responsable no existe o está inactivo.",
            )

        return usuario

    async def crear(
        self,
        data: TemplateCreate,
        archivo: UploadFile,
        usuario_id: int | None = None,
    ) -> Template:
        self._validar_usuario(usuario_id)

        alcances = self._validar_referencias(
            data.cliente_id,
            data.tipo_documento_id,
            data.alcances_ids,
        )

        existente = self.repository.find_active_same_combination(
            data.cliente_id,
            data.tipo_documento_id,
            set(data.alcances_ids),
        )

        if existente:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Ya existe una plantilla para ese cliente, "
                    "tipo de documento y combinación de alcances. "
                    "Utiliza la opción 'Subir nueva versión' "
                    "si deseas actualizar su archivo."
                ),
            )

        nombre_archivo, clave_archivo = await guardar_archivo(archivo)

        plantilla = Template(
            cliente_id=data.cliente_id,
            tipo_documento_id=data.tipo_documento_id,
            nombre=data.nombre.strip(),
            descripcion=(
                data.descripcion.strip()
                if data.descripcion and data.descripcion.strip()
                else None
            ),
            archivo_url=clave_archivo,
            version=1,
            activo=True,
            alcances=alcances,
        )

        try:
            self.db.add(plantilla)
            self.db.flush()

            version = TemplateVersion(
                plantilla_id=plantilla.id,
                numero_version=1,
                nombre_archivo=nombre_archivo,
                clave_archivo=clave_archivo,
                motivo="Carga inicial",
                usuario_id=usuario_id,
            )
            self.db.add(version)
            self.db.commit()
            return self.repository.get_by_id(plantilla.id)

        except Exception:
            self.db.rollback()

            try:
                from app.services.template_storage import eliminar_archivo
                eliminar_archivo(clave_archivo)
            except Exception:
                pass

            raise

    async def subir_version(
        self,
        template_id: int,
        archivo: UploadFile,
        usuario_id: int | None,
        motivo: str,
    ) -> Template:
        plantilla = self.repository.get_by_id(template_id)

        if not plantilla:
            raise HTTPException(
                status_code=404,
                detail="La plantilla no existe.",
            )

        if not plantilla.activo:
            raise HTTPException(
                status_code=400,
                detail="No se pueden crear versiones de una plantilla inactiva.",
            )

        self._validar_usuario(usuario_id)

        if not motivo or not motivo.strip():
            raise HTTPException(
                status_code=400,
                detail="Debes indicar el motivo de la nueva versión.",
            )

        nombre_archivo, clave_archivo = await guardar_archivo(archivo)
        nueva_version = plantilla.version + 1

        try:
            self.db.add(
                TemplateVersion(
                    plantilla_id=plantilla.id,
                    numero_version=nueva_version,
                    nombre_archivo=nombre_archivo,
                    clave_archivo=clave_archivo,
                    motivo=motivo.strip(),
                    usuario_id=usuario_id,
                )
            )

            plantilla.version = nueva_version
            plantilla.archivo_url = clave_archivo
            plantilla.fecha_carga = datetime.utcnow()

            self.db.commit()

        except Exception:
            self.db.rollback()

            try:
                from app.services.template_storage import eliminar_archivo
                eliminar_archivo(clave_archivo)
            except Exception:
                pass

            raise

        return self.repository.get_by_id(template_id)

    def actualizar(
        self,
        template_id: int,
        data: TemplateUpdate,
    ) -> Template:
        plantilla = self.repository.get_by_id(template_id)

        if not plantilla:
            raise HTTPException(
                status_code=404,
                detail="La plantilla no existe.",
            )

        cliente_id = (
            data.cliente_id
            if data.cliente_id is not None
            else plantilla.cliente_id
        )
        tipo_id = (
            data.tipo_documento_id
            if data.tipo_documento_id is not None
            else plantilla.tipo_documento_id
        )
        alcances_ids = (
            data.alcances_ids
            if data.alcances_ids is not None
            else [alcance.id for alcance in plantilla.alcances]
        )

        alcances = self._validar_referencias(
            cliente_id,
            tipo_id,
            alcances_ids,
        )

        duplicada = self.repository.find_active_same_combination(
            cliente_id,
            tipo_id,
            set(alcances_ids),
        )

        if duplicada and duplicada.id != plantilla.id:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Ya existe una plantilla activa para ese cliente, "
                    "tipo de documento y combinación de alcances."
                ),
            )

        if data.nombre is not None:
            plantilla.nombre = data.nombre.strip()

        if data.descripcion is not None:
            plantilla.descripcion = data.descripcion.strip() or None

        if data.activo is not None:
            plantilla.activo = data.activo

        plantilla.cliente_id = cliente_id
        plantilla.tipo_documento_id = tipo_id
        plantilla.alcances = alcances

        self.repository.save()

        return self.repository.get_by_id(template_id)

    def cambiar_estado(
        self,
        template_id: int,
        activo: bool,
    ) -> Template:
        plantilla = self.repository.get_by_id(template_id)

        if not plantilla:
            raise HTTPException(
                status_code=404,
                detail="La plantilla no existe.",
            )

        plantilla.activo = activo
        self.repository.save()

        return self.repository.get_by_id(template_id)

    def restaurar_version(
        self,
        template_id: int,
        version_id: int,
        usuario_id: int | None,
        motivo: str,
    ) -> Template:
        plantilla = self.repository.get_by_id(template_id)
        version_origen = self.repository.get_version(version_id)

        if not plantilla or not version_origen:
            raise HTTPException(
                status_code=404,
                detail="No se encontró la plantilla o la versión.",
            )

        if version_origen.plantilla_id != template_id:
            raise HTTPException(
                status_code=400,
                detail="La versión seleccionada pertenece a otra plantilla.",
            )

        if not plantilla.activo:
            raise HTTPException(
                status_code=400,
                detail="No se puede restaurar una plantilla inactiva.",
            )

        self._validar_usuario(usuario_id)

        if not motivo or not motivo.strip():
            raise HTTPException(
                status_code=400,
                detail="Debes indicar el motivo de la restauración.",
            )

        # Comprueba que el archivo original siga disponible en B2.
        obtener_archivo(version_origen.clave_archivo)

        # Crea una copia nueva directamente dentro de B2.
        clave_nueva = duplicar_archivo(version_origen.clave_archivo)
        nueva_version = plantilla.version + 1

        try:
            self.db.add(
                TemplateVersion(
                    plantilla_id=template_id,
                    numero_version=nueva_version,
                    nombre_archivo=version_origen.nombre_archivo,
                    clave_archivo=clave_nueva,
                    motivo=motivo.strip(),
                    usuario_id=usuario_id,
                    version_restaurada_id=version_origen.id,
                )
            )

            plantilla.version = nueva_version
            plantilla.archivo_url = clave_nueva
            plantilla.fecha_carga = datetime.utcnow()

            self.db.commit()

        except Exception:
            self.db.rollback()

            try:
                from app.services.template_storage import eliminar_archivo
                eliminar_archivo(clave_nueva)
            except Exception:
                pass

            raise

        return self.repository.get_by_id(template_id)

    def eliminar_version(
        self,
        template_id: int,
        version_id: int,
    ) -> None:
        plantilla = self.repository.get_by_id(template_id)

        if not plantilla:
            raise HTTPException(
                status_code=404,
                detail="La plantilla no existe.",
            )

        version = self.repository.get_version(version_id)

        if not version or version.plantilla_id != template_id:
            raise HTTPException(
                status_code=404,
                detail="No se encontró la versión de esta plantilla.",
            )

        # Protege la versión que se encuentra actualmente vigente.
        if (
            version.numero_version == plantilla.version
            or version.clave_archivo == plantilla.archivo_url
        ):
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar la versión actual de la plantilla.",
            )

        clave_archivo = version.clave_archivo

        # Comprueba si otra versión utiliza la misma clave de almacenamiento.
        archivo_compartido = self.db.execute(
            select(TemplateVersion.id)
            .where(
                TemplateVersion.clave_archivo == clave_archivo,
                TemplateVersion.id != version.id,
            )
            .limit(1)
        ).first()

        # Identifica las versiones cuya restauración apunta a esta versión.
        versiones_dependientes = (
            self.repository.get_versiones_que_dependen(version.id)
        )

        try:
            # Evita dejar referencias a la versión que se eliminará.
            for version_dependiente in versiones_dependientes:
                version_dependiente.version_restaurada_id = None

            # Prepara la eliminación en la transacción sin confirmarla todavía.
            self.db.delete(version)
            self.db.flush()

            # No elimina el archivo si otras versiones lo comparten.
            if not archivo_compartido:
                eliminar_archivo(clave_archivo)

            # Confirma los cambios solo después de completar la limpieza
            # del archivo, cuando corresponde.
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise


