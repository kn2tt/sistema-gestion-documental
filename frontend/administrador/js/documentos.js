
const API_URL = "http://127.0.0.1:8000";

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

const contenedor = document.getElementById("documentTableBody");
const buscar = document.getElementById("searchInput");
const filtroTipo = document.getElementById("typeFilter");
const filtroEstado = document.getElementById("statusFilter");
const filtroVersion = document.getElementById("versionFilter");
const btnReset = document.getElementById("resetFilters");

let documentosData = [];

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
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
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

async function obtenerJSON(url, mensaje) {
    const respuesta = await apiFetch(url);
    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(
            data.detail || `${mensaje} (HTTP ${respuesta.status}).`
        );
    }

    return data;
}

/* =========================================
   ESTADOS DEL DOCUMENTO
   ========================================= */

function datosEstadoDocumento(estado) {
    const estados = {
        en_proceso: {
            texto: "En proceso",
            clase: "status-process",
            icono: "bi-hourglass-split"
        },
        completado: {
            texto: "Completado",
            clase: "status-complete",
            icono: "bi-check-circle"
        },
        observado: {
            texto: "Observado",
            clase: "status-observed",
            icono: "bi-exclamation-circle"
        },
        pendiente: {
            texto: "Pendiente",
            clase: "status-pending",
            icono: "bi-clock"
        }
    };

    return estados[estado] || {
        texto: estado || "Sin estado",
        clase: "status-process",
        icono: "bi-file-earmark-text"
    };
}

function iconoDocumento(nombreArchivo) {
    const extension = String(nombreArchivo || "")
        .split(".")
        .pop()
        .toLowerCase();

    if (extension === "pdf") {
        return {
            icono: "bi-file-earmark-pdf",
            clase: ""
        };
    }

    if (["xls", "xlsx", "csv"].includes(extension)) {
        return {
            icono: "bi-file-earmark-spreadsheet",
            clase: "spreadsheet"
        };
    }

    if (["doc", "docx"].includes(extension)) {
        return {
            icono: "bi-file-earmark-word",
            clase: "word"
        };
    }

    return {
        icono: "bi-file-earmark",
        clase: ""
    };
}

/* =========================================
   CARGA DE DOCUMENTOS
   ========================================= */

async function cargarDocumentos() {
    contenedor.innerHTML = `
        <div class="content-card document-loading">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span>Cargando documentos...</span>
        </div>
    `;

    try {
        const documentos = await obtenerJSON(
            `${API_URL}/documentos/`,
            "No se pudieron consultar los documentos"
        );

        documentosData = Array.isArray(documentos)
            ? documentos.filter(documento => !documento.eliminado)
            : [];

        actualizarResumen();
        finalizarSkeletonResumen();
        cargarFiltros();
        aplicarFiltros();

    } catch (error) {
        console.error("Error al cargar documentos:", error);

        contenedor.innerHTML = `
            <div class="document-empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>No se pudieron cargar los documentos</strong>
                <span>${escaparHTML(error.message)}</span>
            </div>
        `;

        actualizarResumen([]);
        finalizarSkeletonResumen();
    }
}

/* =========================================
   RESUMEN
   ========================================= */

function actualizarResumen(datos = documentosData) {
    document.getElementById("totalDocumentCount").textContent =
        datos.length;

    document.getElementById("processDocumentCount").textContent =
        datos.filter(documento =>
            documento.estado === "en_proceso"
        ).length;

    document.getElementById("completeDocumentCount").textContent =
        datos.filter(documento =>
            documento.estado === "completado"
        ).length;

    document.getElementById("observedDocumentCount").textContent =
        datos.filter(documento =>
            documento.estado === "observado"
        ).length;
}

function finalizarSkeletonResumen() {
    document.querySelectorAll(".summary-card.is-loading").forEach(card => {
        card.classList.remove("is-loading");
        card.setAttribute("aria-busy", "false");
    });

    document.querySelectorAll(".summary-card .skeleton-value").forEach(elemento => {
        elemento.classList.remove("skeleton-value");
    });
}

/* =========================================
   FILTROS DINÁMICOS
   ========================================= */

