
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document


class DocumentRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        document_id: int,
        include_deleted: bool = False,
    ) -> Document | None:
        statement = select(Document).where(
            Document.id == document_id
        )

        if not include_deleted:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        return self.db.execute(
            statement
        ).scalar_one_or_none()

    def get_all(
        self,
        include_deleted: bool = False,
    ) -> list[Document]:
        statement = select(Document)

        if not include_deleted:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        statement = statement.order_by(Document.id.desc())

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_assignment(
        self,
        assignment_id: int,
        include_deleted: bool = False,
    ) -> list[Document]:
        statement = select(Document).where(
            Document.asignacion_id == assignment_id
        )

        if not include_deleted:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        statement = statement.order_by(
            Document.fecha_carga.desc()
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_user(
        self,
        user_id: int,
        include_deleted: bool = False,
    ) -> list[Document]:
        statement = select(Document).where(
            Document.usuario_id == user_id
        )

        if not include_deleted:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        statement = statement.order_by(
            Document.fecha_carga.desc()
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_status(
        self,
        status: str,
        include_deleted: bool = False,
    ) -> list[Document]:
        statement = select(Document).where(
            Document.estado == status
        )

        if not include_deleted:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        statement = statement.order_by(
            Document.fecha_carga.desc()
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_latest_by_assignment(
        self,
        assignment_id: int,
        include_deleted: bool = False,
    ) -> Document | None:
        statement = select(Document).where(
            Document.asignacion_id == assignment_id
        )

        if not include_deleted:
            statement = statement.where(
                Document.eliminado.is_(False)
            )

        statement = statement.limit(1)

        return self.db.execute(
            statement
        ).scalar_one_or_none()

    def create(
        self,
        document: Document,
    ) -> Document:
        try:
            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            return document

        except Exception:
            self.db.rollback()
            raise

    def update(
        self,
        document: Document,
    ) -> Document:
        try:
            self.db.commit()
            self.db.refresh(document)
            return document

        except Exception:
            self.db.rollback()
            raise

    def delete(
        self,
        document: Document,
    ) -> None:
        try:
            self.db.delete(document)
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise
