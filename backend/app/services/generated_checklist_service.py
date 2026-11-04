from sqlalchemy import select, or_
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError

from app.models.assignment import Assignment
from app.models.checklist_template import ChecklistTemplate
from app.models.checklist_template_item import ChecklistTemplateItem
from app.models.generated_checklist import GeneratedChecklist
from app.models.generated_checklist_item import GeneratedChecklistItem
from app.models.photo_requirement import PhotoRequirement
from app.models.user import User


class GeneratedChecklistService:

    def __init__(self, db: Session):
        self.db = db

    def _get_checklist(self, assignment_id: int):
        query = (
            select(GeneratedChecklist)
            .options(
                selectinload(GeneratedChecklist.items)
                .selectinload(
                    GeneratedChecklistItem.requisito_fotografico
                )
            )
            .where(
                GeneratedChecklist.asignacion_id == assignment_id
            )
        )

        return self.db.execute(query).scalar_one_or_none()

    def _get_checklist_by_id(self, checklist_id: int):
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

    def _serialize(self, checklist: GeneratedChecklist) -> dict:
        return {
            "id": checklist.id,
            "asignacion_id": checklist.asignacion_id,
            "plantilla_checklist_id": checklist.plantilla_checklist_id,
            "fecha_generacion": checklist.fecha_generacion,
            "estado": checklist.estado,
            "items": [
                {
                    "id": item.id,
                    "checklist_id": item.checklist_id,
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
                for item in checklist.items
            ],
        }

    def _validar_borrador(self, checklist: GeneratedChecklist):
        if checklist.estado != "borrador":
            raise ValueError(
                "El checklist ya fue publicado y no puede modificarse."
            )

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
            .where(PhotoRequirement.id == requisito_id)
        ).scalar_one_or_none()

        if requisito is None:
            raise ValueError(
                "El requisito fotográfico no existe."
            )

        if not requisito.activo:
            raise ValueError(
                "El requisito fotográfico seleccionado está inactivo."
            )

        if not any(
            tipo.id == tipo_documento_id
            for tipo in requisito.tipos_documento
        ):
            raise ValueError(
                "El requisito fotográfico no está asociado "
                "al tipo de documento de la asignación."
            )

        return requisito

    def get_by_assignment(self, assignment_id: int):
        assignment = self.db.get(Assignment, assignment_id)

        if assignment is None:
            raise ValueError("La asignación no existe.")

        checklist = self._get_checklist(assignment_id)

        if checklist is None:
            return None

        return self._serialize(checklist)


    def get_published_by_technician(
        self,
        assignment_id: int,
        tecnico_id: int,
    ):
        assignment = self.db.execute(
            select(Assignment).where(
                Assignment.id == assignment_id,
                or_(
                    Assignment.tecnico_id == tecnico_id,
                    Assignment.tecnicos.any(User.id == tecnico_id),
                ),
            )
        ).scalar_one_or_none()

        if assignment is None:
            raise PermissionError(
                "No tienes acceso a esta asignación."
            )

        checklist = self._get_checklist(assignment_id)

        if checklist is None:
            raise ValueError(
                "Esta asignación todavía no tiene un checklist generado."
            )

        if checklist.estado != "publicado":
            raise ValueError(
                "El checklist de esta asignación todavía no ha sido publicado."
            )

        return self._serialize(checklist)


    def generate(
        self,
        assignment_id: int,
        item_plantilla_ids: list[int],
    ):
        assignment = self.db.get(Assignment, assignment_id)

        if assignment is None:
            raise ValueError("La asignación no existe.")

        checklist_existente = self._get_checklist(assignment_id)

        if checklist_existente is not None:
            raise ValueError(
                "Esta asignación ya tiene un checklist generado."
            )

        if not item_plantilla_ids:
            raise ValueError(
                "Debes seleccionar al menos un ítem para generar el checklist."
            )

        if len(item_plantilla_ids) != len(set(item_plantilla_ids)):
            raise ValueError(
                "La selección contiene ítems duplicados."
            )

        plantilla = self.db.execute(
            select(ChecklistTemplate)
            .options(
                selectinload(ChecklistTemplate.items)
            )
            .where(
                ChecklistTemplate.tipo_documento_id
                == assignment.tipo_documento_id,
                ChecklistTemplate.activo.is_(True),
            )
        ).scalar_one_or_none()

        if plantilla is None:
            raise ValueError(
                "No existe una plantilla de checklist activa "
                "para el tipo de documento de esta asignación."
            )

        items_seleccionados = [
            item
            for item in plantilla.items
            if item.id in item_plantilla_ids
        ]

        if len(items_seleccionados) != len(item_plantilla_ids):
            raise ValueError(
                "Uno o más ítems seleccionados no pertenecen "
                "a la plantilla de esta asignación."
            )

        try:
            checklist = GeneratedChecklist(
                asignacion_id=assignment.id,
                plantilla_checklist_id=plantilla.id,
                estado="borrador",
            )

            checklist.items = [
                GeneratedChecklistItem(
                    item_plantilla_id=item.id,
                    requisito_fotografico_id=(
                        item.requisito_fotografico_id
                    ),
                    titulo=item.titulo,
                    descripcion=item.descripcion,
                    obligatorio=item.obligatorio,
                    orden=item.orden,
                )
                for item in sorted(
                    items_seleccionados,
                    key=lambda item: item.orden,
                )
            ]

            self.db.add(checklist)
            self.db.commit()

            checklist_id = checklist.id
            self.db.expire_all()

            checklist = self._get_checklist_by_id(checklist_id)

            return self._serialize(checklist)

        except IntegrityError:
            self.db.rollback()

            checklist_existente = self._get_checklist(assignment_id)

            if checklist_existente is not None:
                raise ValueError(
                    "Esta asignación ya tiene un checklist generado."
                )

            raise

        except Exception:
            self.db.rollback()
            raise

    def add_item(
        self,
        checklist_id: int,
        data: dict,
    ):
        checklist = self._get_checklist_by_id(checklist_id)

        if checklist is None:
            raise ValueError("El checklist no existe.")

        self._validar_borrador(checklist)

        assignment = self.db.get(
            Assignment,
            checklist.asignacion_id,
        )

        self._validar_requisito(
            data["requisito_fotografico_id"],
            assignment.tipo_documento_id,
        )

        item = GeneratedChecklistItem(
            checklist_id=checklist.id,
            item_plantilla_id=None,
            requisito_fotografico_id=data["requisito_fotografico_id"],
            titulo=data["titulo"],
            descripcion=data.get("descripcion"),
            obligatorio=data.get("obligatorio", True),
            orden=data.get(
                "orden",
                max(
                    (item.orden for item in checklist.items),
                    default=0,
                ) + 1,
            ),
        )

        self.db.add(item)
        self.db.commit()

        return self._serialize(
            self._get_checklist_by_id(checklist_id)
        )

    def update_item(
        self,
        item_id: int,
        cambios: dict,
    ):
        item = self.db.get(GeneratedChecklistItem, item_id)

        if item is None:
            raise ValueError("El ítem del checklist no existe.")

        checklist = self._get_checklist_by_id(item.checklist_id)

        self._validar_borrador(checklist)

        assignment = self.db.get(
            Assignment,
            checklist.asignacion_id,
        )

        requisito_id = cambios.get(
            "requisito_fotografico_id",
            item.requisito_fotografico_id,
        )

        self._validar_requisito(
            requisito_id,
            assignment.tipo_documento_id,
        )

        for campo, valor in cambios.items():
            setattr(item, campo, valor)

        self.db.commit()

        return self._serialize(
            self._get_checklist_by_id(checklist.id)
        )

    def delete_item(self, item_id: int):
        item = self.db.get(GeneratedChecklistItem, item_id)

        if item is None:
            raise ValueError("El ítem del checklist no existe.")

        checklist_id = item.checklist_id
        checklist = self._get_checklist_by_id(checklist_id)

        self._validar_borrador(checklist)

        self.db.delete(item)
        self.db.commit()

        return self._serialize(
            self._get_checklist_by_id(checklist_id)
        )

    def publish(self, checklist_id: int):
        checklist = self._get_checklist_by_id(checklist_id)

        if checklist is None:
            raise ValueError("El checklist no existe.")

        self._validar_borrador(checklist)

        if not checklist.items:
            raise ValueError(
                "No puedes publicar un checklist sin ítems."
            )

        checklist.estado = "publicado"

        self.db.commit()

        return self._serialize(
            self._get_checklist_by_id(checklist_id)
        )