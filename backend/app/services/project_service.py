from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.client_repository import ClientRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:

    def __init__(self, db: Session):
        self.repository = ProjectRepository(db)
        self.client_repository = ClientRepository(db)

    def get_by_id(self, project_id: int) -> Project | None:
        return self.repository.get_by_id(project_id)

    def get_by_client(self, client_id: int) -> list[Project]:
        return self.repository.get_by_client(client_id)

    def get_all(self) -> list[Project]:
        return self.repository.get_all()

    def get_active(self) -> list[Project]:
        return self.repository.get_active()

    def create(self, data: ProjectCreate) -> Project:

        client = self.client_repository.get_by_id(
            data.cliente_id
        )

        if not client:
            raise ValueError(
                "El cliente indicado no existe."
            )

        if not client.activo:
            raise ValueError(
                "No se puede crear un proyecto para un cliente inactivo."
            )

        project = Project(
            cliente_id=data.cliente_id,
            nombre=data.nombre,
            descripcion=data.descripcion,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            estado=data.estado,
        )

        return self.repository.create(project)

    def update(
        self,
        project_id: int,
        data: ProjectUpdate
    ) -> Project:

        project = self.repository.get_by_id(project_id)

        if not project:
            raise ValueError(
                "El proyecto no existe."
            )

        if data.cliente_id is not None:

            client = self.client_repository.get_by_id(
                data.cliente_id
            )

            if not client:
                raise ValueError(
                    "El cliente indicado no existe."
                )

            if not client.activo:
                raise ValueError(
                    "No se puede asociar el proyecto a un cliente inactivo."
                )

            project.cliente_id = data.cliente_id

        if data.nombre is not None:
            project.nombre = data.nombre

        if data.descripcion is not None:
            project.descripcion = data.descripcion

        if data.fecha_inicio is not None:
            project.fecha_inicio = data.fecha_inicio

        if data.fecha_fin is not None:
            project.fecha_fin = data.fecha_fin

        if data.estado is not None:
            project.estado = data.estado

        return self.repository.update(project)

    def delete(self, project_id: int) -> None:

        project = self.repository.get_by_id(project_id)

        if not project:
            raise ValueError(
                "El proyecto no existe."
            )

        self.repository.delete(project)