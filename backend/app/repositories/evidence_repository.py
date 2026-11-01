from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.evidence import Evidence


class EvidenceRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        evidence_id: int
    ) -> Evidence | None:
        statement = select(Evidence).where(
            Evidence.id == evidence_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def get_by_assignment(
        self,
        assignment_id: int
    ) -> list[Evidence]:
        statement = (
            select(Evidence)
            .where(
                Evidence.asignacion_id == assignment_id
            )
            .order_by(Evidence.id)
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_requirement(
        self,
        requirement_id: int
    ) -> list[Evidence]:
        statement = (
            select(Evidence)
            .where(
                Evidence.requisito_id == requirement_id
            )
            .order_by(Evidence.id)
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_assignment_and_requirement(
        self,
        assignment_id: int,
        requirement_id: int
    ) -> list[Evidence]:
        statement = (
            select(Evidence)
            .where(
                Evidence.asignacion_id == assignment_id,
                Evidence.requisito_id == requirement_id
            )
            .order_by(Evidence.id.desc())
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_by_status(
        self,
        status: str
    ) -> list[Evidence]:
        statement = (
            select(Evidence)
            .where(
                Evidence.estado == status
            )
            .order_by(Evidence.id.desc())
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def create(
        self,
        evidence: Evidence
    ) -> Evidence:
        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)

        return evidence

    def update(
        self,
        evidence: Evidence
    ) -> Evidence:
        self.db.commit()
        self.db.refresh(evidence)

        return evidence

    def delete(
        self,
        evidence: Evidence
    ) -> None:
        self.db.delete(evidence)
        self.db.commit()