function cargarFiltros() {
    const tipos = [...new Set(
        documentosData
            .map(documento => documento.tipo_documento_nombre)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    const versiones = [...new Set(
        documentosData
            .map(documento => Number(documento.version))
            .filter(version => Number.isFinite(version))
    )].sort((a, b) => a - b);

    filtroTipo.innerHTML = `
        <option value="">Todos</option>
        ${tipos.map(tipo => `
            <option value="${escaparHTML(tipo)}">
                ${escaparHTML(tipo)}
            </option>
        `).join("")}
    `;

    filtroVersion.innerHTML = `
        <option value="">Todas</option>
        ${versiones.map(version => `
            <option value="${version}">v${version}</option>
        `).join("")}
    `;
}

/* =========================================
   TARJETAS DE DOCUMENTOS
   ========================================= */

function htmlTarjeta(documento) {
    const estado = datosEstadoDocumento(documento.estado);
    const archivo = documento.nombre_archivo || "Documento sin nombre";
    const icono = iconoDocumento(archivo);
    const asignacionId = documento.asignacion_id;
    const detalleUrl =
        `detalle-documentos.html?id=${encodeURIComponent(asignacionId)}`;

    return `
        <article class="content-card document-assignment">

            <div class="document-assignment-header">

                <div class="document-assignment-main">

                    <div class="document-assignment-icon">
                        <i class="bi bi-folder2-open"></i>
                    </div>

                    <div class="document-assignment-title">

                        <div class="document-assignment-code">
                            <span class="assignment-code">
                                ASG-${String(asignacionId).padStart(4, "0")}
                            </span>

                            <span class="document-project-type">
                                ${escaparHTML(documento.tipo_documento_nombre || "Documento")}
                            </span>
                        </div>

                        <h3>
                            <a href="${detalleUrl}" title="Ver detalle de la asignación">
                                ${escaparHTML(documento.proyecto_nombre || "Proyecto sin nombre")}
                            </a>
                        </h3>

                        <p>
                            <i class="bi bi-geo-alt"></i>
                            Site:
                            <strong>${escaparHTML(documento.site_nombre || "No especificado")}</strong>
                        </p>

                    </div>
                </div>

                <span class="status-badge ${estado.clase}">
                    <i class="bi ${estado.icono}"></i>
                    ${escaparHTML(estado.texto)}
                </span>

            </div>

            <div class="document-assignment-meta">

                <div class="document-meta-item">
                    <span class="document-meta-label">Documento entregado</span>

                    <div class="document-file">
                        <div class="document-file-icon ${icono.clase}">
                            <i class="bi ${icono.icono}"></i>
                        </div>

                        <div class="document-file-info">
                            <strong title="${escaparHTML(archivo)}">
                                ${escaparHTML(archivo)}
                            </strong>
                            <span>Versión ${escaparHTML(documento.version ?? "—")}</span>
                        </div>
                    </div>
                </div>

                <div class="document-meta-item">
                    <span class="document-meta-label">Tipo de documento</span>
                    <strong>${escaparHTML(documento.tipo_documento_nombre || "No especificado")}</strong>
                </div>

                <div class="document-meta-item">
                    <span class="document-meta-label">Fecha de entrega</span>
                    <strong>${escaparHTML(fechaTexto(documento.fecha_carga))}</strong>
                </div>

                <div class="document-meta-item">
                    <span class="document-meta-label">Estado de asignación</span>
                    <strong>${escaparHTML(documento.estado_asignacion || "No disponible")}</strong>
                </div>

            </div>

            <div class="document-assignment-footer">

                <span>
                    <i class="bi bi-file-earmark-check"></i>
                    Documento registrado en la asignación
                </span>

                <div class="document-actions">
                    <a
                        href="${detalleUrl}"
                        class="btn-secondary-custom"
                        title="Ver detalle"
                    >
                        <i class="bi bi-eye"></i>
                        Ver detalle
                    </a>
                </div>

            </div>

        </article>
    `;
}

/* =========================================
   APLICAR FILTROS
   ========================================= */

function aplicarFiltros() {
    const texto = normalizar(buscar.value);
    const tipo = filtroTipo.value;
    const estado = filtroEstado.value;
    const version = filtroVersion.value;

    const filtrados = documentosData.filter(documento => {
        const contenido = normalizar([
            documento.nombre_archivo,
            documento.proyecto_nombre,
            documento.site_nombre,
            documento.tipo_documento_nombre,
            documento.asignacion_id,
            documento.estado,
            documento.version
        ].join(" "));

        return (!texto || contenido.includes(texto))
            && (!tipo || documento.tipo_documento_nombre === tipo)
            && (!estado || documento.estado === estado)
            && (!version || String(documento.version) === version);
    });

    if (!filtrados.length) {
        contenedor.innerHTML = `
            <div class="document-empty-state">
                <i class="bi bi-search"></i>
                <strong>No se encontraron documentos</strong>
                <span>No hay documentos registrados que coincidan con los filtros.</span>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = filtrados
        .map(htmlTarjeta)
        .join("");
}

/* =========================================
   EVENTOS
   ========================================= */

buscar.addEventListener("input", aplicarFiltros);
filtroTipo.addEventListener("change", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);
filtroVersion.addEventListener("change", aplicarFiltros);

btnReset.addEventListener("click", () => {
    buscar.value = "";
    filtroTipo.value = "";
    filtroEstado.value = "";
    filtroVersion.value = "";

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

document.addEventListener("DOMContentLoaded", cargarDocumentos);
