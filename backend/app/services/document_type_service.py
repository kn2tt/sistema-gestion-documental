from sqlalchemy.orm import Session

from app.models.document_type import DocumentType
from app.repositories.document_type_repository import DocumentTypeRepository
from app.schemas.document_type import (
    DocumentTypeCreate,
    DocumentTypeUpdate,
)


class DocumentTypeService:

    def __init__(self, db: Session):
        self.repository = DocumentTypeRepository(db)

    def get_by_id(
        self,
        document_type_id: int
    ) -> DocumentType | None:
        return self.repository.get_by_id(document_type_id)

    def get_all(self) -> list[DocumentType]:
        return self.repository.get_all()

    def get_active(self) -> list[DocumentType]:
        return self.repository.get_active()

    def create(
        self,
        data: DocumentTypeCreate
    ) -> DocumentType:

        existing_document_type = (
            self.repository.get_all()
        )

        for document_type in existing_document_type:
            if (
                document_type.nombre.strip().lower()
                == data.nombre.strip().lower()
            ):
                raise ValueError(
                    "Ya existe un tipo de documento con ese nombre."
                )

        document_type = DocumentType(
            nombre=data.nombre.strip(),
            descripcion=data.descripcion,
            activo=data.activo,
        )

        return self.repository.create(document_type)

    def update(
        self,
        document_type_id: int,
        data: DocumentTypeUpdate
    ) -> DocumentType:

        document_type = self.repository.get_by_id(
            document_type_id
        )

        if not document_type:
            raise ValueError(
                "El tipo de documento no existe."
            )

        if data.nombre is not None:

            existing_document_types = (
                self.repository.get_all()
            )

            normalized_name = data.nombre.strip().lower()

            for existing in existing_document_types:

                if (
                    existing.id != document_type_id
                    and existing.nombre.strip().lower()
                    == normalized_name
                ):
                    raise ValueError(
                        "Ya existe otro tipo de documento con ese nombre."
                    )

            document_type.nombre = data.nombre.strip()

        if data.descripcion is not None:
            document_type.descripcion = data.descripcion

        if data.activo is not None:
            document_type.activo = data.activo

        return self.repository.update(document_type)

    def delete(
        self,
        document_type_id: int
    ) -> None:

        document_type = self.repository.get_by_id(
            document_type_id
        )

        if not document_type:
            raise ValueError(
                "El tipo de documento no existe."
            )

        self.repository.delete(document_type)