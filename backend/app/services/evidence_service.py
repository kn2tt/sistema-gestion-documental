
from datetime import datetime
from io import BytesIO, StringIO
from pathlib import Path
from uuid import uuid4
from urllib.parse import parse_qs, urlparse

import csv
import re
import zipfile

from sqlalchemy import select, or_
from sqlalchemy.orm import Session, selectinload

from app.models.evidence import Evidence
from app.models.assignment import Assignment
from app.models.generated_checklist import GeneratedChecklist
from app.models.generated_checklist_item import GeneratedChecklistItem
from app.models.photo_requirement import PhotoRequirement
from app.models.user import User

from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.photo_requirement_repository import (
    PhotoRequirementRepository,
)
from app.repositories.user_repository import UserRepository

from app.schemas.evidence import EvidenceCreate, EvidenceUpdate

from app.core.storage import (
    subir_evidencia,
    eliminar_evidencia,
    generar_url_evidencia,
    descargar_evidencia_contenido,
)


MAX_IMAGE_SIZE = 10 * 1024 * 1024

ALLOWED_IMAGES = {
    ".jpg": ("image/jpeg",),
    ".jpeg": ("image/jpeg",),
    ".png": ("image/png",),
    ".webp": ("image/webp",),
}


class EvidenceService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = EvidenceRepository(db)
        self.assignment_repository = AssignmentRepository(db)
        self.requirement_repository = PhotoRequirementRepository(db)
        self.user_repository = UserRepository(db)

    # =====================================================
    # VALIDACIONES PARA EL TÉCNICO
    # =====================================================

    def _validar_asignacion_tecnico(
        self,
        assignment_id: int,
        tecnico_id: int,
    ):
        assignment = self.db.execute(
            select(Assignment).where(
                Assignment.id == assignment_id,
                or_(
                    Assignment.tecnico_id == tecnico_id,
                    Assignment.tecnicos.any(
                        User.id == tecnico_id
                    ),
                ),
            )
        ).scalar_one_or_none()

        if assignment is None:
            raise PermissionError(
                "No tienes acceso a esta asignación."
            )

        return assignment

    def _validar_edicion_tecnico(self, assignment):
        if (
            assignment.estado == "completado"
            or not assignment.edicion_evidencias_habilitada
        ):
            raise PermissionError(
                "La edición de evidencias está deshabilitada "
                "para esta asignación. Solicita autorización "
                "al administrador."
            )

    def _validar_checklist_publicado(
        self,
        assignment_id: int,
    ):
        checklist = self.db.execute(
            select(GeneratedChecklist).where(
                GeneratedChecklist.asignacion_id == assignment_id
            )
        ).scalar_one_or_none()

        if checklist is None:
            raise ValueError(
                "La asignación todavía no tiene un checklist generado."
            )

        if checklist.estado != "publicado":
            raise ValueError(
                "El checklist todavía no ha sido publicado."
            )

        return checklist

    def _validar_item_checklist(
        self,
        item_id: int,
        checklist_id: int,
    ):
        item = self.db.execute(
            select(GeneratedChecklistItem).where(
                GeneratedChecklistItem.id == item_id,
                GeneratedChecklistItem.checklist_id == checklist_id,
            )
        ).scalar_one_or_none()

        if item is None:
            raise ValueError(
                "El ítem no pertenece al checklist de esta asignación."
            )

        return item

    def _validar_requisito(
        self,
        requisito_id: int,
        tipo_documento_id: int,
    ):
        requisito = self.db.execute(
            select(PhotoRequirement)
            .options(
                selectinload(PhotoRequirement.tipos_documento)
            )
            .where(
                PhotoRequirement.id == requisito_id
            )
        ).scalar_one_or_none()

        if requisito is None or not requisito.activo:
            raise ValueError(
                "El requisito fotográfico no existe o está inactivo."
            )

        if not any(
            tipo.id == tipo_documento_id
            for tipo in requisito.tipos_documento
        ):
            raise ValueError(
                "El requisito fotográfico no corresponde "
                "al tipo de documento de la asignación."
            )

        return requisito

    def _validar_imagen(
        self,
        nombre_archivo: str,
        tipo_contenido: str,
        contenido: bytes,
    ):
        extension = Path(nombre_archivo).suffix.lower()

        if extension not in ALLOWED_IMAGES:
            raise ValueError(
                "Formato no permitido. Solo se aceptan JPG, JPEG, PNG y WEBP."
            )

        tipos_permitidos = ALLOWED_IMAGES[extension]

        if tipo_contenido not in tipos_permitidos:
            raise ValueError(
                "El tipo de contenido no corresponde al formato de la imagen."
            )

        if not contenido:
            raise ValueError(
                "El archivo está vacío."
            )

        if len(contenido) > MAX_IMAGE_SIZE:
            raise ValueError(
                "La imagen supera el tamaño máximo permitido de 10 MB."
            )

        # Validación básica de la firma real del archivo.
        es_jpeg = (
            extension in (".jpg", ".jpeg")
            and contenido.startswith(b"\xff\xd8\xff")
        )

        es_png = (
            extension == ".png"
            and contenido.startswith(b"\x89PNG\r\n\x1a\n")
        )

        es_webp = (
            extension == ".webp"
            and contenido.startswith(b"RIFF")
            and contenido[8:12] == b"WEBP"
        )

        if not (es_jpeg or es_png or es_webp):
            raise ValueError(
                "El contenido del archivo no corresponde a una imagen válida."
            )

    # =====================================================
    # ENVIAR CHECKLIST DEL TÉCNICO
    # =====================================================

    def enviar_checklist_tecnico(
        self,
        assignment_id: int,
        tecnico_id: int,
    ):
        assignment = self._validar_asignacion_tecnico(
            assignment_id,
            tecnico_id,
        )

        self._validar_edicion_tecnico(assignment)

        self._validar_checklist_publicado(
            assignment_id
        )

        # La primera entrega pasa a documentación.
        # Si ya fue enviada anteriormente, se conserva
        # el estado actual de la asignación.
        if assignment.estado in ("pendiente", "en_proceso"):
            assignment.estado = "pendiente_documentacion"

        # Después del envío, el técnico ya no puede editar.
        assignment.edicion_evidencias_habilitada = False

        try:
            self.db.commit()
            self.db.refresh(assignment)

        except Exception:
            self.db.rollback()
            raise

        return {
            "mensaje": "El checklist fue enviado correctamente.",
            "asignacion_id": assignment.id,
            "estado": assignment.estado,
            "edicion_evidencias_habilitada": (
                assignment.edicion_evidencias_habilitada
            ),
        }

    # =====================================================
    # SUBIR FOTOGRAFÍA
    # =====================================================

    def subir_fotografia(
        self,
        assignment_id: int,
        item_id: int,
        tecnico_id: int,
        nombre_archivo: str,
        tipo_contenido: str,
        contenido: bytes,
    ):
        assignment = self._validar_asignacion_tecnico(
            assignment_id,
            tecnico_id,
        )

        self._validar_edicion_tecnico(assignment)

        checklist = self._validar_checklist_publicado(
            assignment_id
        )

        item = self._validar_item_checklist(
            item_id,
            checklist.id,
        )

        self._validar_requisito(
            item.requisito_fotografico_id,
            assignment.tipo_documento_id,
        )

        self._validar_imagen(
            nombre_archivo,
            tipo_contenido,
            contenido,
        )

        extension = Path(nombre_archivo).suffix.lower()
        nombre_original = Path(nombre_archivo).name[:255]

        clave_archivo = (
            f"asignaciones/{assignment_id}/"
            f"items/{item_id}/{uuid4().hex}{extension}"
        )

        # Primero se almacena el archivo en Backblaze.
        subir_evidencia(
            BytesIO(contenido),
            clave_archivo,
            tipo_contenido,
        )

        try:
            evidencia = Evidence(
                asignacion_id=assignment_id,
                requisito_id=item.requisito_fotografico_id,
                item_checklist_id=item.id,
                archivo_url=None,
                nombre_archivo=nombre_original,
                storage_key=clave_archivo,
                fecha_carga=datetime.utcnow(),
                usuario_id=tecnico_id,
                estado="completa",
                estado_almacenamiento="pendiente",
            )

            evidencia = self.repository.create(evidencia)

        except Exception as error:
            # Si falla el registro en PostgreSQL,
            # intentamos retirar el archivo recién subido.
            try:
                eliminar_evidencia(clave_archivo)
            except Exception as cleanup_error:
                raise RuntimeError(
                    "No se pudo registrar la evidencia en la base de datos "
                    "y tampoco se pudo retirar el archivo de Backblaze. "
                    f"Clave del archivo: {clave_archivo}"
                ) from cleanup_error

            raise RuntimeError(
                "No se pudo registrar la evidencia en la base de datos."
            ) from error

        return {
            "id": evidencia.id,
            "asignacion_id": evidencia.asignacion_id,
            "item_checklist_id": evidencia.item_checklist_id,
            "requisito_id": evidencia.requisito_id,
            "nombre_archivo": evidencia.nombre_archivo,
            "fecha_carga": evidencia.fecha_carga,
            "estado": evidencia.estado,
            "estado_almacenamiento": evidencia.estado_almacenamiento,
        }

    # =====================================================
    # CONSULTAR FOTOGRAFÍAS DE UN ÍTEM
    # =====================================================

    def listar_por_item_tecnico(
        self,
        assignment_id: int,
        item_id: int,
        tecnico_id: int,
    ):
        self._validar_asignacion_tecnico(
            assignment_id,
            tecnico_id,
        )

        checklist = self._validar_checklist_publicado(
            assignment_id
        )

        self._validar_item_checklist(
            item_id,
            checklist.id,
        )

        evidencias = self.repository.get_by_item_and_assignment(
            item_id,
            assignment_id,
        )

        resultado = []

        for evidencia in evidencias:
            url = None

            # Los archivos archivados ya no deben consultarse en B2.
            if (
                evidencia.storage_key
                and evidencia.estado_almacenamiento in ("pendiente", "exportada")
            ):
                url = generar_url_evidencia(
                    evidencia.storage_key,
                    expiracion=3600,
                )

            resultado.append({
                "id": evidencia.id,
                "asignacion_id": evidencia.asignacion_id,
                "item_checklist_id": evidencia.item_checklist_id,
                "requisito_id": evidencia.requisito_id,
                "nombre_archivo": evidencia.nombre_archivo,
                "fecha_carga": evidencia.fecha_carga,
                "estado": evidencia.estado,
                "estado_almacenamiento": evidencia.estado_almacenamiento,
                "archivo_url": url,
            })

        return resultado

    # =====================================================
    # ELIMINAR UNA FOTOGRAFÍA
    # =====================================================

    def eliminar_fotografia_tecnico(
        self,
        assignment_id: int,
        item_id: int,
        evidence_id: int,
        tecnico_id: int,
    ):
        assignment = self._validar_asignacion_tecnico(
            assignment_id,
            tecnico_id,
        )

        self._validar_edicion_tecnico(assignment)

        checklist = self._validar_checklist_publicado(
            assignment_id
        )

        self._validar_item_checklist(
            item_id,
            checklist.id,
        )

        evidencia = self.repository.get_by_id(
            evidence_id
        )

        if (
            evidencia is None
            or evidencia.asignacion_id != assignment_id
            or evidencia.item_checklist_id != item_id
        ):
            raise ValueError(
                "La evidencia no existe para el ítem indicado."
            )

        if (
            evidencia.estado_almacenamiento != "pendiente"
            or evidencia.drive_file_id
            or evidencia.fecha_archivado is not None
        ):
            raise ValueError(
                "No se puede eliminar una evidencia que ya fue archivada."
            )

        if not evidencia.storage_key:
            raise ValueError(
                "La evidencia no tiene una clave de almacenamiento válida."
            )

        # Primero se elimina el objeto de B2.
        # Si falla, el registro de PostgreSQL se conserva.
        eliminar_evidencia(
            evidencia.storage_key
        )

        self.repository.delete(evidencia)

        return {
            "mensaje": "La fotografía fue eliminada correctamente.",
            "id": evidence_id,
        }

    # =====================================================
    # EXPORTAR EVIDENCIAS A ZIP
    # =====================================================

    @staticmethod
    def _nombre_seguro_carpeta(nombre: str) -> str:
        nombre = str(nombre or "Sin nombre").strip()

        nombre = re.sub(
            r'[<>:"/\\|?*\x00-\x1F]',
            "-",
            nombre,
        )

        nombre = nombre.rstrip(". ")

        return nombre[:100] or "Sin nombre"

    def exportar_evidencias_asignacion(
        self,
        assignment_id: int,
    ) -> bytes:

        assignment = self.assignment_repository.get_by_id(
            assignment_id
        )

        if assignment is None:
            raise ValueError("La asignación no existe.")

        statement = (
            select(Evidence)
            .where(
                Evidence.asignacion_id == assignment_id,
                Evidence.estado_almacenamiento.in_(
                    ["pendiente", "exportada"]
                ),
            )
            .options(
                selectinload(Evidence.item_checklist),
                selectinload(Evidence.requisito),
                selectinload(Evidence.usuario),
            )
            .order_by(Evidence.id)
            .with_for_update()
        )

        registros = list(
            self.db.execute(statement).scalars().all()
        )

        # Si existe una exportación sin confirmar,
        # se vuelve a generar ese mismo conjunto.
        exportadas = [
            evidencia
            for evidencia in registros
            if evidencia.estado_almacenamiento == "exportada"
        ]

        if exportadas:
            evidencias_exportar = exportadas

        else:
            evidencias_exportar = [
                evidencia
                for evidencia in registros
                if (
                    evidencia.estado_almacenamiento == "pendiente"
                    and evidencia.storage_key
                )
            ]

        if not evidencias_exportar:
            raise ValueError(
                "No existen fotografías nuevas disponibles para exportar."
            )

        if any(
            not evidencia.storage_key
            for evidencia in evidencias_exportar
        ):
            raise RuntimeError(
                "Una de las evidencias exportadas no tiene una "
                "ubicación válida en Backblaze."
            )

        # Ordenar por encabezado, ítem y registro.
        evidencias_exportar.sort(
            key=lambda evidencia: (
                evidencia.requisito.orden or 0,
                evidencia.item_checklist.orden or 0,
                evidencia.id,
            )
        )

        archivo_memoria = BytesIO()
        manifiesto = StringIO(newline="")

        escritor = csv.writer(
            manifiesto,
            delimiter=";",
        )

        escritor.writerow([
            "ID evidencia",
            "Encabezado",
            "Ítem",
            "Nombre original",
            "Fecha de carga",
            "Técnico",
        ])

        with zipfile.ZipFile(
            archivo_memoria,
            mode="w",
            compression=zipfile.ZIP_DEFLATED,
        ) as archivo_zip:

            for evidencia in evidencias_exportar:

                requisito = evidencia.requisito
                item = evidencia.item_checklist

                encabezado = self._nombre_seguro_carpeta(
                    requisito.nombre
                )

                nombre_item = self._nombre_seguro_carpeta(
                    item.titulo
                )

                carpeta_encabezado = (
                    f"{int(requisito.orden or 0):02d} - {encabezado}"
                )

                carpeta_item = (
                    f"{int(item.orden or 0):02d} - {nombre_item}"
                )

                nombre_original = self._nombre_seguro_carpeta(
                    Path(evidencia.nombre_archivo or "fotografia").name
                )

                ruta_zip = (
                    f"{carpeta_encabezado}/"
                    f"{carpeta_item}/"
                    f"EVID-{evidencia.id}_{nombre_original}"
                )

                contenido = descargar_evidencia_contenido(
                    evidencia.storage_key
                )

                archivo_zip.writestr(
                    ruta_zip,
                    contenido,
                )

                tecnico = ""

                if evidencia.usuario:
                    tecnico = (
                        f"{evidencia.usuario.nombre} "
                        f"{evidencia.usuario.apellido}"
                    ).strip()

                escritor.writerow([
                    evidencia.id,
                    requisito.nombre,
                    item.titulo,
                    evidencia.nombre_archivo or "",
                    (
                        evidencia.fecha_carga.isoformat()
                        if evidencia.fecha_carga
                        else ""
                    ),
                    tecnico,
                ])

            archivo_zip.writestr(
                "manifiesto.csv",
                manifiesto.getvalue().encode("utf-8-sig"),
            )

        # Solo después de generar correctamente el ZIP
        # se marcan los registros como exportados.
        for evidencia in evidencias_exportar:
            if evidencia.estado_almacenamiento == "pendiente":
                evidencia.estado_almacenamiento = "exportada"

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        archivo_memoria.seek(0)

        return archivo_memoria.getvalue()

    # =====================================================
    # CONFIRMAR ARCHIVADO EN GOOGLE DRIVE
    # =====================================================

    def archivar_evidencias_asignacion(
        self,
        assignment_id: int,
        drive_web_view_link: str,
        usuario_id: int,
    ):

        assignment = self.assignment_repository.get_by_id(
            assignment_id
        )

        if assignment is None:
            raise ValueError("La asignación no existe.")

        enlace = str(drive_web_view_link or "").strip()
        parsed = urlparse(enlace)

        if (
            parsed.scheme != "https"
            or parsed.netloc not in (
                "drive.google.com",
                "docs.google.com",
            )
        ):
            raise ValueError(
                "Ingresa un enlace válido de Google Drive."
            )

        drive_file_id = (
            parse_qs(parsed.query).get("id", [None])[0]
        )

        if not drive_file_id:
            coincidencia = re.search(
                r"/d/([^/]+)",
                parsed.path,
            )

            if coincidencia:
                drive_file_id = coincidencia.group(1)

        statement = (
            select(Evidence.id)
            .where(
                Evidence.asignacion_id == assignment_id,
                Evidence.estado_almacenamiento == "exportada",
            )
            .order_by(Evidence.id)
        )

        ids_exportados = list(
            self.db.execute(statement).scalars().all()
        )

        if not ids_exportados:
            raise ValueError(
                "No hay una exportación pendiente de archivado."
            )

        archivadas = 0
        fallidas = []

        for evidence_id in ids_exportados:

            evidencia = self.db.execute(
                select(Evidence)
                .where(Evidence.id == evidence_id)
                .with_for_update()
            ).scalar_one_or_none()

            if evidencia is None:
                fallidas.append({
                    "evidencia_id": evidence_id,
                    "detalle": "No se encontró el registro.",
                })
                continue

            try:
                if not evidencia.storage_key:
                    raise RuntimeError(
                        "No se encontró la ubicación física en Backblaze."
                    )

                # Primero se elimina el archivo físico.
                eliminar_evidencia(
                    evidencia.storage_key
                )

                # Después se conserva el registro y sus metadatos.
                evidencia.storage_key = None
                evidencia.estado_almacenamiento = "archivada"
                evidencia.drive_file_id = drive_file_id
                evidencia.drive_web_view_link = enlace
                evidencia.fecha_archivado = datetime.utcnow()
                evidencia.usuario_archivado_id = usuario_id

                self.db.commit()

                archivadas += 1

            except Exception as error:
                self.db.rollback()

                fallidas.append({
                    "evidencia_id": evidence_id,
                    "detalle": str(error),
                })

        return {
            "mensaje": (
                "El proceso de archivado finalizó."
                if not fallidas
                else "El archivado finalizó parcialmente."
            ),
            "archivadas": archivadas,
            "fallidas": len(fallidas),
            "errores": fallidas,
        }

    # =====================================================
    # MÉTODOS CRUD EXISTENTES
    # Se conservan para compatibilidad con el módulo actual.
    # =====================================================

    def get_by_id(self, evidence_id: int):
        return self.repository.get_by_id(evidence_id)

    def get_url_by_id(self, evidence_id: int):
        evidencia = self.repository.get_by_id(evidence_id)

        if evidencia is None:
            raise ValueError("La evidencia no existe.")

        # Evidencias almacenadas en Backblaze.
        if (
            evidencia.storage_key
            and evidencia.estado_almacenamiento in ("pendiente", "exportada")
        ):
            return generar_url_evidencia(
                evidencia.storage_key,
                expiracion=3600,
            )

        # Evidencias que ya tienen una URL disponible.
        if evidencia.archivo_url:
            return evidencia.archivo_url

        raise ValueError(
            "No se encontró una ubicación disponible para la fotografía."
        )

    def get_by_assignment(self, assignment_id: int):
        return self.repository.get_by_assignment(assignment_id)

    def get_by_requirement(self, requirement_id: int):
        return self.repository.get_by_requirement(requirement_id)

    def get_by_assignment_and_requirement(
        self,
        assignment_id: int,
        requirement_id: int,
    ):
        return self.repository.get_by_assignment_and_requirement(
            assignment_id,
            requirement_id,
        )

    def get_by_status(self, status: str):
        return self.repository.get_by_status(status)

    def create(self, data: EvidenceCreate):
        assignment = self.assignment_repository.get_by_id(
            data.asignacion_id
        )

        if assignment is None:
            raise ValueError("La asignación indicada no existe.")

        item = self.db.get(
            GeneratedChecklistItem,
            data.item_checklist_id,
        )

        if item is None:
            raise ValueError("El ítem del checklist no existe.")

        if item.requisito_fotografico_id != data.requisito_id:
            raise ValueError(
                "El requisito no corresponde al ítem del checklist."
            )

        if item.checklist.asignacion_id != data.asignacion_id:
            raise ValueError(
                "El ítem no pertenece a la asignación indicada."
            )

        evidence = Evidence(
            asignacion_id=data.asignacion_id,
            requisito_id=data.requisito_id,
            item_checklist_id=data.item_checklist_id,
            archivo_url=data.archivo_url,
            nombre_archivo=data.nombre_archivo,
            fecha_carga=data.fecha_carga or datetime.utcnow(),
            usuario_id=data.usuario_id,
            estado=data.estado,
            estado_almacenamiento=data.estado_almacenamiento,
        )

        return self.repository.create(evidence)

    def update(
        self,
        evidence_id: int,
        data: EvidenceUpdate,
    ):
        evidence = self.repository.get_by_id(evidence_id)

        if evidence is None:
            raise ValueError("La evidencia no existe.")

        if data.archivo_url is not None:
            evidence.archivo_url = data.archivo_url

        if data.nombre_archivo is not None:
            evidence.nombre_archivo = data.nombre_archivo

        if data.fecha_carga is not None:
            evidence.fecha_carga = data.fecha_carga

        if data.usuario_id is not None:
            user = self.user_repository.get_by_id(data.usuario_id)

            if user is None or not user.activo:
                raise ValueError(
                    "El usuario indicado no existe o está inactivo."
                )

            evidence.usuario_id = data.usuario_id

        if data.estado is not None:
            evidence.estado = data.estado

        return self.repository.update(evidence)

    def delete(self, evidence_id: int):
        evidence = self.repository.get_by_id(evidence_id)

        if evidence is None:
            raise ValueError("La evidencia no existe.")

        if (
            evidence.estado_almacenamiento != "pendiente"
            or evidence.drive_file_id
            or evidence.fecha_archivado is not None
        ):
            raise ValueError(
                "No se puede eliminar una evidencia que ya fue exportada o archivada."
            )

        if evidence.storage_key:
            eliminar_evidencia(evidence.storage_key)

        self.repository.delete(evidence)
