const API_URL = "http://127.0.0.1:8000";

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

const contenedor = document.getElementById("evidenceTableBody");
const buscar = document.getElementById("searchInput");
const filtroEstado = document.getElementById("statusFilter");
const filtroDocumento = document.getElementById("documentTypeFilter");
const filtroFecha = document.getElementById("dateFilter");
const btnReset = document.getElementById("btnReset");

let asignacionesData = [];

const ESTADOS_ENVIADOS = new Set([
    "pendiente_documentacion",
    "en_documentacion",
    "en_revision",
    "observado",
    "completado"
]);

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function normalizar(valor) {
    return String(valor ?? "").trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function fechaISO(valor) {
    if (!valor) return "";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return "";

    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, "0"),
        String(fecha.getDate()).padStart(2, "0")
    ].join("-");
}

function fechaTexto(valor) {
    if (!valor) return "Sin fecha";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return "Sin fecha";

    return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function obtenerTecnicos(asignacion) {
    if (!Array.isArray(asignacion.tecnicos)) return [];

    return asignacion.tecnicos.map(tecnico => ({
        nombre: `${tecnico.nombre ?? ""} ${tecnico.apellido ?? ""}`.trim()
    })).filter(tecnico => tecnico.nombre);
}

function iniciales(nombre) {
    return String(nombre ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(parte => parte[0].toUpperCase())
        .join("") || "T";
}

async function obtenerJSON(url, mensaje) {
    const respuesta = await apiFetch(url);

    let data = {};

    try {
        data = await respuesta.json();
    } catch (_) {}

    if (!respuesta.ok) {
        throw new Error(
            data.detail || `${mensaje} (HTTP ${respuesta.status}).`
        );
    }

    return data;
}

/* =========================================
   ESTADOS DE LOS REQUISITOS
   ========================================= */

function estadoRequisito(evidencias) {
    if (!evidencias.length) return "pendiente";

    if (evidencias.some(e =>
        ["observada", "observado"].includes(normalizar(e.estado))
    )) {
        return "observada";
    }

    return "completa";
}

function estadoGeneral(estados) {
    if (estados.includes("observada")) return "observada";
    if (estados.includes("pendiente")) return "pendiente";

    return "completa";
}

function datosEstadoAsignacion(estado) {
    const estados = {
        pendiente_documentacion: [
            "Pendiente de documentación",
            "status-pending",
            "bi-hourglass-split"
        ],
        en_documentacion: [
            "En documentación",
            "status-process",
            "bi-file-earmark-text"
        ],
        en_revision: [
            "En revisión",
            "status-process",
            "bi-search"
        ],
        observado: [
            "Observado",
            "status-observed",
            "bi-exclamation-circle"
        ],
        completado: [
            "Completado",
            "status-complete",
            "bi-check-circle"
        ]
    };

    const dato = estados[estado] || [
        "Enviado",
        "status-process",
        "bi-clock"
    ];

    return {
        texto: dato[0],
        clase: dato[1],
        icono: dato[2]
    };
}

/* =========================================
   CONSULTAR ASIGNACIÓN, CHECKLIST Y FOTOS
   ========================================= */

async function consultarAsignacion(asignacion) {
    const [checklist, evidencias] = await Promise.all([
        obtenerJSON(
            `${API_URL}/asignaciones/${asignacion.id}/checklist`,
            "No se pudo consultar el checklist"
        ),
        obtenerJSON(
            `${API_URL}/evidencias/asignacion/${asignacion.id}`,
            "No se pudieron consultar las evidencias"
        )
    ]);

    // Solo mostrar checklists publicados.
    if (!checklist || checklist.estado !== "publicado") {
        return null;
    }

    const items = Array.isArray(checklist.items)
        ? [...checklist.items].sort(
            (a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)
        )
        : [];

    const fotos = Array.isArray(evidencias) ? evidencias : [];

    const estados = items.map(item => {
        const evidenciasItem = fotos.filter(
            evidencia =>
                Number(evidencia.item_checklist_id) === Number(item.id)
        );

        return estadoRequisito(evidenciasItem);
    });

    const completados = estados.filter(
        estado => estado === "completa"
    ).length;

    const pendientes = estados.filter(
        estado => estado === "pendiente"
    ).length;

    const observados = estados.filter(
        estado => estado === "observada"
    ).length;

    const fechas = fotos
        .map(evidencia => evidencia.fecha_carga)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a));

    const fechaActualizacion =
        fechas[0] || asignacion.fecha_asignacion || null;

    return {
        asignacion,
        items,
        fotos,
        completados,
        pendientes,
        observados,
        estadoGeneral: estadoGeneral(estados),
        fechaActualizacion,
        fechaFiltro: fechaISO(fechaActualizacion)
    };
}

