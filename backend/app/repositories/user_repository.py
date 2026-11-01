from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User

class UserRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        statement = select(User).where(User.id == user_id)

        return self.db.execute(statement).scalar_one_or_none()

    def get_by_email(self, correo: str) -> User | None:
        statement = select(User).where(User.correo == correo)

        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> list[User]:
        statement = select(User).order_by(User.id)

        return list(
            self.db.execute(statement).scalars().all()
        )

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)

        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()