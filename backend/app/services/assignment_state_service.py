from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.assignment import Assignment
from app.models.evidence import Evidence


ESTADOS_QUE_PUEDEN_AVANZAR_A_DOCUMENTACION = {
    "pendiente",
    "en_proceso",
    "pendiente_documentacion",
    "en_documentacion",
}


def actualizar_estado_documentacion(
    db: Session,
    assignment: Assignment,
) -> None:

    if assignment.estado not in ESTADOS_QUE_PUEDEN_AVANZAR_A_DOCUMENTACION:
        return

    evidencia_archivada = db.execute(
        select(Evidence.id)
        .where(
            Evidence.asignacion_id == assignment.id,
            Evidence.drive_web_view_link.is_not(None),
            Evidence.drive_web_view_link != "",
            Evidence.fecha_archivado.is_not(None),
        )
        .limit(1)
    ).scalar_one_or_none()

    condiciones_cumplidas = (
        assignment.documentador_id is not None
        and evidencia_archivada is not None
    )

    if condiciones_cumplidas:
        assignment.estado = "en_documentacion"


def sincronizar_estados_documentacion_existentes() -> int:
    db = SessionLocal()

    try:
        asignaciones = db.execute(
            select(Assignment).where(
                Assignment.estado.in_(
                    ESTADOS_QUE_PUEDEN_AVANZAR_A_DOCUMENTACION
                )
            )
        ).scalars().all()

        actualizadas = 0

        for assignment in asignaciones:
            estado_anterior = assignment.estado

            actualizar_estado_documentacion(
                db,
                assignment,
            )

            if assignment.estado != estado_anterior:
                actualizadas += 1

        db.commit()

        return actualizadas

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()