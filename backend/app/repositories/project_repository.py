from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, project_id: int) -> Project | None:
        statement = select(Project).where(Project.id == project_id)

        return self.db.execute(statement).scalar_one_or_none()

    def get_by_client(self, client_id: int) -> list[Project]:
        statement = (
            select(Project)
            .where(Project.cliente_id == client_id)
            .order_by(Project.id)
        )

        return list(self.db.execute(statement).scalars().all())

    def get_all(self) -> list[Project]:
        statement = select(Project).order_by(Project.id)

        return list(self.db.execute(statement).scalars().all())

    def get_active(self) -> list[Project]:
        statement = (
            select(Project)
            .where(Project.estado == "activo")
            .order_by(Project.nombre)
        )

        return list(self.db.execute(statement).scalars().all())

    def create(self, project: Project) -> Project:
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        return project

    def update(self, project: Project) -> Project:
        self.db.commit()
        self.db.refresh(project)

        return project

    def delete(self, project: Project) -> None:
        self.db.delete(project)
        self.db.commit()