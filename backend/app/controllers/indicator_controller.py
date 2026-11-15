from collections import Counter, defaultdict
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_roles
from app.core.database import get_db

from app.models.assignment import Assignment
from app.models.client import Client
from app.models.document import Document
from app.models.evidence import Evidence
from app.models.generated_checklist import GeneratedChecklist
from app.models.project import Project


router = APIRouter(
    prefix="/indicadores",
    tags=["Indicadores de gestión"],
)


ESTADOS_ASIGNACION = {
    "pendiente": "Pendiente",
    "en_proceso": "En proceso",
    "pendiente_documentacion": "Pendiente de documentación",
    "en_documentacion": "En documentación",
    "en_revision": "En revisión",
    "observado": "Observado",
    "completado": "Completado",
}


def obtener_fecha_actual() -> date:
    """Obtiene la fecha actual de Lima."""
    return datetime.now(
        ZoneInfo("America/Lima")
    ).date()


@router.get(
    "/gestion",
    dependencies=[
        Depends(require_roles("administrador"))
    ],
)
def obtener_indicadores_gestion(
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    cliente_id: int | None = Query(default=None),
    proyecto_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Devuelve indicadores de gestión documental:
    - Asignaciones por estado, cliente y proyecto.
    - Documentos por estado y tipo.
    - Cumplimiento de evidencias fotográficas.
    - Carga de trabajo por responsable.
    - Alertas de gestión.
    """

    # =====================================================
    # VALIDACIÓN DE FILTROS
    # =====================================================

    if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha inicial no puede ser posterior "
                "a la fecha final."
            ),
        )

    if cliente_id is not None:
        cliente = db.get(Client, cliente_id)

        if cliente is None:
            raise HTTPException(
                status_code=404,
                detail="El cliente seleccionado no existe.",
            )

    if proyecto_id is not None:
        proyecto = db.get(Project, proyecto_id)

        if proyecto is None:
            raise HTTPException(
                status_code=404,
                detail="El proyecto seleccionado no existe.",
            )

        if (
            cliente_id is not None
            and proyecto.cliente_id != cliente_id
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "El proyecto seleccionado no pertenece "
                    "al cliente indicado."
                ),
            )

    hoy = obtener_fecha_actual()

    # =====================================================
    # CONSULTA DE ASIGNACIONES
    # =====================================================

    consulta_asignaciones = (
        select(Assignment)
        .options(
            selectinload(Assignment.proyecto).selectinload(
                Project.cliente
            ),
            selectinload(Assignment.site),
            selectinload(Assignment.tipo_documento),
            selectinload(Assignment.tecnicos),
            selectinload(Assignment.tecnico),
            selectinload(Assignment.documentador),
        )
    )

    if cliente_id is not None:
        consulta_asignaciones = (
            consulta_asignaciones
            .join(
                Project,
                Project.id == Assignment.proyecto_id,
            )
            .where(
                Project.cliente_id == cliente_id
            )
        )

    if proyecto_id is not None:
        consulta_asignaciones = (
            consulta_asignaciones.where(
                Assignment.proyecto_id == proyecto_id
            )
        )

    if fecha_desde is not None:
        consulta_asignaciones = (
            consulta_asignaciones.where(
                Assignment.fecha_asignacion >= fecha_desde
            )
        )

    if fecha_hasta is not None:
        consulta_asignaciones = (
            consulta_asignaciones.where(
                Assignment.fecha_asignacion <= fecha_hasta
            )
        )

    asignaciones = (
        db.execute(
            consulta_asignaciones.order_by(
                Assignment.fecha_asignacion.desc(),
                Assignment.id.desc(),
            )
        )
        .scalars()
        .unique()
        .all()
    )

    ids_asignaciones = [
        asignacion.id
        for asignacion in asignaciones
    ]

    total_asignaciones = len(asignaciones)

    # =====================================================
    # INDICADORES DE ASIGNACIONES
    # =====================================================

    conteo_estados = Counter(
        asignacion.estado
        for asignacion in asignaciones
    )

    asignaciones_completadas = [
        asignacion
        for asignacion in asignaciones
        if asignacion.estado == "completado"
    ]

    asignaciones_activas = [
        asignacion
        for asignacion in asignaciones
        if asignacion.estado != "completado"
    ]

    asignaciones_vencidas = [
        asignacion
        for asignacion in asignaciones_activas
        if (
            asignacion.fecha_limite is not None
            and asignacion.fecha_limite < hoy
        )
    ]

    asignaciones_por_estado = [
        {
            "estado": estado,
            "nombre": nombre,
            "cantidad": conteo_estados.get(estado, 0),
        }
        for estado, nombre in ESTADOS_ASIGNACION.items()
    ]

    # =====================================================
    # DISTRIBUCIÓN POR CLIENTE Y PROYECTO
    # =====================================================

    conteo_clientes = Counter()
    conteo_proyectos = Counter()

    for asignacion in asignaciones:
        if asignacion.proyecto:
            conteo_proyectos[
                asignacion.proyecto.nombre
            ] += 1

            if asignacion.proyecto.cliente:
                conteo_clientes[
                    asignacion.proyecto.cliente.nombre
                ] += 1

    asignaciones_por_cliente = [
        {
            "nombre": nombre,
            "cantidad": cantidad,
        }
        for nombre, cantidad in conteo_clientes.most_common()
    ]

    asignaciones_por_proyecto = [
        {
            "nombre": nombre,
            "cantidad": cantidad,
        }
        for nombre, cantidad in conteo_proyectos.most_common()
    ]

    # =====================================================
    # DOCUMENTOS
    # =====================================================

    documentos = []

    if ids_asignaciones:
        documentos = (
            db.execute(
                select(Document).where(
                    Document.asignacion_id.in_(
                        ids_asignaciones
                    ),
                    Document.eliminado.is_(False),
                )
            )
            .scalars()
            .all()
        )

    documentos_por_asignacion = {
        documento.asignacion_id: documento
        for documento in documentos
    }

    conteo_documentos_estado = Counter(
        documento.estado
        for documento in documentos
    )

    conteo_documentos_tipo = Counter()

    asignaciones_por_id = {
        asignacion.id: asignacion
        for asignacion in asignaciones
    }

    for documento in documentos:
        asignacion = asignaciones_por_id.get(
            documento.asignacion_id
        )

        if asignacion and asignacion.tipo_documento:
            conteo_documentos_tipo[
                asignacion.tipo_documento.nombre
            ] += 1

    asignaciones_sin_documento = [
        asignacion
        for asignacion in asignaciones
        if asignacion.id not in documentos_por_asignacion
    ]

    documentos_por_estado = [
        {
            "estado": estado,
            "cantidad": cantidad,
        }
        for estado, cantidad in conteo_documentos_estado.most_common()
    ]

    documentos_por_tipo = [
        {
            "nombre": nombre,
            "cantidad": cantidad,
        }
        for nombre, cantidad in conteo_documentos_tipo.most_common()
    ]

    # =====================================================
    # CHECKLISTS PUBLICADOS
    # =====================================================

    checklists = []

    if ids_asignaciones:
        checklists = (
            db.execute(
                select(GeneratedChecklist)
                .where(
                    GeneratedChecklist.asignacion_id.in_(
                        ids_asignaciones
                    ),
                    GeneratedChecklist.estado == "publicado",
                )
                .options(
                    selectinload(
                        GeneratedChecklist.items
                    )
                )
            )
            .scalars()
            .all()
        )

    checklists_publicados_ids = {
        checklist.asignacion_id
        for checklist in checklists
    }

    items_obligatorios_por_asignacion = defaultdict(set)

    for checklist in checklists:
        for item in checklist.items:
            if item.obligatorio:
                items_obligatorios_por_asignacion[
                    checklist.asignacion_id
                ].add(item.id)

    # =====================================================
    # EVIDENCIAS COMPLETADAS
    # =====================================================

    evidencias = []

    if ids_asignaciones:
        evidencias = (
            db.execute(
                select(
                    Evidence.asignacion_id,
                    Evidence.item_checklist_id,
                ).where(
                    Evidence.asignacion_id.in_(
                        ids_asignaciones
                    ),
                    Evidence.estado == "completa",
                )
            )
            .all()
        )

    items_completados_por_asignacion = defaultdict(set)

    for evidencia in evidencias:
        items_completados_por_asignacion[
            evidencia.asignacion_id
        ].add(evidencia.item_checklist_id)

    # =====================================================
    # CUMPLIMIENTO DE EVIDENCIAS
    # =====================================================

    total_items_obligatorios = 0
    total_items_completados = 0
    total_items_pendientes = 0

    evidencias_por_asignacion = {}

    for asignacion in asignaciones:
        items_obligatorios = (
            items_obligatorios_por_asignacion.get(
                asignacion.id,
                set(),
            )
        )

        items_completados = (
            items_completados_por_asignacion.get(
                asignacion.id,
                set(),
            )
            & items_obligatorios
        )

        items_pendientes = (
            items_obligatorios - items_completados
        )

        cantidad_obligatorios = len(items_obligatorios)
        cantidad_completados = len(items_completados)
        cantidad_pendientes = len(items_pendientes)

        evidencias_por_asignacion[asignacion.id] = {
            "tiene_checklist": (
                asignacion.id in checklists_publicados_ids
            ),
            "obligatorios": cantidad_obligatorios,
            "completados": cantidad_completados,
            "pendientes": cantidad_pendientes,
        }

        total_items_obligatorios += cantidad_obligatorios
        total_items_completados += cantidad_completados
        total_items_pendientes += cantidad_pendientes

    porcentaje_cumplimiento = (
        round(
            total_items_completados
            / total_items_obligatorios
            * 100,
            1,
        )
        if total_items_obligatorios > 0
        else 0
    )

    # =====================================================
    # CARGA DE TRABAJO POR RESPONSABLE
    # =====================================================

    responsables = {}

    for asignacion in asignaciones_activas:
        tecnicos = list(
            asignacion.tecnicos or []
        )

        # Compatibilidad con asignaciones que todavía
        # utilizan el técnico principal heredado.
        if not tecnicos and asignacion.tecnico:
            tecnicos = [asignacion.tecnico]

        for tecnico in tecnicos:
            clave = (
                "tecnico",
                tecnico.id,
            )

            if clave not in responsables:
                responsables[clave] = {
                    "usuario_id": tecnico.id,
                    "nombre": (
                        f"{tecnico.nombre} "
                        f"{tecnico.apellido}"
                    ).strip(),
                    "rol": "Técnico",
                    "asignaciones_activas": 0,
                }

            responsables[clave][
                "asignaciones_activas"
            ] += 1

        documentador = asignacion.documentador

        if documentador:
            clave = (
                "documentador",
                documentador.id,
            )

            if clave not in responsables:
                responsables[clave] = {
                    "usuario_id": documentador.id,
                    "nombre": (
                        f"{documentador.nombre} "
                        f"{documentador.apellido}"
                    ).strip(),
                    "rol": "Documentador",
                    "asignaciones_activas": 0,
                }

            responsables[clave][
                "asignaciones_activas"
            ] += 1

    carga_responsables = sorted(
        responsables.values(),
        key=lambda responsable: (
            responsable["asignaciones_activas"],
            responsable["nombre"].lower(),
        ),
        reverse=True,
    )

    # =====================================================
    # ALERTAS DE GESTIÓN
    # =====================================================

    alertas = []

    for asignacion in asignaciones:
        proyecto_nombre = (
            asignacion.proyecto.nombre
            if asignacion.proyecto
            else "Sin proyecto"
        )

        site_nombre = (
            asignacion.site.nombre
            if asignacion.site
            else "Sin site"
        )

        contexto = (
            f"{proyecto_nombre} · {site_nombre}"
        )

        # ---------------------------------------------
        # ASIGNACIONES VENCIDAS
        # ---------------------------------------------

        if (
            asignacion.estado != "completado"
            and asignacion.fecha_limite is not None
            and asignacion.fecha_limite < hoy
        ):
            alertas.append({
                "tipo": "vencida",
                "prioridad": "alta",
                "asignacion_id": asignacion.id,
                "contexto": contexto,
                "mensaje": (
                    "La fecha límite de la asignación ha vencido."
                ),
                "fecha": asignacion.fecha_limite,
            })

        # ---------------------------------------------
        # DOCUMENTOS FALTANTES
        # ---------------------------------------------

        if asignacion.id not in documentos_por_asignacion:
            alertas.append({
                "tipo": "documento",
                "prioridad": "media",
                "asignacion_id": asignacion.id,
                "contexto": contexto,
                "mensaje": (
                    "La asignación todavía no tiene "
                    "un documento cargado."
                ),
                "fecha": None,
            })

        # ---------------------------------------------
        # EVIDENCIAS FOTOGRÁFICAS PENDIENTES
        # ---------------------------------------------

        resumen_evidencias = (
            evidencias_por_asignacion.get(
                asignacion.id,
                {},
            )
        )

        if (
            resumen_evidencias.get("tiene_checklist", False)
            and resumen_evidencias.get("pendientes", 0) > 0
        ):
            alertas.append({
                "tipo": "evidencia",
                "prioridad": "media",
                "asignacion_id": asignacion.id,
                "contexto": contexto,
                "mensaje": (
                    "Faltan "
                    f"{resumen_evidencias['pendientes']} "
                    "ítems fotográficos obligatorios."
                ),
                "fecha": None,
            })

    orden_prioridad = {
        "alta": 0,
        "media": 1,
        "baja": 2,
    }

    alertas.sort(
        key=lambda alerta: (
            orden_prioridad.get(
                alerta["prioridad"],
                3,
            ),
            alerta["asignacion_id"],
        )
    )

    # =====================================================
    # OPCIONES DE FILTROS
    # =====================================================

    clientes = (
        db.execute(
            select(Client)
            .where(Client.activo.is_(True))
            .order_by(Client.nombre)
        )
        .scalars()
        .all()
    )

    consulta_proyectos = select(Project).order_by(
        Project.nombre
    )

    if cliente_id is not None:
        consulta_proyectos = consulta_proyectos.where(
            Project.cliente_id == cliente_id
        )

    proyectos = (
        db.execute(consulta_proyectos)
        .scalars()
        .all()
    )

    # =====================================================
    # RESPUESTA
    # =====================================================

    return {
        "generado_en": datetime.now(
            ZoneInfo("America/Lima")
        ).isoformat(),

        "filtros_aplicados": {
            "fecha_desde": fecha_desde,
            "fecha_hasta": fecha_hasta,
            "cliente_id": cliente_id,
            "proyecto_id": proyecto_id,
        },

        "resumen": {
            "total_asignaciones": total_asignaciones,
            "asignaciones_activas": len(
                asignaciones_activas
            ),
            "asignaciones_completadas": len(
                asignaciones_completadas
            ),
            "asignaciones_vencidas": len(
                asignaciones_vencidas
            ),
            "documentos_cargados": len(documentos),
            "asignaciones_sin_documento": len(
                asignaciones_sin_documento
            ),
        },

        "asignaciones_por_estado": (
            asignaciones_por_estado
        ),

        "asignaciones_por_cliente": (
            asignaciones_por_cliente
        ),

        "asignaciones_por_proyecto": (
            asignaciones_por_proyecto
        ),

        "documentos": {
            "total": len(documentos),
            "por_estado": documentos_por_estado,
            "por_tipo": documentos_por_tipo,
        },

        "evidencias": {
            "items_obligatorios": (
                total_items_obligatorios
            ),
            "items_completados": (
                total_items_completados
            ),
            "items_pendientes": (
                total_items_pendientes
            ),
            "porcentaje_cumplimiento": (
                porcentaje_cumplimiento
            ),
        },

        "responsables": carga_responsables,

        "alertas": alertas[:12],

        "filtros": {
            "clientes": [
                {
                    "id": cliente.id,
                    "nombre": cliente.nombre,
                }
                for cliente in clientes
            ],
            "proyectos": [
                {
                    "id": proyecto.id,
                    "nombre": proyecto.nombre,
                    "cliente_id": proyecto.cliente_id,
                }
                for proyecto in proyectos
            ],
        },
    }
