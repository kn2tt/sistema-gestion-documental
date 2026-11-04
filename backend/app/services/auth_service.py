import hashlib
import secrets

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import settings
from app.models.user import User
from app.models.user_session import UserSession
from app.repositories.user_repository import UserRepository
from app.services.user_service import password_hash


# Hash ficticio para realizar una verificación cuando el correo no existe.
# Evita que el flujo de autenticación dependa únicamente de encontrar al usuario.
DUMMY_PASSWORD_HASH = password_hash.hash(
    "clave-ficticia-para-verificacion"
)


@dataclass
class AuthenticatedSession:
    user: User
    session: UserSession


class AuthService:

    def __init__(self, db: Session):
        self.db = db
        self.user_repository = UserRepository(db)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

    def login(
        self,
        correo: str,
        password: str,
        previous_token: str | None = None,
    ) -> tuple[User, str, str]:

        user = self.user_repository.get_by_email(correo)

        stored_hash = (
            user.password_hash
            if user
            else DUMMY_PASSWORD_HASH
        )

        try:
            password_valid = password_hash.verify(
                password,
                stored_hash,
            )
        except Exception:
            password_valid = False

        if not user or not password_valid or not user.activo:
            raise ValueError("Credenciales incorrectas.")

        # Revocar la sesión anterior si existe.
        if previous_token:
            previous_hash = self.hash_token(previous_token)

            previous_session = self.db.execute(
                select(UserSession).where(
                    UserSession.token_hash == previous_hash,
                    UserSession.revoked_at.is_(None),
                )
            ).scalar_one_or_none()

            if previous_session:
                previous_session.revoked_at = datetime.utcnow()

        session_token = secrets.token_urlsafe(32)
        csrf_token = secrets.token_urlsafe(32)

        now = datetime.utcnow()

        user_session = UserSession(
            user_id=user.id,
            token_hash=self.hash_token(session_token),
            csrf_token_hash=self.hash_token(csrf_token),
            created_at=now,
            expires_at=now + timedelta(
                hours=settings.SESSION_TTL_HOURS
            ),
            last_activity_at=now,
        )

        self.db.add(user_session)
        self.db.commit()

        return user, session_token, csrf_token

    def get_session(
        self,
        token: str | None,
    ) -> AuthenticatedSession | None:

        if not token:
            return None

        token_hash = self.hash_token(token)
        now = datetime.utcnow()

        user_session = self.db.execute(
            select(UserSession).where(
                UserSession.token_hash == token_hash,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > now,
            )
        ).scalar_one_or_none()

        if not user_session:
            return None

        user = self.user_repository.get_by_id(
            user_session.user_id
        )

        if not user or not user.activo:
            user_session.revoked_at = now
            self.db.commit()
            return None

        user_session.last_activity_at = now
        self.db.commit()

        return AuthenticatedSession(
            user=user,
            session=user_session,
        )

    def rotate_csrf_token(
        self,
        auth_session: AuthenticatedSession,
    ) -> str:

        csrf_token = secrets.token_urlsafe(32)

        auth_session.session.csrf_token_hash = (
            self.hash_token(csrf_token)
        )

        self.db.commit()

        return csrf_token

    def verify_csrf_token(
        self,
        auth_session: AuthenticatedSession,
        csrf_token: str | None,
    ) -> bool:

        if not csrf_token:
            return False

        received_hash = self.hash_token(csrf_token)

        return secrets.compare_digest(
            received_hash,
            auth_session.session.csrf_token_hash,
        )

    def logout(
        self,
        auth_session: AuthenticatedSession,
    ) -> None:

        auth_session.session.revoked_at = datetime.utcnow()
        self.db.commit()