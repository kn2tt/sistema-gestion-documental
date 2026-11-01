from datetime import date

from sqlalchemy import update

from app.core.database import SessionLocal
from app.models.assignment import Assignment


def actualizar_asignaciones_por_fecha() -> int:
    db = SessionLocal()

    try:
        resultado = db.execute(
            update(Assignment)
            .where(
                Assignment.estado == "pendiente",
                Assignment.fecha_asignacion <= date.today(),
            )
            .values(estado="en_proceso")
        )

        db.commit()

        return resultado.rowcount or 0

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
