from sqlalchemy.orm import Session

from app.models.client import Client
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService:

    def __init__(self, db: Session):
        self.repository = ClientRepository(db)

    def get_by_id(self, client_id: int) -> Client | None:
        return self.repository.get_by_id(client_id)

    def get_all(self) -> list[Client]:
        return self.repository.get_all()

    def get_active(self) -> list[Client]:
        return self.repository.get_active()

    def create(self, data: ClientCreate) -> Client:

        client = Client(
            nombre=data.nombre,
            ruc=data.ruc,
            contacto=data.contacto,
            telefono=data.telefono,
            correo=data.correo,
            activo=data.activo,
        )

        return self.repository.create(client)

    def update(
        self,
        client_id: int,
        data: ClientUpdate
    ) -> Client:

        client = self.repository.get_by_id(client_id)

        if not client:
            raise ValueError(
                "El cliente no existe."
            )

        if data.nombre is not None:
            client.nombre = data.nombre

        client.ruc = data.ruc
        client.contacto = data.contacto
        client.telefono = data.telefono
        client.correo = data.correo

        if data.activo is not None:
            client.activo = data.activo

        return self.repository.update(client)

    def delete(self, client_id: int) -> None:

        client = self.repository.get_by_id(client_id)

        if not client:
            raise ValueError(
                "El cliente no existe."
            )

        self.repository.delete(client)