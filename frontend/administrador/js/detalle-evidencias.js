/* =========================================
   CONFIGURACIÓN
   ========================================= */

const API_URL = "http://127.0.0.1:8000";

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");

let evidenciasData = [];
let asignacionData = null;
let urlEvidenciaActual = null;
let nombreEvidenciaActual = "evidencia";


/* =========================================
   ELEMENTOS
   ========================================= */

const checklistContainer = document.getElementById(
    "checklistContainer"
);

const checklistEmpty = document.getElementById(
    "checklistEmpty"
);

const evidenceModalElement = document.getElementById(
    "evidenceModal"
);

const evidenceModal = bootstrap.Modal.getOrCreateInstance(
    evidenceModalElement
);


/* =========================================
   UTILIDADES
   ========================================= */

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}


function mostrarTexto(id, valor, alternativa = "No disponible") {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.textContent =
        valor !== null && valor !== undefined && valor !== ""
            ? valor
            : alternativa;
}


function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const valor = String(fecha);
    const fechaLocal = new Date(valor);

    if (Number.isNaN(fechaLocal.getTime())) {
        return valor;
    }

    return fechaLocal.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function nombreTecnicoPorId(usuarioId) {
    if (!asignacionData || !Array.isArray(asignacionData.tecnicos)) {
        return "No disponible";
    }

    const tecnico = asignacionData.tecnicos.find(
        persona => Number(persona.id) === Number(usuarioId)
    );

    if (!tecnico) return "No disponible";

    return `${tecnico.nombre ?? ""} ${tecnico.apellido ?? ""}`.trim();
}


function mostrarError(mensaje) {
    let alerta = document.getElementById("detalleError");

    if (!alerta) {
        alerta = document.createElement("div");
        alerta.id = "detalleError";
        alerta.className = "alert alert-danger";
        alerta.setAttribute("role", "alert");

        document.querySelector(".page-content").prepend(alerta);
    }

    alerta.textContent = mensaje;
    alerta.classList.remove("d-none");
}


/* =========================================
   ESTADOS
   ========================================= */

function obtenerEstadoAsignacion(estado) {
    const estados = {
        pendiente: {
            texto: "Pendiente",
            clase: "status-pending"
        },
        en_proceso: {
            texto: "En proceso",
            clase: "status-process"
        },
        pendiente_documentacion: {
            texto: "Pendiente de documentación",
            clase: "status-pending"
        },
        en_documentacion: {
            texto: "En documentación",
            clase: "status-process"
        },
        en_revision: {
            texto: "En revisión",
            clase: "status-process"
        },
        observado: {
            texto: "Observado",
            clase: "status-observed"
        },
        completado: {
            texto: "Completado",
            clase: "status-complete"
        }
    };

    return estados[estado] ?? {
        texto: estado || "Sin estado",
        clase: "status-process"
    };
}


function obtenerEstadoRequisito(evidencias) {
    if (!evidencias.length) {
        return "pendiente";
    }

    if (evidencias.some(evidencia => evidencia.estado === "observada")) {
        return "observada";
    }

    return "completa";
}


function obtenerDatosEstado(estado) {
    const estados = {
        completa: {
            texto: "Completada",
            clase: "complete",
            icono: "bi-check-lg"
        },
        pendiente: {
            texto: "Pendiente",
            clase: "pending",
            icono: "bi-hourglass"
        },
        observada: {
            texto: "Observada",
            clase: "observed",
            icono: "bi-exclamation-lg"
        }
    };

    return estados[estado] ?? estados.pendiente;
}


/* =========================================
   INFORMACIÓN DE ASIGNACIÓN
   ========================================= */

function renderizarAsignacion(asignacion) {
    mostrarTexto(
        "tituloAsignacion",
        asignacion.proyecto_nombre,
        "Detalle de evidencias"
    );

    mostrarTexto(
        "subtituloAsignacion",
        `${asignacion.tipo_documento_nombre || "Documento"} · Asignación #${asignacion.id}`
    );

    mostrarTexto("infoProyecto", asignacion.proyecto_nombre);
    mostrarTexto("infoSite", asignacion.site_nombre);
    mostrarTexto("infoDocumento", asignacion.tipo_documento_nombre);

    const tecnicos = Array.isArray(asignacion.tecnicos)
        ? asignacion.tecnicos.map(tecnico => {
            return `${tecnico.nombre ?? ""} ${tecnico.apellido ?? ""}`.trim();
        })
        : [];

    mostrarTexto(
        "infoTecnicos",
        tecnicos.join(", "),
        "Sin técnicos registrados"
    );

    const estado = obtenerEstadoAsignacion(asignacion.estado);
    const badge = document.getElementById("estadoAsignacion");

    badge.textContent = estado.texto;
    badge.className = `status-badge ${estado.clase}`;
    badge.hidden = false;
}


/* =========================================
   RESUMEN DEL CHECKLIST
   ========================================= */

