from sqlalchemy import select, or_
from sqlalchemy.orm import Session, selectinload

from app.models.assignment import Assignment
from app.models.assignment_specification import AssignmentSpecification
from app.models.specification_activity import SpecificationActivity
from app.models.user import User


class AssignmentRepository:

    def __init__(self, db: Session):
        self.db = db

    def _query(self):
        return (
            select(Assignment)
            .options(
                selectinload(Assignment.tecnicos),
                selectinload(Assignment.especificaciones)
                .selectinload(AssignmentSpecification.actividades),
            )
        )

    def get_by_id(self, assignment_id: int) -> Assignment | None:
        statement = self._query().where(
            Assignment.id == assignment_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[Assignment]:
        statement = self._query().order_by(Assignment.id.desc())

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_tecnico(self, tecnico_id: int) -> list[Assignment]:
        statement = (
            self._query()
            .where(
                or_(
                    Assignment.tecnico_id == tecnico_id,
                    Assignment.tecnicos.any(User.id == tecnico_id),
                )
            )
            .order_by(Assignment.id.desc())
        )

        return list(
            self.db.execute(statement).scalars().unique().all()
        )

    def get_by_estado(self, estado: str) -> list[Assignment]:
        statement = (
            self._query()
            .where(Assignment.estado == estado)
            .order_by(Assignment.id.desc())
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_proyecto(self, proyecto_id: int) -> list[Assignment]:
        statement = (
            self._query()
            .where(Assignment.proyecto_id == proyecto_id)
            .order_by(Assignment.id.desc())
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def create(self, assignment: Assignment) -> Assignment:
        try:
            self.db.add(assignment)
            self.db.commit()
            assignment_id = assignment.id
            self.db.expire_all()

            return self.get_by_id(assignment_id)

        except Exception:
            self.db.rollback()
            raise

    def update(self, assignment: Assignment) -> Assignment:
        try:
            self.db.commit()
            assignment_id = assignment.id
            self.db.expire_all()

            return self.get_by_id(assignment_id)

        except Exception:
            self.db.rollback()
            raise

    def delete(self, assignment: Assignment) -> None:
        try:
            self.db.delete(assignment)
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

    def get_by_documentador(
        self,
        documentador_id: int,
    ) -> list[Assignment]:

        statement = (
            self._query()
            .where(
                Assignment.documentador_id == documentador_id
            )
            .order_by(Assignment.id.desc())
        )

        return list(
            self.db.execute(statement).scalars().unique().all()
        )