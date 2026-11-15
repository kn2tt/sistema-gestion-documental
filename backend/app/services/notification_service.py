
import logging
from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def crear(
        db: Session,
        usuario_id: int,
        tipo: str,
        titulo: str,
        mensaje: str,
        actor_id: int | None = None,
        entidad_tipo: str | None = "asignacion",
        entidad_id: int | None = None,
    ):
        if not usuario_id:
            return None

        # No se notifica al usuario que ejecutó la acción.
        if actor_id is not None and usuario_id == actor_id:
            return None

        notificacion = Notification(
            usuario_id=usuario_id,
            actor_id=actor_id,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            entidad_tipo=entidad_tipo,
            entidad_id=entidad_id,
        )

        db.add(notificacion)

        return notificacion

    @staticmethod
    def crear_para_usuario(
        db: Session,
        usuario_id: int,
        tipo: str,
        titulo: str,
        mensaje: str,
        actor_id: int | None = None,
        entidad_tipo: str | None = "asignacion",
        entidad_id: int | None = None,
    ):
        return NotificationService.crear(
            db=db,
            usuario_id=usuario_id,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            actor_id=actor_id,
            entidad_tipo=entidad_tipo,
            entidad_id=entidad_id,
        )

    @staticmethod
    def crear_para_usuarios(
        db: Session,
        usuarios_ids: list[int],
        tipo: str,
        titulo: str,
        mensaje: str,
        actor_id: int | None = None,
        entidad_tipo: str | None = "asignacion",
        entidad_id: int | None = None,
    ):
        creadas = []

        for usuario_id in set(usuarios_ids):
            notificacion = NotificationService.crear(
                db=db,
                usuario_id=usuario_id,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                actor_id=actor_id,
                entidad_tipo=entidad_tipo,
                entidad_id=entidad_id,
            )

            if notificacion is not None:
                creadas.append(notificacion)

        return creadas

    @staticmethod
    def crear_para_rol(
        db: Session,
        rol: str,
        tipo: str,
        titulo: str,
        mensaje: str,
        actor_id: int | None = None,
        entidad_tipo: str | None = "asignacion",
        entidad_id: int | None = None,
    ):
        usuarios_ids = db.execute(
            select(User.id).where(
                func.lower(User.rol) == rol.lower(),
                User.activo.is_(True),
            )
        ).scalars().all()

        return NotificationService.crear_para_usuarios(
            db=db,
            usuarios_ids=usuarios_ids,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            actor_id=actor_id,
            entidad_tipo=entidad_tipo,
            entidad_id=entidad_id,
        )

    @staticmethod
    def persistir(db: Session) -> bool:
        """
        Guarda las notificaciones sin convertir un fallo
        de notificación en un fallo de la operación principal.
        """
        if not db.new and not db.dirty:
            return True

        try:
            db.commit()
            return True

        except Exception:
            db.rollback()

            logger.exception(
                "No se pudieron guardar las notificaciones."
            )

            return False

    @staticmethod
    def listar(
        db: Session,
        usuario_id: int,
        limite: int = 15,
        desplazamiento: int = 0,
    ):
        limite = max(1, min(limite, 50))
        desplazamiento = max(0, desplazamiento)

        notificaciones = db.execute(
            select(Notification)
            .where(
                Notification.usuario_id == usuario_id
            )
            .order_by(
                Notification.fecha_creacion.desc(),
                Notification.id.desc(),
            )
            .limit(limite)
            .offset(desplazamiento)
        ).scalars().all()

        no_leidas = db.scalar(
            select(func.count(Notification.id)).where(
                Notification.usuario_id == usuario_id,
                Notification.fecha_lectura.is_(None),
            )
        ) or 0

        total = db.scalar(
            select(func.count(Notification.id)).where(
                Notification.usuario_id == usuario_id,
            )
        ) or 0

        return {
            "items": [
                {
                    "id": item.id,
                    "tipo": item.tipo,
                    "titulo": item.titulo,
                    "mensaje": item.mensaje,
                    "entidad_tipo": item.entidad_tipo,
                    "entidad_id": item.entidad_id,
                    "fecha_creacion": item.fecha_creacion,
                    "leida": item.fecha_lectura is not None,
                }
                for item in notificaciones
            ],
            "no_leidas": no_leidas,
            "total": total,
        }

    @staticmethod
    def marcar_como_leida(
        db: Session,
        notificacion_id: int,
        usuario_id: int,
    ) -> bool:
        notificacion = db.execute(
            select(Notification).where(
                Notification.id == notificacion_id,
                Notification.usuario_id == usuario_id,
            )
        ).scalar_one_or_none()

        if notificacion is None:
            return False

        if notificacion.fecha_lectura is None:
            notificacion.fecha_lectura = datetime.utcnow()
            db.commit()

        return True

    @staticmethod
    def marcar_todas_como_leidas(
        db: Session,
        usuario_id: int,
    ) -> int:
        resultado = db.execute(
            update(Notification)
            .where(
                Notification.usuario_id == usuario_id,
                Notification.fecha_lectura.is_(None),
            )
            .values(
                fecha_lectura=datetime.utcnow()
            )
        )

        db.commit()

        return resultado.rowcount or 0

    
    @staticmethod
    def crear_para_rol_una_vez(
        db: Session,
        rol: str,
        tipo: str,
        titulo: str,
        mensaje: str,
        actor_id: int | None = None,
        entidad_tipo: str | None = "asignacion",
        entidad_id: int | None = None,
    ):
        usuarios_ids = db.execute(
            select(User.id).where(
                func.lower(User.rol) == rol.lower(),
                User.activo.is_(True),
            )
        ).scalars().all()

        creadas = []

        for usuario_id in usuarios_ids:

            existente = db.scalar(
                select(Notification.id).where(
                    Notification.usuario_id == usuario_id,
                    Notification.tipo == tipo,
                    Notification.entidad_tipo == entidad_tipo,
                    Notification.entidad_id == entidad_id,
                )
            )

            if existente is not None:
                continue

            notificacion = NotificationService.crear(
                db=db,
                usuario_id=usuario_id,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                actor_id=actor_id,
                entidad_tipo=entidad_tipo,
                entidad_id=entidad_id,
            )

            if notificacion is not None:
                creadas.append(notificacion)

        return creadas