function actualizarResumenChecklist(items) {
    let pendientes = 0;
    let completados = 0;
    let observados = 0;

    items.forEach(item => {
        const evidencias = evidenciasData.filter(
            evidencia =>
                Number(evidencia.item_checklist_id) === Number(item.id)
        );

        const estado = obtenerEstadoRequisito(evidencias);

        if (estado === "pendiente") pendientes++;
        if (estado === "completa") completados++;
        if (estado === "observada") observados++;
    });

    mostrarTexto("totalRequisitos", items.length);
    mostrarTexto("totalPendientes", pendientes);
    mostrarTexto("totalCompletados", completados);
    mostrarTexto("totalObservados", observados);
}


/* =========================================
   RENDERIZAR CHECKLIST
   ========================================= */

function renderizarChecklist(checklist) {
    if (!checklist || !Array.isArray(checklist.items)) {
        checklistContainer.innerHTML = "";
        checklistContainer.setAttribute("aria-busy", "false");
        checklistEmpty.hidden = false;

        mostrarTexto(
            "estadoChecklist",
            "Sin checklist publicado"
        );

        return;
    }

    const items = [...checklist.items].sort(
        (a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)
    );

    if (!items.length) {
        checklistContainer.innerHTML = "";
        checklistContainer.setAttribute("aria-busy", "false");
        checklistEmpty.hidden = false;
        return;
    }

    checklistEmpty.hidden = true;

    const grupos = new Map();

    items.forEach(item => {
        const nombreAlcance = item.alcance_nombre || "Otros requisitos";

        if (!grupos.has(nombreAlcance)) {
            grupos.set(nombreAlcance, []);
        }

        grupos.get(nombreAlcance).push(item);
    });

    let html = "";

    grupos.forEach((itemsGrupo, nombreAlcance) => {
        html += `
            <div class="checklist-group">

                <div class="checklist-group-title">
                    <i class="bi bi-folder2-open"></i>
                    ${escaparHTML(nombreAlcance)}
                </div>
        `;

        itemsGrupo.forEach(item => {
            const evidencias = evidenciasData.filter(
                evidencia =>
                    Number(evidencia.item_checklist_id) === Number(item.id)
            );

            const estado = obtenerEstadoRequisito(evidencias);
            const datosEstado = obtenerDatosEstado(estado);

            const descripcion =
                item.descripcion ||
                item.requisito_descripcion ||
                "Sin descripción adicional";

            const archivosHTML = evidencias.map(evidencia => `
                <span class="evidence-file">
                    <i class="bi bi-image"></i>
                    ${escaparHTML(evidencia.nombre_archivo || "Fotografía")}
                    <span>· ${escaparHTML(formatearFecha(evidencia.fecha_carga))}</span>
                </span>
            `).join("");

            const botonesHTML = evidencias.length
                ? evidencias.map((evidencia, index) => `
                    <button
                        type="button"
                        class="evidence-photo-button"
                        data-evidence-id="${evidencia.id}"
                        title="Consultar fotografía ${index + 1}"
                        aria-label="Consultar fotografía ${index + 1}"
                    >
                        <i class="bi bi-eye"></i>
                    </button>
                `).join("")
                : `
                    <button
                        type="button"
                        class="evidence-photo-button"
                        disabled
                        title="No hay fotografía disponible"
                    >
                        <i class="bi bi-image"></i>
                    </button>
                `;

            html += `
                <div class="checklist-item">

                    <div class="checklist-item-icon ${datosEstado.clase}">
                        <i class="bi ${datosEstado.icono}"></i>
                    </div>

                    <div class="checklist-item-info">

                        <strong>
                            ${escaparHTML(item.titulo || item.requisito_nombre)}
                            ${item.obligatorio ? '<span class="text-danger">*</span>' : ""}
                        </strong>

                        <span>
                            ${escaparHTML(descripcion)}
                        </span>

                        ${
                            evidencias.length
                                ? `<div class="evidence-files">${archivosHTML}</div>`
                                : ""
                        }

                    </div>

                    <div class="checklist-item-actions">

                        <span class="status-badge status-${datosEstado.clase}">
                            ${datosEstado.texto}
                        </span>

                        ${botonesHTML}

                    </div>

                </div>
            `;
        });

        html += "</div>";
    });

    checklistContainer.innerHTML = html;
    checklistContainer.setAttribute("aria-busy", "false");

    actualizarResumenChecklist(items);

    mostrarTexto(
        "estadoChecklist",
        checklist.estado === "publicado" ? "Publicado" : checklist.estado
    );
}


/* =========================================
   CONSULTAR FOTOGRAFÍA
   ========================================= */

