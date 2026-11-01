from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site import Site


class SiteRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, site_id: int) -> Site | None:
        statement = select(Site).where(Site.id == site_id)

        return self.db.execute(statement).scalar_one_or_none()

    def get_by_project(self, project_id: int) -> list[Site]:
        statement = (
            select(Site)
            .where(Site.proyecto_id == project_id)
            .order_by(Site.nombre)
        )

        return list(self.db.execute(statement).scalars().all())

    def get_all(self) -> list[Site]:
        statement = select(Site).order_by(Site.id)

        return list(self.db.execute(statement).scalars().all())

    def get_active(self) -> list[Site]:
        statement = (
            select(Site)
            .where(Site.estado.is_(True))
            .order_by(Site.nombre)
        )

        return list(self.db.execute(statement).scalars().all())

    def create(self, site: Site) -> Site:
        self.db.add(site)
        self.db.commit()
        self.db.refresh(site)

        return site

    def update(self, site: Site) -> Site:
        self.db.commit()
        self.db.refresh(site)

        return site

    def delete(self, site: Site) -> None:
        self.db.delete(site)
        self.db.commit()