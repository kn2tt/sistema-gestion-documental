from sqlalchemy.orm import Session

from app.models.site import Site
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.site import SiteCreate, SiteUpdate


class SiteService:

    def __init__(self, db: Session):
        self.repository = SiteRepository(db)
        self.project_repository = ProjectRepository(db)

    def get_by_id(self, site_id: int) -> Site | None:
        return self.repository.get_by_id(site_id)

    def get_by_project(self, project_id: int) -> list[Site]:
        return self.repository.get_by_project(project_id)

    def get_all(self) -> list[Site]:
        return self.repository.get_all()

    def get_active(self) -> list[Site]:
        return self.repository.get_active()

    def create(self, data: SiteCreate) -> Site:

        project = self.project_repository.get_by_id(
            data.proyecto_id
        )

        if not project:
            raise ValueError(
                "El proyecto indicado no existe."
            )

        if project.estado != "activo":
            raise ValueError(
                "No se puede crear un site para un proyecto inactivo."
            )

        site = Site(
            proyecto_id=data.proyecto_id,
            nombre=data.nombre,
            direccion=data.direccion,
            departamento=data.departamento,
            provincia=data.provincia,
            distrito=data.distrito,
            estado=data.estado,
        )

        return self.repository.create(site)

    def update(
        self,
        site_id: int,
        data: SiteUpdate
    ) -> Site:

        site = self.repository.get_by_id(site_id)

        if not site:
            raise ValueError(
                "El site no existe."
            )

        if data.proyecto_id is not None:

            project = self.project_repository.get_by_id(
                data.proyecto_id
            )

            if not project:
                raise ValueError(
                    "El proyecto indicado no existe."
                )

            if project.estado != "activo":
                raise ValueError(
                    "No se puede asociar el site a un proyecto inactivo."
                )

            site.proyecto_id = data.proyecto_id

        if data.nombre is not None:
            site.nombre = data.nombre

        if data.direccion is not None:
            site.direccion = data.direccion

        if data.departamento is not None:
            site.departamento = data.departamento

        if data.provincia is not None:
            site.provincia = data.provincia

        if data.distrito is not None:
            site.distrito = data.distrito

        if data.estado is not None:
            site.estado = data.estado

        return self.repository.update(site)

    def delete(self, site_id: int) -> None:

        site = self.repository.get_by_id(site_id)

        if not site:
            raise ValueError(
                "El site no existe."
            )

        self.repository.delete(site)