async function abrirFotografia(evidenceId) {
    const evidencia = evidenciasData.find(
        item => Number(item.id) === Number(evidenceId)
    );

    if (!evidencia) {
        mostrarError("No se encontró la evidencia seleccionada.");
        return;
    }

    urlEvidenciaActual = null;
    nombreEvidenciaActual = evidencia.nombre_archivo || "evidencia";

    const modalImage = document.getElementById("modalImage");
    const modalPlaceholder = document.getElementById("modalPlaceholder");
    const downloadButton = document.getElementById("downloadEvidence");

    modalImage.hidden = true;
    modalImage.removeAttribute("src");

    modalPlaceholder.hidden = false;
    modalPlaceholder.innerHTML = `
        <div class="spinner-border" role="status"></div>
        <span>Cargando fotografía...</span>
    `;

    downloadButton.disabled = true;

    const item = document.querySelector(
        `.evidence-photo-button[data-evidence-id="${evidenceId}"]`
    );

    const checklistItem = item?.closest(".checklist-item");
    const requirementName = checklistItem
        ?.querySelector(".checklist-item-info strong")
        ?.textContent.trim();

    mostrarTexto("modalTitle", requirementName || "Fotografía");
    mostrarTexto("modalProject", asignacionData.proyecto_nombre);
    mostrarTexto("modalSite", asignacionData.site_nombre);
    mostrarTexto(
        "modalTechnician",
        nombreTecnicoPorId(evidencia.usuario_id)
    );
    mostrarTexto("modalDate", formatearFecha(evidencia.fecha_carga));

    evidenceModal.show();

    try {
        const response = await apiFetch(
            `${API_URL}/evidencias/${evidenceId}/url`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "No se pudo obtener la fotografía."
            );
        }

        if (!data.url) {
            throw new Error("El servidor no devolvió la URL de la fotografía.");
        }

        urlEvidenciaActual = data.url;

        modalImage.onload = function () {
            modalPlaceholder.hidden = true;
            modalImage.hidden = false;
        };

        modalImage.onerror = function () {
            modalImage.hidden = true;
            modalPlaceholder.hidden = false;
            modalPlaceholder.innerHTML = `
                <i class="bi bi-image-alt fs-2"></i>
                <span>No se pudo visualizar la fotografía.</span>
            `;
        };

        modalImage.src = data.url;
        downloadButton.disabled = false;

    } catch (error) {
        modalPlaceholder.hidden = false;
        modalPlaceholder.innerHTML = `
            <i class="bi bi-exclamation-circle fs-2"></i>
            <span>${escaparHTML(error.message)}</span>
        `;
    }
}


/* =========================================
   DESCARGAR FOTOGRAFÍA
   ========================================= */

document
    .getElementById("downloadEvidence")
    .addEventListener("click", function () {
        if (!urlEvidenciaActual) return;

        const enlace = document.createElement("a");

        enlace.href = urlEvidenciaActual;
        enlace.download = nombreEvidenciaActual;
        enlace.target = "_blank";
        enlace.rel = "noopener";

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
    });


/* =========================================
   EVENTOS DEL CHECKLIST
   ========================================= */

checklistContainer.addEventListener("click", function (event) {
    const button = event.target.closest(
        ".evidence-photo-button[data-evidence-id]"
    );

    if (!button) return;

    abrirFotografia(button.dataset.evidenceId);
});


/* =========================================
   SIDEBAR MOBILE
   ========================================= */

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

mobileMenuButton?.addEventListener("click", function () {
    sidebar?.classList.add("show");
    sidebarOverlay?.classList.add("show");
});

sidebarOverlay?.addEventListener("click", function () {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");
});


/* =========================================
   CARGAR INFORMACIÓN
   ========================================= */

async function cargarDetalleEvidencias() {
    if (!assignmentId || !/^\d+$/.test(assignmentId)) {
        checklistContainer.innerHTML = "";
        checklistContainer.setAttribute("aria-busy", "false");

        mostrarError(
            "No se recibió un identificador válido de asignación."
        );

        return;
    }

    try {
        const [
            assignmentResponse,
            checklistResponse,
            evidenceResponse
        ] = await Promise.all([
            apiFetch(`${API_URL}/asignaciones/${assignmentId}`),
            apiFetch(`${API_URL}/asignaciones/${assignmentId}/checklist`),
            apiFetch(`${API_URL}/evidencias/asignacion/${assignmentId}`)
        ]);

        const assignmentDataResponse = await assignmentResponse.json();

        if (!assignmentResponse.ok) {
            throw new Error(
                assignmentDataResponse.detail ||
                "No se pudo consultar la asignación."
            );
        }

        if (!evidenceResponse.ok) {
            const error = await evidenceResponse.json();

            throw new Error(
                error.detail || "No se pudieron consultar las evidencias."
            );
        }

        asignacionData = assignmentDataResponse;
        evidenciasData = await evidenceResponse.json();

        renderizarAsignacion(asignacionData);

        if (!checklistResponse.ok) {
            renderizarChecklist(null);
            return;
        }

        const checklist = await checklistResponse.json();

        renderizarChecklist(checklist);

    } catch (error) {
        checklistContainer.innerHTML = "";
        checklistContainer.setAttribute("aria-busy", "false");

        mostrarError(error.message);
    }
}


/* =========================================
   INICIALIZACIÓN
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    cargarDetalleEvidencias();
});