from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document


class DocumentRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        document_id: int
    ) -> Document | None:
        statement = select(Document).where(
            Document.id == document_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[Document]:
        statement = select(Document).order_by(
            Document.id.desc()
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_assignment(
        self,
        assignment_id: int
    ) -> list[Document]:
        statement = (
            select(Document)
            .where(
                Document.asignacion_id == assignment_id
            )
            .order_by(
                Document.version.desc(),
                Document.fecha_carga.desc()
            )
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_user(
        self,
        user_id: int
    ) -> list[Document]:
        statement = (
            select(Document)
            .where(
                Document.usuario_id == user_id
            )
            .order_by(
                Document.fecha_carga.desc()
            )
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_status(
        self,
        status: str
    ) -> list[Document]:
        statement = (
            select(Document)
            .where(
                Document.estado == status
            )
            .order_by(
                Document.fecha_carga.desc()
            )
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_latest_by_assignment(
        self,
        assignment_id: int
    ) -> Document | None:
        statement = (
            select(Document)
            .where(
                Document.asignacion_id == assignment_id
            )
            .order_by(
                Document.version.desc(),
                Document.fecha_carga.desc()
            )
            .limit(1)
        )

        return self.db.execute(statement).scalar_one_or_none()

    def create(
        self,
        document: Document
    ) -> Document:
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)

        return document

    def update(
        self,
        document: Document
    ) -> Document:
        self.db.commit()
        self.db.refresh(document)

        return document

    def delete(
        self,
        document: Document
    ) -> None:
        self.db.delete(document)
        self.db.commit()