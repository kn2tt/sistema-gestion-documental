from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.auth import (
    get_authenticated_session,
    get_current_user,
    require_csrf,
)
from app.core.database import get_db, settings
from app.models.user import User
from app.schemas.auth import (
    CsrfResponse,
    LoginRequest,
    LoginResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    AuthService,
    AuthenticatedSession,
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)


def configurar_cookie(
    response: Response,
    token: str,
) -> None:

    same_site = settings.SESSION_COOKIE_SAMESITE.lower()

    if same_site not in ("lax", "strict", "none"):
        raise RuntimeError(
            "SESSION_COOKIE_SAMESITE debe ser lax, strict o none."
        )

    if same_site == "none" and not settings.SESSION_COOKIE_SECURE:
        raise RuntimeError(
            "SameSite=None requiere SESSION_COOKIE_SECURE=True."
        )

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_TTL_HOURS * 60 * 60,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=same_site,
        path="/",
    )


@router.post(
    "/login",
    response_model=LoginResponse,
)
def iniciar_sesion(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):

    previous_token = request.cookies.get(
        settings.SESSION_COOKIE_NAME
    )

    service = AuthService(db)

    try:
        user, session_token, csrf_token = service.login(
            correo=str(data.correo).lower(),
            password=data.password,
            previous_token=previous_token,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        )

    configurar_cookie(response, session_token)

    return LoginResponse(
        usuario=user,
        csrf_token=csrf_token,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def obtener_sesion_actual(
    user: User = Depends(get_current_user),
):
    return user


@router.get(
    "/csrf",
    response_model=CsrfResponse,
)
def renovar_token_csrf(
    auth_session: AuthenticatedSession = Depends(
        get_authenticated_session
    ),
    db: Session = Depends(get_db),
):
    csrf_token = AuthService(db).rotate_csrf_token(
        auth_session
    )

    return CsrfResponse(
        csrf_token=csrf_token
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def cerrar_sesion(
    response: Response,
    auth_session: AuthenticatedSession = Depends(
        require_csrf
    ),
    db: Session = Depends(get_db),
):

    AuthService(db).logout(auth_session)

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE.lower(),
    )

    response.status_code = status.HTTP_204_NO_CONTENT
    return None