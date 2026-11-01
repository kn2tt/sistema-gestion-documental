from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_type import DocumentType


class DocumentTypeRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, document_type_id: int) -> DocumentType | None:
        statement = select(DocumentType).where(
            DocumentType.id == document_type_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[DocumentType]:
        statement = select(DocumentType).order_by(DocumentType.nombre)

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_active(self) -> list[DocumentType]:
        statement = (
            select(DocumentType)
            .where(DocumentType.activo.is_(True))
            .order_by(DocumentType.nombre)
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def create(self, document_type: DocumentType) -> DocumentType:
        self.db.add(document_type)
        self.db.commit()
        self.db.refresh(document_type)

        return document_type

    def update(self, document_type: DocumentType) -> DocumentType:
        self.db.commit()
        self.db.refresh(document_type)

        return document_type

    def delete(self, document_type: DocumentType) -> None:
        self.db.delete(document_type)
        self.db.commit()