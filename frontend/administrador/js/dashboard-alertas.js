
const API_URL = "http://127.0.0.1:8000";

const dashboardAlerts = document.getElementById("dashboardAlerts");

const ESTADOS_ENVIADOS = new Set([
    "pendiente_documentacion",
    "en_documentacion",
    "en_revision",
    "observado",
    "completado"
]);

const DIAS_PROXIMOS_VENCER = 7;

function apiFetch(url) {
    return fetch(url, {
        credentials: "include"
    });
}

async function obtenerJSON(url) {
    const respuesta = await apiFetch(url);

    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }

    return respuesta.json();
}

/* =========================================
   FECHAS
   ========================================= */

function obtenerFechaLocal(valor) {
    if (!valor) return null;

    const fechaTexto = String(valor).substring(0, 10);
    const partes = fechaTexto.split("-");

    if (partes.length !== 3) return null;

    const [anio, mes, dia] = partes.map(Number);

    const fecha = new Date(anio, mes - 1, dia);

    if (Number.isNaN(fecha.getTime())) return null;

    fecha.setHours(0, 0, 0, 0);

    return fecha;
}

function obtenerHoy() {
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    return hoy;
}

function diferenciaDias(fecha, hoy) {
    const milisegundos = fecha.getTime() - hoy.getTime();

    return Math.round(milisegundos / 86400000);
}

/* =========================================
   ALERTAS DE VENCIMIENTO
   ========================================= */

function analizarVencimientos(asignaciones) {
    const hoy = obtenerHoy();

    const vencidas = [];
    const proximas = [];

    asignaciones.forEach(asignacion => {
        if (asignacion.estado === "completado") return;

        const fechaLimite = obtenerFechaLocal(
            asignacion.fecha_limite
        );

        if (!fechaLimite) return;

        const dias = diferenciaDias(fechaLimite, hoy);

        if (dias < 0) {
            vencidas.push(asignacion);
        } else if (dias <= DIAS_PROXIMOS_VENCER) {
            proximas.push(asignacion);
        }
    });

    return {
        vencidas,
        proximas
    };
}

/* =========================================
   EVIDENCIAS INCOMPLETAS
   ========================================= */

async function consultarEvidenciasIncompletas(asignaciones) {
    const enviadas = asignaciones.filter(
        asignacion => ESTADOS_ENVIADOS.has(asignacion.estado)
    );

    const resultados = await Promise.allSettled(
        enviadas.map(async asignacion => {
            const [checklist, evidencias] = await Promise.all([
                obtenerJSON(
                    `${API_URL}/asignaciones/${asignacion.id}/checklist`
                ),
                obtenerJSON(
                    `${API_URL}/evidencias/asignacion/${asignacion.id}`
                )
            ]);

            if (
                !checklist ||
                checklist.estado !== "publicado"
            ) {
                return null;
            }

            const items = Array.isArray(checklist.items)
                ? checklist.items
                : [];

            const fotos = Array.isArray(evidencias)
                ? evidencias
                : [];

            const pendientes = items.filter(item => {
                return !fotos.some(evidencia =>
                    Number(evidencia.item_checklist_id) ===
                    Number(item.id)
                );
            });

            if (!pendientes.length) return null;

            return {
                asignacion,
                pendientes: pendientes.length
            };
        })
    );

    return resultados
        .filter(resultado => resultado.status === "fulfilled")
        .map(resultado => resultado.value)
        .filter(Boolean);
}

/* =========================================
   RENDERIZAR ALERTAS
   ========================================= */

function renderizarAlertas(datos) {
    const { vencidas, proximas, evidencias } = datos;

    dashboardAlerts.setAttribute("aria-busy", "false");

    dashboardAlerts.innerHTML = `
        <a
            href="asignaciones.html"
            class="priority-item priority-danger"
        >
            <div class="priority-icon">
                <i class="bi bi-exclamation-circle"></i>
            </div>

            <div class="priority-content">
                <strong>Asignaciones vencidas</strong>
                <span>
                    Requieren atención inmediata
                </span>
            </div>

            <div class="priority-count">
                ${vencidas.length}
            </div>

            <i class="bi bi-chevron-right priority-arrow"></i>
        </a>

        <a
            href="asignaciones.html"
            class="priority-item priority-warning"
        >
            <div class="priority-icon">
                <i class="bi bi-clock-history"></i>
            </div>

            <div class="priority-content">
                <strong>Próximas a vencer</strong>
                <span>
                    Dentro de los próximos ${DIAS_PROXIMOS_VENCER} días
                </span>
            </div>

            <div class="priority-count">
                ${proximas.length}
            </div>

            <i class="bi bi-chevron-right priority-arrow"></i>
        </a>

        <a
            href="evidencias.html"
            class="priority-item priority-info"
        >
            <div class="priority-icon">
                <i class="bi bi-images"></i>
            </div>

            <div class="priority-content">
                <strong>Evidencias incompletas</strong>
                <span>
                    ${evidencias.reduce(
                        (total, dato) => total + dato.pendientes,
                        0
                    )} requisitos fotográficos pendientes
                </span>
            </div>

            <div class="priority-count">
                ${evidencias.length}
            </div>

            <i class="bi bi-chevron-right priority-arrow"></i>
        </a>
    `;
}

function mostrarSkeletonAlertas() {
    if (!dashboardAlerts) return;

    dashboardAlerts.setAttribute("aria-busy", "true");

    dashboardAlerts.innerHTML = `
        <div class="priority-skeleton">
            <div class="skeleton-circle"></div>
            <div class="priority-skeleton-content">
                <div class="skeleton-block"></div>
                <div class="skeleton-block"></div>
            </div>
            <div class="skeleton-value"></div>
        </div>

        <div class="priority-skeleton">
            <div class="skeleton-circle"></div>
            <div class="priority-skeleton-content">
                <div class="skeleton-block"></div>
                <div class="skeleton-block"></div>
            </div>
            <div class="skeleton-value"></div>
        </div>

        <div class="priority-skeleton">
            <div class="skeleton-circle"></div>
            <div class="priority-skeleton-content">
                <div class="skeleton-block"></div>
                <div class="skeleton-block"></div>
            </div>
            <div class="skeleton-value"></div>
        </div>
    `;
}

/* =========================================
   CARGAR DASHBOARD
   ========================================= */

async function cargarAlertasDashboard() {
    mostrarSkeletonAlertas();

    try {
        const asignaciones = await obtenerJSON(
            `${API_URL}/asignaciones/`
        );

        if (!Array.isArray(asignaciones)) {
            throw new Error("Respuesta de asignaciones no válida.");
        }

        const vencimientos = analizarVencimientos(asignaciones);

        const evidencias = await consultarEvidenciasIncompletas(
            asignaciones
        );

        renderizarAlertas({
            ...vencimientos,
            evidencias
        });

    } catch (error) {
        console.error(
            "No se pudieron cargar las alertas del dashboard:",
            error
        );

        dashboardAlerts.setAttribute("aria-busy", "false");

        dashboardAlerts.innerHTML = `
            <div class="priority-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <span>
                    No se pudo consultar la información.
                </span>
            </div>
        `;
    }
}

if (dashboardAlerts) {
    cargarAlertasDashboard();
}
