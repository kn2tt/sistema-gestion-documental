from sqlalchemy.orm import Session

from app.models.subproject import Subproject
from app.repositories.site_repository import SiteRepository
from app.repositories.subproject_repository import SubprojectRepository
from app.schemas.subproject import SubprojectCreate, SubprojectUpdate


class SubprojectService:

    def __init__(self, db: Session):
        self.repository = SubprojectRepository(db)
        self.site_repository = SiteRepository(db)

    def get_by_id(self, subproject_id: int) -> Subproject | None:
        return self.repository.get_by_id(subproject_id)

    def get_by_site(self, site_id: int) -> list[Subproject]:
        return self.repository.get_by_site(site_id)

    def get_all(self) -> list[Subproject]:
        return self.repository.get_all()

    def get_active(self) -> list[Subproject]:
        return self.repository.get_active()

    def _validar_alcances(self, alcance_ids: list[int]):
        ids_unicos = set(alcance_ids)

        if not ids_unicos:
            raise ValueError(
                "Debe seleccionar al menos un alcance."
            )

        alcances = self.repository.get_scopes_by_ids(
            list(ids_unicos)
        )

        if len(alcances) != len(ids_unicos):
            raise ValueError(
                "Uno o más alcances seleccionados no existen."
            )

        if any(not alcance.activo for alcance in alcances):
            raise ValueError(
                "Todos los alcances seleccionados deben estar activos."
            )

        return alcances

    def create(self, data: SubprojectCreate) -> Subproject:
        site = self.site_repository.get_by_id(data.site_id)

        if not site:
            raise ValueError("El Site indicado no existe.")

        if not site.estado:
            raise ValueError(
                "No se puede crear un subproyecto para un Site inactivo."
            )

        nombre = data.nombre.strip()

        if not nombre:
            raise ValueError(
                "El nombre del subproyecto es obligatorio."
            )

        alcances = self._validar_alcances(data.alcances_ids)

        subproject = Subproject(
            site_id=site.id,
            nombre=nombre,
            descripcion=data.descripcion,
            estado=True,
            alcances=alcances,
        )

        return self.repository.create(subproject)

    def update(
        self,
        subproject_id: int,
        data: SubprojectUpdate,
    ) -> Subproject:
        subproject = self.repository.get_by_id(subproject_id)

        if not subproject:
            raise ValueError("El subproyecto no existe.")

        if data.nombre is not None:
            nombre = data.nombre.strip()

            if not nombre:
                raise ValueError(
                    "El nombre del subproyecto es obligatorio."
                )

            subproject.nombre = nombre

        if "descripcion" in data.model_fields_set:
            subproject.descripcion = data.descripcion

        if data.alcances_ids is not None:
            subproject.alcances = self._validar_alcances(
                data.alcances_ids
            )

        if data.estado is not None:
            if data.estado and not subproject.site.estado:
                raise ValueError(
                    "No se puede activar un subproyecto "
                    "perteneciente a un Site inactivo."
                )

            subproject.estado = data.estado

        return self.repository.update(subproject)

    def delete(self, subproject_id: int) -> None:
        subproject = self.repository.get_by_id(subproject_id)

        if not subproject:
            raise ValueError("El subproyecto no existe.")

        self.repository.delete(subproject)

