from sqlalchemy.orm import Session

from app.models.document import Document
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.template_repository import TemplateRepository
from app.repositories.user_repository import UserRepository
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentService:

    def __init__(self, db: Session):
        self.repository = DocumentRepository(db)
        self.assignment_repository = AssignmentRepository(db)
        self.template_repository = TemplateRepository(db)
        self.user_repository = UserRepository(db)

    def get_by_id(
        self,
        document_id: int
    ) -> Document | None:
        return self.repository.get_by_id(document_id)

    def get_all(self) -> list[Document]:
        return self.repository.get_all()

    def get_by_assignment(
        self,
        assignment_id: int
    ) -> list[Document]:
        return self.repository.get_by_assignment(
            assignment_id
        )

    def get_by_user(
        self,
        user_id: int
    ) -> list[Document]:
        return self.repository.get_by_user(user_id)

    def get_by_status(
        self,
        status: str
    ) -> list[Document]:
        return self.repository.get_by_status(status)

    def get_latest_by_assignment(
        self,
        assignment_id: int
    ) -> Document | None:
        return self.repository.get_latest_by_assignment(
            assignment_id
        )

    def create(
        self,
        data: DocumentCreate
    ) -> Document:

        assignment = self.assignment_repository.get_by_id(
            data.asignacion_id
        )

        if not assignment:
            raise ValueError(
                "La asignación indicada no existe."
            )

        template = self.template_repository.get_by_id(
            data.plantilla_id
        )

        if not template:
            raise ValueError(
                "La plantilla indicada no existe."
            )

        if not template.activo:
            raise ValueError(
                "La plantilla indicada está inactiva."
            )

        if (
            template.tipo_documento_id
            != assignment.tipo_documento_id
        ):
            raise ValueError(
                "La plantilla no corresponde al tipo de documento de la asignación."
            )

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

        existing_documents = (
            self.repository.get_by_assignment(
                data.asignacion_id
            )
        )

        if existing_documents:
            latest_version = max(
                document.version
                for document in existing_documents
            )

            version = latest_version + 1
        else:
            version = 1

        document = Document(
            asignacion_id=data.asignacion_id,
            plantilla_id=data.plantilla_id,
            nombre_archivo=data.nombre_archivo,
            archivo_url=data.archivo_url,
            version=version,
            estado=data.estado,
            usuario_id=data.usuario_id,
        )

        return self.repository.create(document)

    def update(
        self,
        document_id: int,
        data: DocumentUpdate
    ) -> Document:

        document = self.repository.get_by_id(
            document_id
        )

        if not document:
            raise ValueError(
                "El documento no existe."
            )

        if data.plantilla_id is not None:

            template = self.template_repository.get_by_id(
                data.plantilla_id
            )

            if not template:
                raise ValueError(
                    "La plantilla indicada no existe."
                )

            if not template.activo:
                raise ValueError(
                    "La plantilla indicada está inactiva."
                )

            assignment = (
                self.assignment_repository.get_by_id(
                    document.asignacion_id
                )
            )

            if not assignment:
                raise ValueError(
                    "La asignación del documento no existe."
                )

            if (
                template.tipo_documento_id
                != assignment.tipo_documento_id
            ):
                raise ValueError(
                    "La plantilla no corresponde al tipo de documento de la asignación."
                )

            document.plantilla_id = data.plantilla_id

        if data.nombre_archivo is not None:
            document.nombre_archivo = data.nombre_archivo

        if data.archivo_url is not None:
            document.archivo_url = data.archivo_url

        if data.version is not None:

            if data.version < 1:
                raise ValueError(
                    "La versión del documento debe ser mayor o igual a 1."
                )

            document.version = data.version

        if data.estado is not None:
            document.estado = data.estado

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

            document.usuario_id = data.usuario_id

        return self.repository.update(document)

    def delete(
        self,
        document_id: int
    ) -> None:

        document = self.repository.get_by_id(
            document_id
        )

        if not document:
            raise ValueError(
                "El documento no existe."
            )

        self.repository.delete(document)