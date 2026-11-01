from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError

from app.models.assignment import Assignment
from app.models.checklist_template import ChecklistTemplate
from app.models.generated_checklist import GeneratedChecklist
from app.models.generated_checklist_item import GeneratedChecklistItem


class GeneratedChecklistService:

    def __init__(self, db: Session):
        self.db = db

    def _get_checklist(self, assignment_id: int):
        query = (
            select(GeneratedChecklist)
            .options(
                selectinload(GeneratedChecklist.items)
            )
            .where(
                GeneratedChecklist.asignacion_id == assignment_id
            )
        )

        return self.db.execute(query).scalar_one_or_none()

    def _serialize(self, checklist: GeneratedChecklist) -> dict:
        return {
            "id": checklist.id,
            "asignacion_id": checklist.asignacion_id,
            "plantilla_checklist_id": checklist.plantilla_checklist_id,
            "fecha_generacion": checklist.fecha_generacion,
            "items": [
                {
                    "id": item.id,
                    "checklist_id": item.checklist_id,
                    "item_plantilla_id": item.item_plantilla_id,
                    "requisito_fotografico_id": (
                        item.requisito_fotografico_id
                    ),
                    "titulo": item.titulo,
                    "descripcion": item.descripcion,
                    "obligatorio": item.obligatorio,
                    "orden": item.orden,
                }
                for item in checklist.items
            ],
        }

    def get_by_assignment(self, assignment_id: int):
        assignment = self.db.get(Assignment, assignment_id)

        if assignment is None:
            raise ValueError("La asignación no existe.")

        checklist = self._get_checklist(assignment_id)

        if checklist is None:
            return None

        return self._serialize(checklist)

    def generate(self, assignment_id: int):
        assignment = self.db.get(Assignment, assignment_id)

        if assignment is None:
            raise ValueError("La asignación no existe.")

        # Evitar generar más de un checklist por asignación.
        checklist_existente = self._get_checklist(assignment_id)

        if checklist_existente is not None:
            return self._serialize(checklist_existente)

        # La plantilla se busca por tipo de documento.
        # No se utiliza assignment.plantilla_id.
        query_plantilla = (
            select(ChecklistTemplate)
            .options(
                selectinload(ChecklistTemplate.items)
            )
            .where(
                ChecklistTemplate.tipo_documento_id
                == assignment.tipo_documento_id,
                ChecklistTemplate.activo.is_(True),
            )
        )

        plantilla = self.db.execute(
            query_plantilla
        ).scalar_one_or_none()

        if plantilla is None:
            raise ValueError(
                "No existe una plantilla de checklist activa "
                "para el tipo de documento de esta asignación."
            )

        if not plantilla.items:
            raise ValueError(
                "La plantilla de checklist no contiene ítems configurados."
            )

        try:
            checklist = GeneratedChecklist(
                asignacion_id=assignment.id,
                plantilla_checklist_id=plantilla.id,
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
                    plantilla.items,
                    key=lambda item: item.orden
                )
            ]

            self.db.add(checklist)
            self.db.commit()

            checklist_id = checklist.id

            # Volver a consultar con los ítems cargados.
            self.db.expire_all()

            checklist = self.db.execute(
                select(GeneratedChecklist)
                .options(
                    selectinload(GeneratedChecklist.items)
                )
                .where(
                    GeneratedChecklist.id == checklist_id
                )
            ).scalar_one()

            return self._serialize(checklist)

        except IntegrityError:
            self.db.rollback()

            # Puede ocurrir si dos solicitudes intentan generar
            # el checklist de la misma asignación simultáneamente.
            checklist_existente = self._get_checklist(assignment_id)

            if checklist_existente is not None:
                return self._serialize(checklist_existente)

            raise

        except Exception:
            self.db.rollback()
            raise
