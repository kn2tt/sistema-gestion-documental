from datetime import datetime
from pathlib import Path
from io import BytesIO

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from botocore.exceptions import BotoCoreError, ClientError

from app.models.assignment import Assignment
from app.models.document import Document
from app.models.document_operation import DocumentOperation
from app.models.document_checklist_progress import DocumentChecklistProgress
from app.models.generated_checklist import GeneratedChecklist
from app.models.generated_checklist_item import GeneratedChecklistItem
from app.models.template import Template
from app.models.evidence import Evidence
from app.models.user import User

from app.services.template_storage import obtener_archivo

from app.services.document_storage import (
    guardar_documento,
    obtener_documento,
    eliminar_documento,
)


class DocumentService:

    def __init__(self, db: Session):
        self.db = db

    # =====================================================
    # VALIDACIONES Y ACCESO
    # =====================================================

    @staticmethod
    def _es_administrador(user: User) -> bool:
        return user.rol.strip().lower() == "administrador"

    @staticmethod
    def _es_documentador(user: User) -> bool:
        return user.rol.strip().lower() == "documentador"

    def _obtener_asignacion(
        self,
        asignacion_id: int,
        user: User,
    ) -> Assignment:

        assignment = self.db.get(
            Assignment,
            asignacion_id,
        )

        if assignment is None:
            raise HTTPException(
                status_code=404,
                detail="La asignación no existe.",
            )

        if (
            not self._es_administrador(user)
            and assignment.documentador_id != user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="No tienes acceso a esta asignación.",
            )

        return assignment

    def _obtener_documento(
        self,
        documento_id: int,
        user: User,
        incluir_eliminados: bool = False,
    ) -> Document:

        statement = select(Document).where(
            Document.id == documento_id
        )

        if not incluir_eliminados:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        document = self.db.execute(
            statement
        ).scalar_one_or_none()

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="El documento no existe.",
            )

        self._obtener_asignacion(
            document.asignacion_id,
            user,
        )

        return document

    @staticmethod
    def _validar_clave(
        clave: str | None,
        asignacion_id: int,
    ) -> None:

        prefijo = f"documentos/asignacion-{asignacion_id}/"

        if not clave or not clave.startswith(prefijo):
            raise HTTPException(
                status_code=400,
                detail="La ubicación del documento no es válida.",
            )

    # =====================================================
    # RESPUESTAS
    # =====================================================

    @staticmethod
    def _serializar_documento(document: Document) -> dict:

        assignment = document.asignacion

        return {
            "id": document.id,
            "asignacion_id": document.asignacion_id,
            "plantilla_id": document.plantilla_id,
            "nombre_archivo": document.nombre_archivo,
            "version": document.version,
            "estado": document.estado,
            "estado_asignacion": assignment.estado,
            "proyecto_nombre": assignment.proyecto.nombre,
            "site_nombre": assignment.site.nombre,
            "tipo_documento_id": assignment.tipo_documento_id,
            "tipo_documento_nombre": (
                assignment.tipo_documento.nombre
            ),
            "documentador_id": assignment.documentador_id,
            "usuario_id": document.usuario_id,
            "fecha_carga": document.fecha_carga,
            "eliminado": document.eliminado,
            "fecha_eliminacion": document.fecha_eliminacion,
            "eliminado_por_id": document.eliminado_por_id,
            "archivo_disponible": bool(
                document.storage_key and not document.eliminado
            ),
        }

    @staticmethod
    def _registrar_operacion(
        document: Document,
        user_id: int | None,
        tipo: str,
        nombre_archivo: str | None = None,
        detalles: str | None = None,
    ) -> None:

        operacion = DocumentOperation(
            documento_id=document.id,
            usuario_id=user_id,
            tipo_operacion=tipo,
            nombre_archivo=nombre_archivo,
            detalles=detalles,
            fecha_operacion=datetime.utcnow(),
        )

        document.operaciones.append(operacion)

    # =====================================================
    # LISTAR DOCUMENTOS
    # =====================================================

    def listar_documentos(
        self,
        user: User,
    ) -> list[dict]:

        statement = (
            select(Document)
            .join(
                Assignment,
                Assignment.id == Document.asignacion_id,
            )
            .where(Document.eliminado.is_(False))
            .options(
                selectinload(Document.asignacion)
            )
            .order_by(Document.fecha_carga.desc())
        )

        if self._es_documentador(user):
            statement = statement.where(
                Assignment.documentador_id == user.id
            )

        elif not self._es_administrador(user):
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para consultar documentos.",
            )

        documentos = self.db.execute(
            statement
        ).scalars().all()

        return [
            self._serializar_documento(document)
            for document in documentos
        ]

    def obtener_por_asignacion(
        self,
        asignacion_id: int,
        user: User,
    ) -> dict | None:

        self._obtener_asignacion(
            asignacion_id,
            user,
        )

        statement = select(Document).where(
            Document.asignacion_id == asignacion_id,
            Document.eliminado.is_(False),
        )

        document = self.db.execute(
            statement
        ).scalar_one_or_none()

        if document is None:
            return None

        return self._serializar_documento(document)

    # =====================================================
    # CARGAR O REEMPLAZAR DOCUMENTO
    # =====================================================

    async def cargar_documento(
        self,
        asignacion_id: int,
        archivo,
        user: User,
    ) -> dict:

        if not self._es_documentador(user):
            raise HTTPException(
                status_code=403,
                detail="Solo el documentador puede cargar documentos.",
            )

        assignment = self._obtener_asignacion(
            asignacion_id,
            user,
        )

        if assignment.documentador_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Esta asignación no está asignada a tu usuario.",
            )

        template = self.db.get(
            Template,
            assignment.plantilla_id,
        )

        if template is None or not template.activo:
            raise HTTPException(
                status_code=400,
                detail="La plantilla asignada no existe o está inactiva.",
            )

        if template.tipo_documento_id != assignment.tipo_documento_id:
            raise HTTPException(
                status_code=400,
                detail="La plantilla no corresponde al tipo de documento.",
            )

        nombre_archivo, nueva_clave = await guardar_documento(
            asignacion_id,
            archivo,
        )

        document = self.db.execute(
            select(Document)
            .where(Document.asignacion_id == asignacion_id)
            .with_for_update()
        ).scalar_one_or_none()

        clave_anterior = None
        es_reemplazo = False

        try:
            if document is None:
                document = Document(
                    asignacion_id=asignacion_id,
                    plantilla_id=assignment.plantilla_id,
                    nombre_archivo=nombre_archivo,
                    archivo_url=None,
                    storage_key=nueva_clave,
                    version=1,
                    estado="en_proceso",
                    usuario_id=user.id,
                    fecha_carga=datetime.utcnow(),
                    eliminado=False,
                )

                self.db.add(document)
                self.db.flush()

                tipo_operacion = "subida"

            else:
                es_reemplazo = (
                    not document.eliminado
                    and bool(document.storage_key)
                )

                if document.storage_key:
                    clave_anterior = document.storage_key

                document.plantilla_id = assignment.plantilla_id
                document.nombre_archivo = nombre_archivo
                document.archivo_url = None
                document.storage_key = nueva_clave
                document.version = 1
                document.estado = "en_proceso"
                document.usuario_id = user.id
                document.fecha_carga = datetime.utcnow()
                document.eliminado = False
                document.fecha_eliminacion = None
                document.eliminado_por_id = None

                tipo_operacion = (
                    "reemplazo" if es_reemplazo else "subida"
                )

            self._registrar_operacion(
                document=document,
                user_id=user.id,
                tipo=tipo_operacion,
                nombre_archivo=nombre_archivo,
                detalles=(
                    "Se reemplazó el documento anterior."
                    if es_reemplazo
                    else "Se cargó el documento de la asignación."
                ),
            )

            self.db.commit()
            self.db.refresh(document)

        except Exception:
            self.db.rollback()

            try:
                eliminar_documento(nueva_clave)
            except Exception:
                pass

            raise

        # El archivo anterior se elimina únicamente después
        # de confirmar el registro del nuevo documento.
        if clave_anterior and clave_anterior != nueva_clave:
            try:
                self._validar_clave(
                    clave_anterior,
                    asignacion_id,
                )
                eliminar_documento(clave_anterior)

            except Exception as error:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        "El documento nuevo quedó guardado, pero no se "
                        "pudo retirar el archivo anterior de B2. "
                        "Se requiere revisar la limpieza del almacenamiento. "
                        f"Detalle: {str(error)}"
                    ),
                ) from error

        return self._serializar_documento(document)

    # =====================================================
    # DESCARGAR DOCUMENTO
    # =====================================================

    def descargar_documento(
        self,
        documento_id: int,
        user: User,
    ) -> tuple[bytes, str]:

        document = self._obtener_documento(
            documento_id,
            user,
        )

        self._validar_clave(
            document.storage_key,
            document.asignacion_id,
        )

        contenido = obtener_documento(
            document.storage_key
        )

        try:
            self._registrar_operacion(
                document=document,
                user_id=user.id,
                tipo="descarga",
                nombre_archivo=document.nombre_archivo,
                detalles="Se descargó el documento.",
            )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return contenido, document.nombre_archivo

    # =====================================================
    # ELIMINAR DOCUMENTO (ADMINISTRADOR)
    # =====================================================

    def eliminar_documento(
        self,
        documento_id: int,
        user: User,
    ) -> dict:

        if not self._es_administrador(user):
            raise HTTPException(
                status_code=403,
                detail="Solo el administrador puede eliminar documentos.",
            )

        document = self._obtener_documento(
            documento_id,
            user,
            incluir_eliminados=True,
        )

        if document.eliminado and not document.storage_key:
            raise HTTPException(
                status_code=404,
                detail="El documento ya fue eliminado.",
            )

        if not document.eliminado:
            descarga_previa = self.db.execute(
                select(DocumentOperation.id)
                .where(
                    DocumentOperation.documento_id == document.id,
                    DocumentOperation.usuario_id == user.id,
                    DocumentOperation.tipo_operacion == "descarga",
                )
                .limit(1)
            ).scalar_one_or_none()

            if descarga_previa is None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Antes de eliminar el documento, "
                        "debes descargarlo."
                    ),
                )

        clave_archivo = document.storage_key

        if clave_archivo:
            self._validar_clave(
                clave_archivo,
                document.asignacion_id,
            )

        if not document.eliminado:
            try:
                document.eliminado = True
                document.fecha_eliminacion = datetime.utcnow()
                document.eliminado_por_id = user.id

                self._registrar_operacion(
                    document=document,
                    user_id=user.id,
                    tipo="eliminacion",
                    nombre_archivo=document.nombre_archivo,
                    detalles=(
                        "El administrador solicitó la eliminación "
                        "definitiva del archivo."
                    ),
                )

                self.db.commit()

            except Exception:
                self.db.rollback()
                raise

            eliminar_documento(clave_archivo)

            try:
                document.storage_key = None
                self.db.commit()

            except Exception:
                self.db.rollback()
                raise

        return {
            "mensaje": "El documento fue eliminado correctamente.",
            "documento_id": document.id,
        }

    # =====================================================
    # BITÁCORA
    # =====================================================

    def obtener_operaciones(
        self,
        documento_id: int,
        user: User,
    ) -> list[dict]:

        document = self._obtener_documento(
            documento_id,
            user,
            incluir_eliminados=True,
        )

        statement = (
            select(DocumentOperation)
            .where(
                DocumentOperation.documento_id == document.id
            )
            .options(
                selectinload(DocumentOperation.usuario)
            )
            .order_by(
                DocumentOperation.fecha_operacion.desc(),
                DocumentOperation.id.desc(),
            )
        )

        operaciones = self.db.execute(
            statement
        ).scalars().all()

        return [
            {
                "id": operation.id,
                "documento_id": operation.documento_id,
                "usuario_id": operation.usuario_id,
                "usuario_nombre": (
                    f"{operation.usuario.nombre} "
                    f"{operation.usuario.apellido}"
                    if operation.usuario
                    else "Usuario no disponible"
                ),
                "tipo_operacion": operation.tipo_operacion,
                "nombre_archivo": operation.nombre_archivo,
                "detalles": operation.detalles,
                "fecha_operacion": operation.fecha_operacion,
            }
            for operation in operaciones
        ]

    # =====================================================
    # CHECKLIST DOCUMENTAL
    # =====================================================

    def obtener_checklist_documental(
        self,
        asignacion_id: int,
        user: User,
    ) -> dict:

        assignment = self._obtener_asignacion(
            asignacion_id,
            user,
        )

        checklist = self.db.execute(
            select(GeneratedChecklist)
            .options(
                selectinload(GeneratedChecklist.items)
                .selectinload(
                    GeneratedChecklistItem.requisito_fotografico
                )
            )
            .where(
                GeneratedChecklist.asignacion_id == assignment.id
            )
        ).scalar_one_or_none()

        if checklist is None or checklist.estado != "publicado":
            raise HTTPException(
                status_code=404,
                detail="La asignación no tiene un checklist publicado.",
            )

        items_ids = [
            item.id
            for item in checklist.items
        ]

        progresos = {}

        if items_ids:
            registros = self.db.execute(
                select(DocumentChecklistProgress).where(
                    DocumentChecklistProgress.item_checklist_id.in_(
                        items_ids
                    )
                )
            ).scalars().all()

            progresos = {
                progress.item_checklist_id: progress
                for progress in registros
            }

        items = []

        for item in checklist.items:
            progress = progresos.get(item.id)

            items.append({
                "id": item.id,
                "checklist_id": checklist.id,
                "requisito_fotografico_id": (
                    item.requisito_fotografico_id
                ),
                "encabezado": (
                    item.requisito_fotografico.nombre
                ),
                "titulo": item.titulo,
                "descripcion": item.descripcion,
                "obligatorio": item.obligatorio,
                "orden": item.orden,
                "completado": (
                    progress.completado
                    if progress
                    else False
                ),
                "usuario_id": (
                    progress.usuario_id
                    if progress
                    else None
                ),
                "fecha_actualizacion": (
                    progress.fecha_actualizacion
                    if progress
                    else None
                ),
            })

        return {
            "asignacion_id": assignment.id,
            "checklist_id": checklist.id,
            "estado": checklist.estado,
            "items": items,
        }

    def actualizar_progreso_checklist(
        self,
        item_id: int,
        completado: bool,
        user: User,
    ) -> dict:

        if not self._es_documentador(user):
            raise HTTPException(
                status_code=403,
                detail="Solo el documentador puede actualizar este checklist.",
            )

        item = self.db.execute(
            select(GeneratedChecklistItem)
            .options(
                selectinload(GeneratedChecklistItem.checklist)
            )
            .where(GeneratedChecklistItem.id == item_id)
        ).scalar_one_or_none()

        if item is None:
            raise HTTPException(
                status_code=404,
                detail="El ítem del checklist no existe.",
            )

        assignment = self._obtener_asignacion(
            item.checklist.asignacion_id,
            user,
        )

        if (
            item.checklist.estado != "publicado"
            or assignment.documentador_id != user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="No puedes modificar este checklist documental.",
            )

        progress = self.db.execute(
            select(DocumentChecklistProgress).where(
                DocumentChecklistProgress.item_checklist_id == item.id
            )
        ).scalar_one_or_none()

        if progress is None:
            progress = DocumentChecklistProgress(
                item_checklist_id=item.id,
                completado=completado,
                usuario_id=user.id,
                fecha_actualizacion=datetime.utcnow(),
            )
            self.db.add(progress)

        else:
            progress.completado = completado
            progress.usuario_id = user.id
            progress.fecha_actualizacion = datetime.utcnow()

        try:
            self.db.commit()
            self.db.refresh(progress)

        except Exception:
            self.db.rollback()
            raise

        return {
            "item_checklist_id": item.id,
            "completado": progress.completado,
            "usuario_id": progress.usuario_id,
            "fecha_actualizacion": progress.fecha_actualizacion,
        }

    # =====================================================
    # CONTEXTO DOCUMENTAL DE LA ASIGNACIÓN
    # =====================================================

    def obtener_contexto_asignacion(
        self,
        asignacion_id: int,
        user: User,
    ) -> dict:

        assignment = self._obtener_asignacion(
            asignacion_id,
            user,
        )

        enlace_drive = self.db.execute(
            select(Evidence.drive_web_view_link)
            .where(
                Evidence.asignacion_id == assignment.id,
                Evidence.drive_web_view_link.is_not(None),
                Evidence.drive_web_view_link != "",
                Evidence.fecha_archivado.is_not(None),
            )
            .order_by(
                Evidence.fecha_archivado.desc(),
                Evidence.id.desc(),
            )
            .limit(1)
        ).scalar_one_or_none()

        plantilla = self.db.get(
            Template,
            assignment.plantilla_id,
        )

        return {
            "asignacion_id": assignment.id,
            "documentador_id": assignment.documentador_id,
            "estado": assignment.estado,
            "drive_web_view_link": enlace_drive,
            "plantilla_id": assignment.plantilla_id,
            "plantilla_nombre": (
                plantilla.nombre if plantilla else None
            ),
        }

    # =====================================================
    # DESCARGAR PLANTILLA ASIGNADA
    # =====================================================

    def descargar_plantilla_asignada(
        self,
        asignacion_id: int,
        user: User,
    ) -> tuple[bytes, str]:

        assignment = self._obtener_asignacion(
            asignacion_id,
            user,
        )

        template = self.db.get(
            Template,
            assignment.plantilla_id,
        )

        if template is None or not template.archivo_url:
            raise HTTPException(
                status_code=404,
                detail="No se encontró la plantilla asignada.",
            )

        nombre_archivo = Path(
            template.archivo_url
        ).name

        version_actual = next(
            (
                version
                for version in template.versiones
                if version.numero_version == template.version
            ),
            None,
        )

        if version_actual:
            nombre_archivo = version_actual.nombre_archivo

        contenido = obtener_archivo(
            template.archivo_url
        )

        return contenido, nombre_archivo