/* =========================================
   CARGAR ASIGNACIONES ENVIADAS
   ========================================= */

async function cargarEvidencias() {
    contenedor.innerHTML = `
        <div class="content-card evidence-loading">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span>Cargando asignaciones enviadas...</span>
        </div>
    `;

    try {
        const asignaciones = await obtenerJSON(
            `${API_URL}/asignaciones/`,
            "No se pudieron consultar las asignaciones"
        );

        const enviadas = asignaciones.filter(
            asignacion => ESTADOS_ENVIADOS.has(asignacion.estado)
        );

        const resultados = await Promise.all(
            enviadas.map(async asignacion => {
                try {
                    return await consultarAsignacion(asignacion);
                } catch (error) {
                    console.warn(
                        `No se pudo cargar la asignación ${asignacion.id}:`,
                        error
                    );

                    return null;
                }
            })
        );

        asignacionesData = resultados.filter(Boolean);

        actualizarResumen();
        cargarTiposDocumento();
        aplicarFiltros();

    } catch (error) {
        console.error("Error al cargar evidencias:", error);

        contenedor.innerHTML = `
            <div class="alert alert-danger mb-0">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${escaparHTML(error.message)}
            </div>
        `;

        actualizarResumen([]);
    }
}

/* =========================================
   RESUMEN
   ========================================= */

function actualizarResumen(datos = asignacionesData) {
    const total = datos.reduce(
        (suma, dato) => suma + dato.items.length, 0
    );

    const pendientes = datos.reduce(
        (suma, dato) => suma + dato.pendientes, 0
    );

    const completas = datos.reduce(
        (suma, dato) => suma + dato.completados, 0
    );

    const observadas = datos.reduce(
        (suma, dato) => suma + dato.observados, 0
    );

    document.getElementById("totalEvidenceCount").textContent = total;
    document.getElementById("pendingEvidenceCount").textContent = pendientes;
    document.getElementById("completeEvidenceCount").textContent = completas;
    document.getElementById("observedEvidenceCount").textContent = observadas;
}

/* =========================================
   FILTRO DE DOCUMENTOS
   ========================================= */

