from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.evidence import Evidence


def actualizar_estado_documentacion(
    db: Session,
    assignment: Assignment,
) -> None:

    if assignment.estado == "completado":
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
