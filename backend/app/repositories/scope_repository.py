from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.scope import Scope


class ScopeRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, scope_id: int) -> Scope | None:
        statement = select(Scope).where(
            Scope.id == scope_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[Scope]:
        statement = select(Scope).order_by(Scope.nombre)

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_active(self) -> list[Scope]:
        statement = (
            select(Scope)
            .where(Scope.activo.is_(True))
            .order_by(Scope.nombre)
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def create(self, scope: Scope) -> Scope:
        self.db.add(scope)
        self.db.commit()
        self.db.refresh(scope)

        return scope

    def update(self, scope: Scope) -> Scope:
        self.db.commit()
        self.db.refresh(scope)

        return scope

    def delete(self, scope: Scope) -> None:
        try:
            self.db.delete(scope)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise
