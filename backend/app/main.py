from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends
from sqlalchemy import text

from fastapi import HTTPException

from contextlib import asynccontextmanager
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.assignment_scheduler import (
    actualizar_asignaciones_por_fecha,
)

from app.core.storage import verificar_conexion_storage

from app.core.database import engine, settings

from app.core.auth import get_current_user, require_admin

from app.controllers.user_controller import router as user_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.client_controller import router as client_router
from app.controllers.project_controller import router as project_router
from app.controllers.site_controller import router as site_router
from app.controllers.scope_controller import router as scope_router
from app.controllers.checklist_template_controller import (
    router as checklist_template_router,
)
from app.controllers.generated_checklist_controller import (
    router as generated_checklist_router,
)
from app.controllers.document_type_controller import (
    router as document_type_router,
)
from app.controllers.template_controller import (
    router as template_router,
)
from app.controllers.photo_requirement_controller import (
    router as photo_requirement_router,
)
from app.controllers.assignment_controller import (
    router as assignment_router,
)
from app.controllers.evidence_controller import (
    router as evidence_router,
)
from app.controllers.document_controller import (
    router as document_router,
)
from app.controllers.subproject_controller import (
    router as subproject_router,
)

scheduler = BackgroundScheduler(
    timezone=ZoneInfo("America/Lima")
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Procesar las asignaciones pendientes al iniciar el backend.
    actualizar_asignaciones_por_fecha()

    # Revisar periódicamente si hay asignaciones que deban comenzar.
    scheduler.add_job(
        actualizar_asignaciones_por_fecha,
        trigger="interval",
        minutes=1,
        id="actualizar_asignaciones_por_fecha",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="Sistema de Gestión Documental",
    description=(
        "API para la gestión de documentación técnica "
        "de proyectos de telecomunicaciones"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.FRONTEND_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth_router)

# =========================================================
# MÓDULOS DE ADMINISTRACIÓN
# Solo el administrador puede acceder.
# =========================================================

app.include_router(
    user_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    client_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    project_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    site_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    scope_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    checklist_template_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    document_type_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    template_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    photo_requirement_router,
    dependencies=[Depends(require_admin)],
)

app.include_router(
    subproject_router,
    dependencies=[Depends(require_admin)],
)


# =========================================================
# MÓDULOS OPERATIVOS
# Por ahora requieren una sesión válida.
# Los permisos por asignación se implementarán después.
# =========================================================

app.include_router(
    assignment_router,
    dependencies=[Depends(get_current_user)],
)

app.include_router(
    generated_checklist_router,
    dependencies=[Depends(get_current_user)],
)

app.include_router(
    evidence_router,
    dependencies=[Depends(get_current_user)],
)

app.include_router(
    document_router,
    dependencies=[Depends(get_current_user)],
)

@app.get("/")
def inicio():
    return {
        "mensaje": "Sistema de Gestión Documental funcionando",
        "version": "1.0.0",
    }


@app.get(
    "/test-db",
    dependencies=[Depends(require_admin)],
)
def test_db():
    with engine.connect() as connection:
        resultado = connection.execute(text("SELECT 1"))
        valor = resultado.scalar()

    return {
        "database": "PostgreSQL",
        "conexion": "exitosa",
        "resultado": valor,
    }

@app.get(
    "/test-storage",
    dependencies=[Depends(require_admin)],
)
def test_storage():
    try:
        return verificar_conexion_storage()

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )