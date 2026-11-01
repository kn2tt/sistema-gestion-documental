from datetime import datetime

from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.photo_requirement_repository import (
    PhotoRequirementRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.evidence import EvidenceCreate, EvidenceUpdate


class EvidenceService:

    def __init__(self, db: Session):
        self.repository = EvidenceRepository(db)
        self.assignment_repository = AssignmentRepository(db)
        self.requirement_repository = PhotoRequirementRepository(db)
        self.user_repository = UserRepository(db)

    def get_by_id(
        self,
        evidence_id: int
    ) -> Evidence | None:
        return self.repository.get_by_id(evidence_id)

    def get_by_assignment(
        self,
        assignment_id: int
    ) -> list[Evidence]:
        return self.repository.get_by_assignment(
            assignment_id
        )

    def get_by_requirement(
        self,
        requirement_id: int
    ) -> list[Evidence]:
        return self.repository.get_by_requirement(
            requirement_id
        )

    def get_by_assignment_and_requirement(
        self,
        assignment_id: int,
        requirement_id: int
    ) -> list[Evidence]:
        return self.repository.get_by_assignment_and_requirement(
            assignment_id,
            requirement_id
        )

    def get_by_status(
        self,
        status: str
    ) -> list[Evidence]:
        return self.repository.get_by_status(status)

    def create(
        self,
        data: EvidenceCreate
    ) -> Evidence:

        assignment = self.assignment_repository.get_by_id(
            data.asignacion_id
        )

        if not assignment:
            raise ValueError(
                "La asignación indicada no existe."
            )

        requirement = self.requirement_repository.get_by_id(
            data.requisito_id
        )

        if not requirement:
            raise ValueError(
                "El requisito fotográfico indicado no existe."
            )

        if not requirement.activo:
            raise ValueError(
                "El requisito fotográfico no está activo."
            )

        document_type_ids = {
            document_type.id
            for document_type in requirement.tipos_documento
        }

        if assignment.tipo_documento_id not in document_type_ids:
            raise ValueError(
                "El requisito fotográfico no está asociado "
                "al tipo de documento de la asignación."
            )

        if data.usuario_id is not None:

            user = self.user_repository.get_by_id(
                data.usuario_id
            )

            if not user:
                raise ValueError(
                    "El usuario indicado no existe."
                )

            if not user.activo:
                raise ValueError(
                    "El usuario indicado está inactivo."
                )

        evidence = Evidence(
            asignacion_id=data.asignacion_id,
            requisito_id=data.requisito_id,
            archivo_url=data.archivo_url,
            nombre_archivo=data.nombre_archivo,
            fecha_carga=(
                data.fecha_carga
                if data.fecha_carga is not None
                else (
                    datetime.utcnow()
                    if data.archivo_url
                    else None
                )
            ),
            usuario_id=data.usuario_id,
            estado=data.estado,
        )

        return self.repository.create(evidence)

    def update(
        self,
        evidence_id: int,
        data: EvidenceUpdate
    ) -> Evidence:

        evidence = self.repository.get_by_id(
            evidence_id
        )

        if not evidence:
            raise ValueError(
                "La evidencia no existe."
            )

        if data.archivo_url is not None:
            evidence.archivo_url = data.archivo_url
            evidence.fecha_carga = (
                data.fecha_carga
                if data.fecha_carga is not None
                else datetime.utcnow()
            )

        if data.nombre_archivo is not None:
            evidence.nombre_archivo = data.nombre_archivo

        if data.fecha_carga is not None:
            evidence.fecha_carga = data.fecha_carga

        if data.usuario_id is not None:

            user = self.user_repository.get_by_id(
                data.usuario_id
            )

            if not user:
                raise ValueError(
                    "El usuario indicado no existe."
                )

            if not user.activo:
                raise ValueError(
                    "El usuario indicado está inactivo."
                )

            evidence.usuario_id = data.usuario_id

        if data.estado is not None:
            evidence.estado = data.estado

        return self.repository.update(evidence)

    def delete(
        self,
        evidence_id: int
    ) -> None:

        evidence = self.repository.get_by_id(
            evidence_id
        )

        if not evidence:
            raise ValueError(
                "La evidencia no existe."
            )

        self.repository.delete(evidence)
