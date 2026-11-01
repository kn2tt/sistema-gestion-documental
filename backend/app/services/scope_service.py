from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.scope import Scope
from app.repositories.scope_repository import ScopeRepository
from app.schemas.scope import ScopeCreate, ScopeUpdate


class ScopeService:

    def __init__(self, db: Session):
        self.repository = ScopeRepository(db)

    def get_by_id(self, scope_id: int) -> Scope | None:
        return self.repository.get_by_id(scope_id)

    def get_all(self) -> list[Scope]:
        return self.repository.get_all()

    def get_active(self) -> list[Scope]:
        return self.repository.get_active()

    def _validar_nombre_unico(
        self,
        nombre: str,
        excluir_id: int | None = None
    ) -> None:
        nombre_normalizado = nombre.strip().casefold()

        for existente in self.repository.get_all():
            if existente.id == excluir_id:
                continue

            if existente.nombre.strip().casefold() == nombre_normalizado:
                raise ValueError(
                    "Ya existe un alcance con ese nombre."
                )

    def create(self, data: ScopeCreate) -> Scope:
        nombre = data.nombre.strip()

        self._validar_nombre_unico(nombre)

        descripcion = (
            data.descripcion.strip() or None
            if data.descripcion is not None
            else None
        )

        scope = Scope(
            nombre=nombre,
            descripcion=descripcion,
            activo=True
        )

        return self.repository.create(scope)

    def update(
        self,
        scope_id: int,
        data: ScopeUpdate
    ) -> Scope:
        scope = self.repository.get_by_id(scope_id)

        if scope is None:
            raise ValueError("El alcance no existe.")

        if data.nombre is not None:
            nombre = data.nombre.strip()
            self._validar_nombre_unico(nombre, excluir_id=scope_id)
            scope.nombre = nombre

        if "descripcion" in data.model_fields_set:
            scope.descripcion = (
                data.descripcion.strip() or None
                if data.descripcion is not None
                else None
            )

        if data.activo is not None:
            scope.activo = data.activo

        return self.repository.update(scope)

    def update_status(
        self,
        scope_id: int,
        activo: bool
    ) -> Scope:
        scope = self.repository.get_by_id(scope_id)

        if scope is None:
            raise ValueError("El alcance no existe.")

        scope.activo = activo

        return self.repository.update(scope)

    def delete(self, scope_id: int) -> None:
        scope = self.repository.get_by_id(scope_id)

        if scope is None:
            raise ValueError("El alcance no existe.")

        try:
            self.repository.delete(scope)
        except IntegrityError:
            raise ValueError(
                "No se puede eliminar el alcance porque está relacionado "
                "con otros registros."
            )