function cargarTiposDocumento() {
    const tipos = [...new Set(
        asignacionesData
            .map(dato => dato.asignacion.tipo_documento_nombre)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    filtroDocumento.innerHTML = `
        <option value="">Todos</option>
        ${tipos.map(tipo => `
            <option value="${escaparHTML(tipo)}">
                ${escaparHTML(tipo)}
            </option>
        `).join("")}
    `;
}

/* =========================================
   TARJETAS
   ========================================= */

function htmlTecnicos(tecnicos) {
    if (!tecnicos.length) {
        return `
            <div class="person-cell">
                <div class="mini-avatar">—</div>
                <span>Sin técnicos registrados</span>
            </div>
        `;
    }

    return `
        <div class="evidence-people">
            ${tecnicos.map((tecnico, index) => `
                <div class="person-cell">
                    <div class="mini-avatar ${index % 2 ? "avatar-purple" : ""}">
                        ${escaparHTML(iniciales(tecnico.nombre))}
                    </div>
                    <span>${escaparHTML(tecnico.nombre)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function htmlTarjeta(dato) {
    const asignacion = dato.asignacion;
    const estado = datosEstadoAsignacion(asignacion.estado);
    const tecnicos = obtenerTecnicos(asignacion);

    const total = dato.items.length;
    const avance = total
        ? Math.round(dato.completados / total * 100)
        : 0;

    const tipo = asignacion.tipo_documento_nombre || "Documento";

    return `
        <article
            class="content-card evidence-assignment"
            data-status="${dato.estadoGeneral}"
            data-document-type="${escaparHTML(tipo)}"
            data-date="${dato.fechaFiltro}"
        >
            <div class="evidence-assignment-header">
                <div class="evidence-assignment-main">
                    <div class="evidence-assignment-icon">
                        <i class="bi bi-folder2-open"></i>
                    </div>

                    <div class="evidence-assignment-title">
                        <div class="evidence-assignment-code">
                            <span class="assignment-code">
                                ASG-${String(asignacion.id).padStart(4, "0")}
                            </span>

                            <span class="evidence-project-type">
                                ${escaparHTML(tipo)}
                            </span>
                        </div>

                        <h3>
                            ${escaparHTML(asignacion.proyecto_nombre || "Proyecto sin nombre")}
                        </h3>

                        <p>
                            <i class="bi bi-geo-alt"></i>
                            Site:
                            <strong>
                                ${escaparHTML(asignacion.site_nombre || "No especificado")}
                            </strong>
                        </p>
                    </div>
                </div>

                <span class="status-badge ${estado.clase}">
                    <i class="bi ${estado.icono}"></i>
                    ${escaparHTML(estado.texto)}
                </span>
            </div>

            <div class="evidence-assignment-meta">
                <div class="evidence-meta-item">
                    <span class="evidence-meta-label">
                        Técnicos responsables
                    </span>

                    ${htmlTecnicos(tecnicos)}
                </div>

                <div class="evidence-meta-item">
                    <span class="evidence-meta-label">
                        Tipo de documento
                    </span>

                    <strong>${escaparHTML(tipo)}</strong>
                </div>

                <div class="evidence-meta-item evidence-progress">
                    <span class="evidence-meta-label">
                        Progreso fotográfico
                    </span>

                    <strong>
                        ${dato.completados} de ${total} requisitos completados
                    </strong>

                    <div class="evidence-progress-track">
                        <div
                            class="evidence-progress-fill ${dato.observados ? "observed-fill" : ""}"
                            style="width:${avance}%"
                        ></div>
                    </div>

                    <span class="evidence-progress-caption">
                        ${avance}% completado
                        ${dato.observados ? ` · ${dato.observados} observado(s)` : ""}
                    </span>
                </div>
            </div>

            <div class="evidence-assignment-footer">
                <span>
                    <i class="bi bi-calendar3"></i>
                    Última actualización:
                    ${escaparHTML(fechaTexto(dato.fechaActualizacion))}
                </span>

                <a
                    href="detalle-evidencias.html?id=${encodeURIComponent(asignacion.id)}"
                    class="btn-secondary-custom"
                >
                    <i class="bi bi-eye"></i>
                    Ver evidencias
                </a>
            </div>
        </article>
    `;
}

/* =========================================
   FILTROS
   ========================================= */

function fechaCoincide(fecha, filtro) {
    if (!filtro) return true;
    if (!fecha) return false;

    const valor = new Date(`${fecha}T00:00:00`);
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    if (filtro === "today") {
        return valor.getTime() === hoy.getTime();
    }

    if (filtro === "week") {
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);

        return valor >= inicio && valor <= hoy;
    }

    if (filtro === "month") {
        return valor.getMonth() === hoy.getMonth()
            && valor.getFullYear() === hoy.getFullYear();
    }

    return true;
}

function aplicarFiltros() {
    const texto = normalizar(buscar.value);
    const estado = filtroEstado.value;
    const tipo = filtroDocumento.value;
    const fecha = filtroFecha.value;

    const filtradas = asignacionesData.filter(dato => {
        const asignacion = dato.asignacion;

        const contenido = normalizar([
            asignacion.proyecto_nombre,
            asignacion.site_nombre,
            asignacion.tipo_documento_nombre,
            ...obtenerTecnicos(asignacion).map(t => t.nombre),
            ...dato.items.map(i => i.titulo || i.requisito_nombre)
        ].join(" "));

        return (!texto || contenido.includes(texto))
            && (!estado || dato.estadoGeneral === estado)
            && (!tipo || asignacion.tipo_documento_nombre === tipo)
            && fechaCoincide(dato.fechaFiltro, fecha);
    });

    if (!filtradas.length) {
        contenedor.innerHTML = `
            <div class="evidence-empty-state">
                <i class="bi bi-search"></i>
                <strong>No se encontraron asignaciones</strong>
                <span>No hay asignaciones enviadas que coincidan con los filtros.</span>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = filtradas.map(htmlTarjeta).join("");
}

/* =========================================
   EVENTOS
   ========================================= */

buscar.addEventListener("input", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);
filtroDocumento.addEventListener("change", aplicarFiltros);
filtroFecha.addEventListener("change", aplicarFiltros);

btnReset.addEventListener("click", () => {
    buscar.value = "";
    filtroEstado.value = "";
    filtroDocumento.value = "";
    filtroFecha.value = "";

    aplicarFiltros();
});

/* =========================================
   SIDEBAR MOBILE
   ========================================= */

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

mobileMenuButton?.addEventListener("click", () => {
    sidebar?.classList.add("show");
    sidebarOverlay?.classList.add("show");
});

sidebarOverlay?.addEventListener("click", () => {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");
});

document.querySelectorAll(".sidebar .nav-item").forEach(item => {
    item.addEventListener("click", () => {
        sidebar?.classList.remove("show");
        sidebarOverlay?.classList.remove("show");
    });
});

document.addEventListener("DOMContentLoaded", cargarEvidencias);