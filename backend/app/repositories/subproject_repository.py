from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.scope import Scope
from app.models.subproject import Subproject


class SubprojectRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, subproject_id: int) -> Subproject | None:
        statement = (
            select(Subproject)
            .options(selectinload(Subproject.alcances))
            .where(Subproject.id == subproject_id)
        )
        return self.db.execute(statement).scalar_one_or_none()

    def get_by_site(self, site_id: int) -> list[Subproject]:
        statement = (
            select(Subproject)
            .options(selectinload(Subproject.alcances))
            .where(Subproject.site_id == site_id)
            .order_by(Subproject.nombre)
        )
        return list(self.db.execute(statement).scalars().all())

    def get_all(self) -> list[Subproject]:
        statement = (
            select(Subproject)
            .options(selectinload(Subproject.alcances))
            .order_by(Subproject.id)
        )
        return list(self.db.execute(statement).scalars().all())

    def get_active(self) -> list[Subproject]:
        statement = (
            select(Subproject)
            .options(selectinload(Subproject.alcances))
            .where(Subproject.estado.is_(True))
            .order_by(Subproject.nombre)
        )
        return list(self.db.execute(statement).scalars().all())

    def get_scopes_by_ids(self, scope_ids: list[int]) -> list[Scope]:
        statement = select(Scope).where(Scope.id.in_(set(scope_ids)))
        return list(self.db.execute(statement).scalars().all())

    def create(self, subproject: Subproject) -> Subproject:
        try:
            self.db.add(subproject)
            self.db.commit()
            self.db.refresh(subproject)
            return subproject
        except Exception:
            self.db.rollback()
            raise

    def update(self, subproject: Subproject) -> Subproject:
        try:
            self.db.commit()
            self.db.refresh(subproject)
            return subproject
        except Exception:
            self.db.rollback()
            raise

    def delete(self, subproject: Subproject) -> None:
        try:
            subproject.alcances.clear()

            self.db.delete(subproject)

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

