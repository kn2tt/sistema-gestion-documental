from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.evidence import Evidence


def actualizar_estado_documentacion(
    db: Session,
    assignment: Assignment,
) -> None:

    if assignment.documentador_id is None:
        return

    evidencia_archivada = db.execute(
        select(Evidence.id)
        .where(
            Evidence.asignacion_id == assignment.id,
            Evidence.drive_web_view_link.is_not(None),
            Evidence.drive_web_view_link != "",
        )
        .limit(1)
    ).scalar_one_or_none()

    if evidencia_archivada is None:
        return

    if assignment.estado != "completado":
        assignment.estado = "en_documentacion"