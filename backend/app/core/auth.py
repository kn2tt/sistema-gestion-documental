from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db, settings
from app.models.user import User
from app.services.auth_service import (
    AuthService,
    AuthenticatedSession,
)


def get_authenticated_session(
    request: Request,
    db: Session = Depends(get_db),
) -> AuthenticatedSession:

    token = request.cookies.get(
        settings.SESSION_COOKIE_NAME
    )

    auth_session = AuthService(db).get_session(token)

    if not auth_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión no es válida o ha expirado.",
        )

    return auth_session


def get_current_user(
    auth_session: AuthenticatedSession = Depends(
        get_authenticated_session
    ),
) -> User:

    return auth_session.user


def require_roles(*roles: str):

    roles_permitidos = {
        role.strip().lower()
        for role in roles
    }

    def validar_rol(
        user: User = Depends(get_current_user),
    ) -> User:

        if user.rol.strip().lower() not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta operación.",
            )

        return user

    return validar_rol


def require_admin(
    user: User = Depends(
        require_roles("administrador")
    ),
) -> User:

    return user


def require_csrf(
    auth_session: AuthenticatedSession = Depends(
        get_authenticated_session
    ),
    csrf_token: str | None = Header(
        default=None,
        alias="X-CSRF-Token",
    ),
    db: Session = Depends(get_db),
) -> AuthenticatedSession:

    valid = AuthService(db).verify_csrf_token(
        auth_session,
        csrf_token,
    )

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF inválido o ausente.",
        )

    return auth_session