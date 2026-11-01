from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.photo_requirement import PhotoRequirement


class PhotoRequirementRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        requirement_id: int,
    ) -> PhotoRequirement | None:
        statement = select(PhotoRequirement).where(
            PhotoRequirement.id == requirement_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def get_by_scope(
        self,
        scope_id: int,
    ) -> list[PhotoRequirement]:
        statement = (
            select(PhotoRequirement)
            .where(PhotoRequirement.alcance_id == scope_id)
            .order_by(PhotoRequirement.orden)
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_active_by_scope(
        self,
        scope_id: int,
    ) -> list[PhotoRequirement]:
        statement = (
            select(PhotoRequirement)
            .where(
                PhotoRequirement.alcance_id == scope_id,
                PhotoRequirement.activo.is_(True),
            )
            .order_by(PhotoRequirement.orden)
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def get_all(self) -> list[PhotoRequirement]:
        statement = select(PhotoRequirement).order_by(
            PhotoRequirement.orden
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def create(
        self,
        requirement: PhotoRequirement,
    ) -> PhotoRequirement:
        self.db.add(requirement)
        self.db.commit()
        self.db.refresh(requirement)

        return requirement

    def update(
        self,
        requirement: PhotoRequirement,
    ) -> PhotoRequirement:
        self.db.commit()
        self.db.refresh(requirement)

        return requirement

    def delete(
        self,
        requirement: PhotoRequirement,
    ) -> None:
        self.db.delete(requirement)
        self.db.commit()
