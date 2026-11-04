
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.assignment_specification import AssignmentSpecification
from app.models.specification_activity import SpecificationActivity
from app.models.project import Project
from app.models.site import Site
from app.models.subproject import Subproject
from app.models.document_type import DocumentType
from app.models.template import Template
from app.models.user import User
from app.models.photo_requirement import PhotoRequirement

from app.repositories.assignment_repository import AssignmentRepository
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate


ESTADOS_ASIGNACION = {
    "pendiente",
    "en_proceso",
    "pendiente_documentacion",
    "en_documentacion",
    "en_revision",
    "observado",
    "completado",
}


class AssignmentService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = AssignmentRepository(db)

    def _get_or_error(self, model, item_id: int, mensaje: str):
        item = self.db.get(model, item_id)

        if item is None:
            raise ValueError(mensaje)

        return item

    def _validate_data(self, data: dict, assignment=None):
        proyecto_id = data.get(
            "proyecto_id",
            assignment.proyecto_id if assignment else None,
        )
        site_id = data.get(
            "site_id",
            assignment.site_id if assignment else None,
        )
        subproyecto_id = data.get(
            "subproyecto_id",
            assignment.subproyecto_id if assignment else None,
        )
        tipo_documento_id = data.get(
            "tipo_documento_id",
            assignment.tipo_documento_id if assignment else None,
        )
        plantilla_id = data.get(
            "plantilla_id",
            assignment.plantilla_id if assignment else None,
        )

        proyecto = self._get_or_error(
            Project, proyecto_id, "El proyecto no existe."
        )
        site = self._get_or_error(
            Site, site_id, "El site no existe."
        )
        subproyecto = self._get_or_error(
            Subproject, subproyecto_id, "El subproyecto no existe."
        )
        self._get_or_error(
            DocumentType,
            tipo_documento_id,
            "El tipo de documento no existe.",
        )
        plantilla = self._get_or_error(
            Template, plantilla_id, "La plantilla no existe."
        )

        if site.proyecto_id != proyecto.id:
            raise ValueError(
                "El site no pertenece al proyecto seleccionado."
            )

        if subproyecto.site_id != site.id:
            raise ValueError(
                "El subproyecto no pertenece al site seleccionado."
            )

        if plantilla.cliente_id != proyecto.cliente_id:
            raise ValueError(
                "La plantilla no pertenece al cliente del proyecto."
            )

        if plantilla.tipo_documento_id != tipo_documento_id:
            raise ValueError(
                "La plantilla no corresponde al tipo de documento."
            )

        estado = data.get(
            "estado",
            assignment.estado if assignment else "pendiente",
        )

        if estado not in ESTADOS_ASIGNACION:
            raise ValueError("El estado de la asignación no es válido.")

    def _validate_users(
        self,
        tecnicos_ids: list[int],
        documentador_id: int | None,
    ):
        if not tecnicos_ids:
            raise ValueError(
                "Debe seleccionar al menos un técnico."
            )

        if len(tecnicos_ids) != len(set(tecnicos_ids)):
            raise ValueError(
                "No se puede asignar el mismo técnico más de una vez."
            )

        for tecnico_id in tecnicos_ids:
            self._get_or_error(
                User, tecnico_id, f"El técnico {tecnico_id} no existe."
            )

        if documentador_id is not None:
            self._get_or_error(
                User,
                documentador_id,
                "El documentador seleccionado no existe.",
            )

    def _build_specifications(self, specifications):
        resultado = []
        requisitos_procesados = set()

        for specification in specifications:
            requisito_id = specification.requisito_fotografico_id

            if requisito_id in requisitos_procesados:
                raise ValueError(
                    "No se puede seleccionar el mismo requisito "
                    "fotográfico más de una vez."
                )

            requisitos_procesados.add(requisito_id)

            requisito = self._get_or_error(
                PhotoRequirement,
                requisito_id,
                "El requisito fotográfico seleccionado no existe.",
            )

            if not requisito.activo:
                raise ValueError(
                    f"El requisito fotográfico '{requisito.nombre}' "
                    "está inactivo y no puede agregarse."
                )

            resultado.append(
                AssignmentSpecification(
                    requisito_fotografico_id=requisito.id,
                    titulo=requisito.nombre,
                    descripcion=requisito.descripcion,
                    obligatorio=requisito.obligatorio,
                    orden=specification.orden,
                    actividades=[
                        SpecificationActivity(
                            descripcion=activity.descripcion,
                            obligatorio=activity.obligatorio,
                            orden=activity.orden,
                        )
                        for activity in specification.actividades
                    ],
                )
            )

        return resultado

    def _update_specifications(self, assignment, specifications):
        especificaciones_nuevas = self._build_specifications(
            specifications
        )

        existentes = {
            specification.requisito_fotografico_id: specification
            for specification in assignment.especificaciones
        }

        resultado = []

        for nueva in especificaciones_nuevas:
            actual = existentes.get(nueva.requisito_fotografico_id)

            if actual is None:
                resultado.append(nueva)
                continue

            actual.titulo = nueva.titulo
            actual.descripcion = nueva.descripcion
            actual.obligatorio = nueva.obligatorio
            actual.orden = nueva.orden

            # Por ahora, las actividades se actualizan reemplazando
            # las anteriores, ya que todavía no registran evidencias.
            actual.actividades = nueva.actividades

            resultado.append(actual)

        assignment.especificaciones = resultado


    def _serialize(self, assignment: Assignment) -> dict:
        return {
            "id": assignment.id,

            "cliente_nombre": assignment.proyecto.cliente.nombre,

            "proyecto_id": assignment.proyecto_id,
            "proyecto_nombre": assignment.proyecto.nombre,

            "site_id": assignment.site_id,
            "site_nombre": assignment.site.nombre,

            "subproyecto_id": assignment.subproyecto_id,
            "subproyecto_nombre": assignment.subproyecto.nombre,
            
            "alcances": [
                {
                    "id": alcance.id,
                    "nombre": alcance.nombre,
                    "descripcion": alcance.descripcion,
                }
                for alcance in assignment.subproyecto.alcances
            ],

            "tipo_documento_id": assignment.tipo_documento_id,
            "tipo_documento_nombre": assignment.tipo_documento.nombre,

            "plantilla_id": assignment.plantilla_id,

            "tecnico_id": assignment.tecnico_id,
            "tecnicos_ids": [
                tecnico.id for tecnico in assignment.tecnicos
            ],
            "tecnicos": [
                {
                    "id": tecnico.id,
                    "nombre": tecnico.nombre,
                    "apellido": tecnico.apellido,
                }
                for tecnico in assignment.tecnicos
            ],

            "documentador_id": assignment.documentador_id,
            "documentador_nombre": (
                f"{assignment.documentador.nombre} "
                f"{assignment.documentador.apellido}"
                if assignment.documentador is not None
                else None
            ),

            "estado": assignment.estado,
            "fecha_asignacion": assignment.fecha_asignacion,
            "fecha_limite": assignment.fecha_limite,

            "especificaciones": [
                {
                    "id": specification.id,
                    "requisito_fotografico_id": (
                        specification.requisito_fotografico_id
                    ),
                    "titulo": specification.titulo,
                    "descripcion": specification.descripcion,
                    "obligatorio": specification.obligatorio,
                    "orden": specification.orden,
                    "actividades": [
                        {
                            "id": activity.id,
                            "descripcion": activity.descripcion,
                            "obligatorio": activity.obligatorio,
                            "orden": activity.orden,
                        }
                        for activity in specification.actividades
                    ],
                }
                for specification in assignment.especificaciones
            ],
        }

    def get_by_id(self, assignment_id: int):
        assignment = self.repository.get_by_id(assignment_id)

        if assignment is None:
            return None

        return self._serialize(assignment)

    def get_all(self):
        return [
            self._serialize(assignment)
            for assignment in self.repository.get_all()
        ]

    def get_by_tecnico(self, tecnico_id: int):
        return [
            self._serialize(assignment)
            for assignment in self.repository.get_by_tecnico(tecnico_id)
        ]

    def get_by_estado(self, estado: str):
        if estado not in ESTADOS_ASIGNACION:
            raise ValueError("El estado de la asignación no es válido.")

        return [
            self._serialize(assignment)
            for assignment in self.repository.get_by_estado(estado)
        ]

    def get_by_proyecto(self, proyecto_id: int):
        self._get_or_error(
            Project, proyecto_id, "El proyecto no existe."
        )

        return [
            self._serialize(assignment)
            for assignment in self.repository.get_by_proyecto(proyecto_id)
        ]

    def create(self, data: AssignmentCreate):
        values = data.model_dump()

        self._validate_data(values)
        self._validate_users(
            values["tecnicos_ids"],
            values["documentador_id"],
        )

        assignment = Assignment(
            proyecto_id=values["proyecto_id"],
            site_id=values["site_id"],
            subproyecto_id=values["subproyecto_id"],
            tipo_documento_id=values["tipo_documento_id"],
            plantilla_id=values["plantilla_id"],
            tecnico_id=values["tecnicos_ids"][0],
            documentador_id=values["documentador_id"],
            estado=values["estado"],
            fecha_asignacion=values["fecha_asignacion"],
            fecha_limite=values["fecha_limite"],
        )

        assignment.tecnicos = [
            self.db.get(User, tecnico_id)
            for tecnico_id in values["tecnicos_ids"]
        ]

        assignment.especificaciones = self._build_specifications(
            data.especificaciones
        )

        created = self.repository.create(assignment)
        return self._serialize(created)

    def update(self, assignment_id: int, data: AssignmentUpdate):
        assignment = self.repository.get_by_id(assignment_id)

        if assignment is None:
            raise ValueError("La asignación no existe.")

        values = data.model_dump(exclude_unset=True)

        if not values:
            return self._serialize(assignment)

        combined = {
            "proyecto_id": assignment.proyecto_id,
            "site_id": assignment.site_id,
            "subproyecto_id": assignment.subproyecto_id,
            "tipo_documento_id": assignment.tipo_documento_id,
            "plantilla_id": assignment.plantilla_id,
            "estado": assignment.estado,
        }
        combined.update({
            key: value
            for key, value in values.items()
            if value is not None
        })

        self._validate_data(combined, assignment)

        if "tecnicos_ids" in values:
            if values["tecnicos_ids"] is None:
                raise ValueError(
                    "La lista de técnicos no puede ser nula."
                )

            self._validate_users(
                values["tecnicos_ids"],
                values.get(
                    "documentador_id",
                    assignment.documentador_id,
                ),
            )

            assignment.tecnicos = [
                self.db.get(User, tecnico_id)
                for tecnico_id in values["tecnicos_ids"]
            ]
            assignment.tecnico_id = values["tecnicos_ids"][0]

        elif "documentador_id" in values:
            self._validate_users(
                [tecnico.id for tecnico in assignment.tecnicos],
                values["documentador_id"],
            )

        for field in (
            "proyecto_id",
            "site_id",
            "subproyecto_id",
            "tipo_documento_id",
            "plantilla_id",
            "estado",
            "fecha_asignacion",
            "fecha_limite",
        ):
            if field in values:
                setattr(assignment, field, values[field])

        if "documentador_id" in values:
            assignment.documentador_id = values["documentador_id"]

        if "especificaciones" in values:
            if values["especificaciones"] is None:
                raise ValueError(
                    "La lista de especificaciones no puede ser nula."
                )

            self._update_specifications(
                assignment,
                data.especificaciones,
            )

        updated = self.repository.update(assignment)
        return self._serialize(updated)

    def delete(self, assignment_id: int) -> None:
        assignment = self.repository.get_by_id(assignment_id)

        if assignment is None:
            raise ValueError("La asignación no existe.")

        self.repository.delete(assignment)
