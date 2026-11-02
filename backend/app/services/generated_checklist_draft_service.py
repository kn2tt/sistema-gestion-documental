from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError

from app.models.assignment import Assignment
from app.models.generated_checklist import GeneratedChecklist
from app.models.generated_checklist_item import GeneratedChecklistItem
from app.models.generated_checklist_draft import (
    GeneratedChecklistDraft,
    GeneratedChecklistDraftItem,
)
from app.services.generated_checklist_service import (
    GeneratedChecklistService,
)


class GeneratedChecklistDraftService:

    def __init__(self, db: Session):
        self.db = db
        self.checklist_service = GeneratedChecklistService(db)

    def _get_checklist(self, checklist_id: int):
        query = (
            select(GeneratedChecklist)
            .options(
                selectinload(GeneratedChecklist.items)
                .selectinload(
                    GeneratedChecklistItem.requisito_fotografico
                )
            )
            .where(GeneratedChecklist.id == checklist_id)
        )

        return self.db.execute(query).scalar_one_or_none()

    def _get_draft(self, draft_id: int):
        query = (
            select(GeneratedChecklistDraft)
            .options(
                selectinload(GeneratedChecklistDraft.items)
                .selectinload(
                    GeneratedChecklistDraftItem.requisito_fotografico
                )
            )
            .where(GeneratedChecklistDraft.id == draft_id)
        )

        return self.db.execute(query).scalar_one_or_none()

    def _get_draft_by_checklist(self, checklist_id: int):
        query = (
            select(GeneratedChecklistDraft)
            .options(
                selectinload(GeneratedChecklistDraft.items)
                .selectinload(
                    GeneratedChecklistDraftItem.requisito_fotografico
                )
            )
            .where(
                GeneratedChecklistDraft.checklist_id == checklist_id
            )
        )

        return self.db.execute(query).scalar_one_or_none()

    def _serialize_draft(
        self,
        draft: GeneratedChecklistDraft,
    ) -> dict:
        return {
            "id": draft.id,
            "checklist_id": draft.checklist_id,
            "fecha_creacion": draft.fecha_creacion,
            "items": [
                {
                    "id": item.id,
                    "borrador_id": item.borrador_id,
                    "item_origen_id": item.item_origen_id,
                    "item_plantilla_id": item.item_plantilla_id,
                    "requisito_fotografico_id": (
                        item.requisito_fotografico_id
                    ),
                    "requisito_nombre": (
                        item.requisito_fotografico.nombre
                    ),
                    "requisito_descripcion": (
                        item.requisito_fotografico.descripcion
                    ),
                    "titulo": item.titulo,
                    "descripcion": item.descripcion,
                    "obligatorio": item.obligatorio,
                    "orden": item.orden,
                }
                for item in draft.items
            ],
        }

    def _validar_checklist_publicado(
        self,
        checklist: GeneratedChecklist,
    ):
        if checklist.estado != "publicado":
            raise ValueError(
                "Solo puedes iniciar una actualización "
                "de un checklist publicado."
            )

    def _validar_requisito(
        self,
        requisito_id: int,
        tipo_documento_id: int,
    ):
        return self.checklist_service._validar_requisito(
            requisito_id,
            tipo_documento_id,
        )

    def _obtener_contexto(
        self,
        draft: GeneratedChecklistDraft,
    ):
        checklist = self.db.get(
            GeneratedChecklist,
            draft.checklist_id,
        )

        if checklist is None:
            raise ValueError(
                "El checklist asociado al borrador no existe."
            )

        self._validar_checklist_publicado(checklist)

        assignment = self.db.get(
            Assignment,
            checklist.asignacion_id,
        )

        if assignment is None:
            raise ValueError(
                "La asignación asociada al checklist no existe."
            )

        return checklist, assignment

    def start_update(self, checklist_id: int):
        checklist = self._get_checklist(checklist_id)

        if checklist is None:
            raise ValueError("El checklist no existe.")

        self._validar_checklist_publicado(checklist)

        borrador_existente = self._get_draft_by_checklist(
            checklist_id
        )

        if borrador_existente is not None:
            raise ValueError(
                "Este checklist ya tiene una actualización en edición."
            )

        if not checklist.items:
            raise ValueError(
                "No se puede iniciar una actualización "
                "porque el checklist no tiene ítems."
            )

        try:
            draft = GeneratedChecklistDraft(
                checklist_id=checklist.id,
            )

            draft.items = [
                GeneratedChecklistDraftItem(
                    item_origen_id=item.id,
                    item_plantilla_id=item.item_plantilla_id,
                    requisito_fotografico_id=(
                        item.requisito_fotografico_id
                    ),
                    titulo=item.titulo,
                    descripcion=item.descripcion,
                    obligatorio=item.obligatorio,
                    orden=item.orden,
                )
                for item in checklist.items
            ]

            self.db.add(draft)
            self.db.commit()

            draft_id = draft.id
            self.db.expire_all()

            draft = self._get_draft(draft_id)

            return self._serialize_draft(draft)

        except IntegrityError:
            self.db.rollback()

            raise ValueError(
                "Ya existe una actualización en edición "
                "para este checklist."
            )

        except Exception:
            self.db.rollback()
            raise

    def get_by_checklist(self, checklist_id: int):
        checklist = self.db.get(
            GeneratedChecklist,
            checklist_id,
        )

        if checklist is None:
            raise ValueError("El checklist no existe.")

        draft = self._get_draft_by_checklist(checklist_id)

        if draft is None:
            return None

        return self._serialize_draft(draft)

    def add_item(
        self,
        draft_id: int,
        data: dict,
    ):
        draft = self._get_draft(draft_id)

        if draft is None:
            raise ValueError(
                "El borrador de actualización no existe."
            )

        checklist, assignment = self._obtener_contexto(draft)

        self._validar_requisito(
            data["requisito_fotografico_id"],
            assignment.tipo_documento_id,
        )

        item = GeneratedChecklistDraftItem(
            borrador_id=draft.id,
            item_origen_id=None,
            item_plantilla_id=None,
            requisito_fotografico_id=(
                data["requisito_fotografico_id"]
            ),
            titulo=data["titulo"],
            descripcion=data.get("descripcion"),
            obligatorio=data.get("obligatorio", True),
            orden=data.get(
                "orden",
                max(
                    (item.orden for item in draft.items),
                    default=0,
                ) + 1,
            ),
        )

        try:
            self.db.add(item)
            self.db.commit()

            self.db.expire_all()
            draft = self._get_draft(draft_id)

            return self._serialize_draft(draft)

        except Exception:
            self.db.rollback()
            raise

    def update_item(
        self,
        draft_item_id: int,
        cambios: dict,
    ):
        item = self.db.get(
            GeneratedChecklistDraftItem,
            draft_item_id,
        )

        if item is None:
            raise ValueError(
                "El ítem del borrador no existe."
            )

        draft = self._get_draft(item.borrador_id)

        if draft is None:
            raise ValueError(
                "El borrador de actualización no existe."
            )

        _, assignment = self._obtener_contexto(draft)

        campos_permitidos = {
            "requisito_fotografico_id",
            "titulo",
            "descripcion",
            "obligatorio",
            "orden",
        }

        cambios_validos = {
            campo: valor
            for campo, valor in cambios.items()
            if campo in campos_permitidos
        }

        for campo in ("obligatorio", "orden"):
            if campo in cambios_validos and cambios_validos[campo] is None:
                cambios_validos.pop(campo)

        if "titulo" in cambios_validos:
            if cambios_validos["titulo"] is None:
                raise ValueError(
                    "El título del ítem no puede estar vacío."
                )

        if "requisito_fotografico_id" in cambios_validos:
            if cambios_validos["requisito_fotografico_id"] is None:
                raise ValueError(
                    "Debes seleccionar un requisito fotográfico."
                )

            self._validar_requisito(
                cambios_validos["requisito_fotografico_id"],
                assignment.tipo_documento_id,
            )

        try:
            for campo, valor in cambios_validos.items():
                setattr(item, campo, valor)

            self.db.commit()

            self.db.expire_all()
            draft = self._get_draft(draft.id)

            return self._serialize_draft(draft)

        except Exception:
            self.db.rollback()
            raise

    def delete_item(self, draft_item_id: int):
        item = self.db.get(
            GeneratedChecklistDraftItem,
            draft_item_id,
        )

        if item is None:
            raise ValueError(
                "El ítem del borrador no existe."
            )

        draft_id = item.borrador_id
        draft = self._get_draft(draft_id)

        if draft is None:
            raise ValueError(
                "El borrador de actualización no existe."
            )

        self._obtener_contexto(draft)

        try:
            self.db.delete(item)
            self.db.commit()

            self.db.expire_all()
            draft = self._get_draft(draft_id)

            return self._serialize_draft(draft)

        except Exception:
            self.db.rollback()
            raise

    def discard(self, draft_id: int):
        draft = self._get_draft(draft_id)

        if draft is None:
            raise ValueError(
                "El borrador de actualización no existe."
            )

        self._obtener_contexto(draft)

        try:
            self.db.delete(draft)
            self.db.commit()

            return {
                "mensaje": "La actualización del checklist "
                "fue descartada correctamente."
            }

        except Exception:
            self.db.rollback()
            raise

    def publish(self, draft_id: int):
        draft = self._get_draft(draft_id)

        if draft is None:
            raise ValueError(
                "El borrador de actualización no existe."
            )

        checklist, assignment = self._obtener_contexto(draft)

        if not draft.items:
            raise ValueError(
                "No puedes publicar un checklist sin ítems."
            )

        try:
            items_publicados = {
                item.id: item
                for item in checklist.items
            }

            items_origen_retenidos = {
                item.item_origen_id
                for item in draft.items
                if item.item_origen_id is not None
            }

            for draft_item in draft.items:
                self._validar_requisito(
                    draft_item.requisito_fotografico_id,
                    assignment.tipo_documento_id,
                )

                if draft_item.item_origen_id is not None:
                    item_publicado = items_publicados.get(
                        draft_item.item_origen_id
                    )

                    if item_publicado is None:
                        raise ValueError(
                            "Uno de los ítems originales ya no existe "
                            "en el checklist publicado."
                        )

                    item_publicado.item_plantilla_id = (
                        draft_item.item_plantilla_id
                    )
                    item_publicado.requisito_fotografico_id = (
                        draft_item.requisito_fotografico_id
                    )
                    item_publicado.titulo = draft_item.titulo
                    item_publicado.descripcion = (
                        draft_item.descripcion
                    )
                    item_publicado.obligatorio = (
                        draft_item.obligatorio
                    )
                    item_publicado.orden = draft_item.orden

                else:
                    nuevo_item = GeneratedChecklistItem(
                        checklist_id=checklist.id,
                        item_plantilla_id=(
                            draft_item.item_plantilla_id
                        ),
                        requisito_fotografico_id=(
                            draft_item.requisito_fotografico_id
                        ),
                        titulo=draft_item.titulo,
                        descripcion=draft_item.descripcion,
                        obligatorio=draft_item.obligatorio,
                        orden=draft_item.orden,
                    )

                    self.db.add(nuevo_item)

            for item_id, item_publicado in items_publicados.items():
                if item_id not in items_origen_retenidos:
                    self.db.delete(item_publicado)

            self.db.delete(draft)
            self.db.commit()

            self.db.expire_all()

            checklist = self.checklist_service._get_checklist_by_id(
                checklist.id
            )

            return self.checklist_service._serialize(checklist)

        except IntegrityError:
            self.db.rollback()

            raise ValueError(
                "No se pudo publicar la actualización. "
                "Es posible que uno de los ítems que intentas eliminar "
                "tenga registros relacionados. No se realizaron cambios."
            )

        except Exception:
            self.db.rollback()
            raise
