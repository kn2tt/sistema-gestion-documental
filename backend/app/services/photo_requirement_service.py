from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.photo_requirement import PhotoRequirement
from app.models.scope import Scope
from app.models.document_type import DocumentType
from app.repositories.photo_requirement_repository import (
    PhotoRequirementRepository,
)
from app.schemas.photo_requirement import (
    PhotoRequirementCreate,
    PhotoRequirementUpdate,
)


class PhotoRequirementService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = PhotoRequirementRepository(db)

    def get_by_id(
        self,
        requirement_id: int,
    ) -> PhotoRequirement | None:
        return self.repository.get_by_id(requirement_id)

    def get_all(self) -> list[PhotoRequirement]:
        return self.repository.get_all()

    def get_by_scope(
        self,
        scope_id: int,
    ) -> list[PhotoRequirement]:
        return self.repository.get_by_scope(scope_id)

    def get_active_by_scope(
        self,
        scope_id: int,
    ) -> list[PhotoRequirement]:
        return self.repository.get_active_by_scope(scope_id)

    def _validate_scope(self, scope_id: int) -> Scope:
        scope = self.db.get(Scope, scope_id)

        if not scope:
            raise ValueError("El alcance indicado no existe.")

        if not scope.activo:
            raise ValueError(
                "No se puede asociar un requisito a un alcance inactivo."
            )

        return scope

    def _get_document_types(
        self,
        document_type_ids: list[int],
    ) -> list[DocumentType]:
        if not document_type_ids:
            raise ValueError(
                "Debe asociar al menos un tipo de documento."
            )

        if len(document_type_ids) != len(set(document_type_ids)):
            raise ValueError(
                "La lista contiene tipos de documento duplicados."
            )

        statement = select(DocumentType).where(
            DocumentType.id.in_(document_type_ids)
        )
        document_types = list(
            self.db.execute(statement).scalars().all()
        )

        found_ids = {item.id for item in document_types}
        missing_ids = set(document_type_ids) - found_ids

        if missing_ids:
            raise ValueError(
                f"No existen estos tipos de documento: "
                f"{sorted(missing_ids)}."
            )

        inactive_types = [
            item.nombre
            for item in document_types
            if not item.activo
        ]

        if inactive_types:
            raise ValueError(
                "No se puede asociar el requisito a tipos de "
                "documento inactivos: "
                + ", ".join(inactive_types)
                + "."
            )

        return document_types

    def create(
        self,
        data: PhotoRequirementCreate,
    ) -> PhotoRequirement:
        try:
            self._validate_scope(data.alcance_id)

            document_types = self._get_document_types(
                data.tipos_documento_ids
            )

            statement = select(PhotoRequirement.orden).where(
                PhotoRequirement.alcance_id == data.alcance_id
            )

            ordenes = list(
                self.db.execute(statement).scalars().all()
            )

            siguiente_orden = max(ordenes, default=0) + 1

            requirement = PhotoRequirement(
                alcance_id=data.alcance_id,
                nombre=data.nombre.strip(),
                descripcion=data.descripcion,
                obligatorio=data.obligatorio,
                orden=siguiente_orden,
                activo=data.activo,
                tipos_documento=document_types,
            )

            return self.repository.create(requirement)

        except Exception:
            self.db.rollback()
            raise


    def update(
        self,
        requirement_id: int,
        data: PhotoRequirementUpdate,
    ) -> PhotoRequirement:
        requirement = self.repository.get_by_id(requirement_id)

        if not requirement:
            raise ValueError(
                "El requisito fotográfico no existe."
            )

        try:
            if data.alcance_id is not None:
                self._validate_scope(data.alcance_id)
                requirement.alcance_id = data.alcance_id

            if data.nombre is not None:
                nombre = data.nombre.strip()

                if not nombre:
                    raise ValueError(
                        "El nombre del requisito no puede estar vacío."
                    )

                requirement.nombre = nombre

            if data.descripcion is not None:
                requirement.descripcion = data.descripcion

            if data.obligatorio is not None:
                requirement.obligatorio = data.obligatorio

            if data.orden is not None:
                if data.orden < 1:
                    raise ValueError(
                        "El orden debe ser mayor o igual a 1."
                    )

                requirement.orden = data.orden

            if data.activo is not None:
                requirement.activo = data.activo

            if data.tipos_documento_ids is not None:
                document_types = self._get_document_types(
                    data.tipos_documento_ids
                )
                requirement.tipos_documento = document_types

            return self.repository.update(requirement)

        except Exception:
            self.db.rollback()
            raise

    def delete(
        self,
        requirement_id: int,
    ) -> None:
        requirement = self.repository.get_by_id(requirement_id)

        if not requirement:
            raise ValueError(
                "El requisito fotográfico no existe."
            )

        self.repository.delete(requirement)
