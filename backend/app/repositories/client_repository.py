from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.client import Client


class ClientRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, client_id: int) -> Client | None:
        statement = select(Client).where(Client.id == client_id)

        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[Client]:
        statement = select(Client).order_by(Client.id)

        return list(self.db.execute(statement).scalars().all())

    def get_active(self) -> list[Client]:
        statement = (
            select(Client)
            .where(Client.activo.is_(True))
            .order_by(Client.nombre)
        )

        return list(self.db.execute(statement).scalars().all())

    def create(self, client: Client) -> Client:
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)

        return client

    def update(self, client: Client) -> Client:
        self.db.commit()
        self.db.refresh(client)

        return client

    def delete(self, client: Client) -> None:
        self.db.delete(client)
        self.db.commit()