from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.notification_service import NotificationService


router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"],
)


@router.get("/")
def listar_notificaciones(
    limite: int = Query(default=15, ge=1, le=50),
    desplazamiento: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    return NotificationService.listar(
        db=db,
        usuario_id=usuario.id,
        limite=limite,
        desplazamiento=desplazamiento,
    )


@router.patch("/leidas")
def marcar_todas_como_leidas(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    cantidad = NotificationService.marcar_todas_como_leidas(
        db=db,
        usuario_id=usuario.id,
    )

    return {
        "mensaje": "Notificaciones marcadas como leídas.",
        "actualizadas": cantidad,
    }


@router.patch("/{notificacion_id}/leida")
def marcar_como_leida(
    notificacion_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    resultado = NotificationService.marcar_como_leida(
        db=db,
        notificacion_id=notificacion_id,
        usuario_id=usuario.id,
    )

    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La notificación no existe.",
        )

    return {
        "mensaje": "Notificación marcada como leída.",
    }
