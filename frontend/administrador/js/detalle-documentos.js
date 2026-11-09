const API_URL = "http://127.0.0.1:8000";

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");

let documentoActual = null;

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

    const fechaLocal = new Date(fecha);

    if (Number.isNaN(fechaLocal.getTime())) {
        return String(fecha);
    }

    return fechaLocal.toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function obtenerJSON(url, mensaje) {
    const respuesta = await apiFetch(url);
    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        const error = new Error(
            data.detail || `${mensaje} (HTTP ${respuesta.status}).`
        );

        error.status = respuesta.status;
        throw error;
    }

    return data;
}

async function obtenerArchivoRespuesta(respuesta) {
    if (respuesta.status === 401 || respuesta.status === 403) {
        window.location.replace("../index.html");
        throw new Error(
            "Tu sesión no está autorizada para descargar este archivo."
        );
    }

    if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));

        throw new Error(
            datos.detail ||
            datos.message ||
            `No se pudo descargar el archivo (HTTP ${respuesta.status}).`
        );
    }

    return respuesta.blob();
}

/* =========================================
   ESTADO DE LA ASIGNACIÓN
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

    return estados[estado] || {
        texto: estado || "Sin estado",
        clase: "status-process"
    };
}

function actualizarEstadoAsignacion(estado) {
    const badge = document.getElementById("estadoAsignacion");
    if (!badge) return;

    const datos = obtenerEstadoAsignacion(estado);

    badge.className = `status-badge ${datos.clase}`;
    badge.textContent = datos.texto;
    badge.hidden = false;
}

/* =========================================
   INFORMACIÓN DE LA ASIGNACIÓN
   ========================================= */

function renderizarAsignacion(asignacion) {
    mostrarTexto(
        "tituloAsignacion",
        asignacion.proyecto_nombre,
        "Detalle de la asignación"
    );

    mostrarTexto(
        "subtituloAsignacion",
        `Detalle de la asignación #ASG-${String(asignacion.id).padStart(4, "0")}`
    );

    document.title =
        `ASG-${String(asignacion.id).padStart(4, "0")} | Gestión Documental`;

    mostrarTexto("infoProyecto", asignacion.proyecto_nombre);
    mostrarTexto("infoSite", asignacion.site_nombre);
    mostrarTexto("infoTipoDocumento", asignacion.tipo_documento_nombre);

    actualizarEstadoAsignacion(asignacion.estado);

    const contenedorTecnicos = document.getElementById("infoTecnicos");

    const tecnicos = Array.isArray(asignacion.tecnicos)
        ? asignacion.tecnicos
        : [];

    if (!tecnicos.length) {
        contenedorTecnicos.innerHTML = `
            <span class="scope-empty">
                No hay técnicos asociados
            </span>
        `;
        return;
    }

    contenedorTecnicos.innerHTML = tecnicos.map((tecnico, indice) => {
        const nombre =
            `${tecnico.nombre ?? ""} ${tecnico.apellido ?? ""}`.trim();

        return `
            <div class="scope-item">
                <span class="scope-number">${indice + 1}</span>
                <div class="scope-text">
                    <strong>${escaparHTML(nombre || "Técnico sin nombre")}</strong>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================================
   ARCHIVO ENTREGADO
   ========================================= */

function obtenerIconoArchivo(nombreArchivo) {
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

function renderizarDocumento(documento) {
    const loading = document.getElementById("documentLoading");
    const contenido = document.getElementById("documentFileContent");
    const vacio = document.getElementById("documentEmptyState");

    loading.hidden = true;

    if (!documento || !documento.id) {
        contenido.hidden = true;
        vacio.hidden = false;
        return;
    }

    documentoActual = documento;

    const archivo = documento.nombre_archivo || "Documento sin nombre";
    const icono = obtenerIconoArchivo(archivo);

    const iconoContenedor = document.getElementById("documentFileIcon");

    iconoContenedor.className =
        `document-file-icon ${icono.clase}`;

    iconoContenedor.innerHTML =
        `<i class="bi ${icono.icono}"></i>`;

    mostrarTexto("documentFileName", archivo);
    mostrarTexto(
        "documentFileDate",
        `Última carga: ${formatearFecha(documento.fecha_carga)}`
    );

    mostrarTexto(
        "documentVersion",
        `Versión ${documento.version ?? "—"}`
    );

    const botonDescarga = document.getElementById(
        "btnDescargarDocumento"
    );

    botonDescarga.disabled = !documento.archivo_disponible;

    botonDescarga.title = documento.archivo_disponible
        ? "Descargar documento"
        : "El archivo no está disponible en el almacenamiento";

    if (!documento.archivo_disponible) {
        botonDescarga.innerHTML = `
            <i class="bi bi-exclamation-circle"></i>
            Archivo no disponible
        `;
    }

    contenido.hidden = false;
    vacio.hidden = true;
}

/* =========================================
   CHECKLIST DOCUMENTAL
   ========================================= */

function renderizarChecklist(checklist) {
    const loading = document.getElementById("checklistLoading");
    const vacio = document.getElementById("checklistEmptyState");
    const contenedor = document.getElementById("checklistItems");

    loading.hidden = true;

    const items = Array.isArray(checklist?.items)
        ? [...checklist.items].sort(
            (a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)
        )
        : [];

    if (!items.length) {
        contenedor.hidden = true;
        vacio.hidden = false;
        actualizarResumenChecklist([]);
        return;
    }

    vacio.hidden = true;
    contenedor.hidden = false;

    const grupos = new Map();

    items.forEach(item => {
        const encabezado =
            item.encabezado || "Otros requerimientos";

        if (!grupos.has(encabezado)) {
            grupos.set(encabezado, []);
        }

        grupos.get(encabezado).push(item);
    });

    contenedor.innerHTML = [...grupos.entries()]
        .map(([encabezado, itemsGrupo]) => `
            <section class="checklist-group">

                <h3 class="checklist-group-title">
                    <i class="bi bi-folder2"></i>
                    ${escaparHTML(encabezado)}
                </h3>

                ${itemsGrupo.map(item => {
                    const completado = Boolean(item.completado);

                    return `
                        <div class="checklist-item">

                            <div class="checklist-item-icon ${completado ? "completed" : "pending"}">
                                <i class="bi ${completado ? "bi-check-lg" : "bi-clock"}"></i>
                            </div>

                            <div class="checklist-item-content">
                                <strong>
                                    ${escaparHTML(item.titulo || "Ítem sin título")}

                                    ${item.obligatorio
                                        ? '<span class="required-label">Obligatorio</span>'
                                        : ""}
                                </strong>

                                ${item.descripcion
                                    ? `<p>${escaparHTML(item.descripcion)}</p>`
                                    : ""}
                            </div>

                            <span class="checklist-item-status ${completado ? "completed" : "pending"}">
                                <i class="bi ${completado ? "bi-check-circle-fill" : "bi-hourglass-split"}"></i>
                                ${completado ? "Completado" : "Pendiente"}
                            </span>

                        </div>
                    `;
                }).join("")}

            </section>
        `).join("");

    actualizarResumenChecklist(items);
}

function actualizarResumenChecklist(items) {
    const total = items.length;

    const completados = items.filter(
        item => Boolean(item.completado)
    ).length;

    const pendientes = total - completados;

    const progreso = total
        ? Math.round((completados / total) * 100)
        : 0;

    mostrarTexto("totalItems", total);
    mostrarTexto("totalPendientes", pendientes);
    mostrarTexto("totalCompletados", completados);

    mostrarTexto("checklistProgressPercentage", `${progreso}%`);

    mostrarTexto(
        "checklistCompletedCount",
        `${completados} de ${total} ${total === 1 ? "ítem completado" : "ítems completados"}`
    );

    mostrarTexto(
        "checklistPendingCount",
        `${pendientes} pendientes`
    );

    const barra = document.getElementById("checklistProgressBar");
    const contenedor = document.getElementById(
        "checklistProgressContainer"
    );

    barra.style.width = `${progreso}%`;
    contenedor.setAttribute("aria-valuenow", progreso);
}


function obtenerNombreArchivoRespuesta(respuesta) {
    const disposicion = respuesta.headers.get("Content-Disposition");

    if (!disposicion) return null;

    const nombreCodificado = disposicion.match(
        /filename\*=UTF-8''([^;]+)/i
    );

    if (nombreCodificado) {
        try {
            return decodeURIComponent(nombreCodificado[1]);
        } catch {
            return nombreCodificado[1];
        }
    }

    const nombreNormal = disposicion.match(
        /filename="?([^"]+)"?/i
    );

    return nombreNormal ? nombreNormal[1] : null;
}

function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo || "documento";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


/* =========================================
   DESCARGAR DOCUMENTO
   ========================================= */
async function descargarDocumento() {
    if (!documentoActual?.id || !documentoActual.archivo_disponible) {
        return;
    }

    const boton = document.getElementById("btnDescargarDocumento");
    const contenidoOriginal = boton.innerHTML;

    if (boton.disabled) return;

    boton.disabled = true;
    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Descargando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/${encodeURIComponent(documentoActual.id)}/descargar`
        );

        const blob = await obtenerArchivoRespuesta(respuesta);

        descargarBlob(
            blob,
            obtenerNombreArchivoRespuesta(respuesta) ||
            documentoActual.nombre_archivo ||
            "documento"
        );

        sessionStorage.setItem(
            `documentoDescargadoAsignacion_${assignmentId}`,
            `${documentoActual.id}:${documentoActual.version}`
        );

        mostrarNotificacion(
            "El documento se descargó correctamente.",
            "success"
        );

    } catch (error) {
        mostrarNotificacion(
            error.message || "No se pudo descargar el documento.",
            "error"
        );

    } finally {
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}


/* =========================================
   CARGA DEL DETALLE
   ========================================= */

async function cargarDetalleDocumento() {
    if (!assignmentId || !/^\d+$/.test(assignmentId)) {
        mostrarNotificacion(
            "No se recibió un identificador de asignación válido.",
            "error"
        );

        document.getElementById("documentLoading").hidden = true;
        document.getElementById("checklistLoading").hidden = true;
        document.getElementById("documentEmptyState").hidden = false;
        document.getElementById("checklistEmptyState").hidden = false;

        return;
    }

    try {
        const [asignacion, documento] = await Promise.all([
            obtenerJSON(
                `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}`,
                "No se pudo consultar la asignación"
            ),
            obtenerJSON(
                `${API_URL}/documentos/asignacion/${encodeURIComponent(assignmentId)}`,
                "No se pudo consultar el documento"
            )
        ]);

        renderizarAsignacion(asignacion);
        renderizarDocumento(documento);

        try {
            const checklist = await obtenerJSON(
                `${API_URL}/documentos/asignacion/${encodeURIComponent(assignmentId)}/checklist-documental`,
                "No se pudo consultar el checklist documental"
            );

            renderizarChecklist(checklist);

        } catch (errorChecklist) {
            document.getElementById("checklistLoading").hidden = true;

            if (errorChecklist.status === 404) {
                renderizarChecklist(null);
            } else {
                console.error(
                    "Error al consultar el checklist documental:",
                    errorChecklist
                );

                document.getElementById("checklistEmptyState").hidden = false;

                mostrarNotificacion(
                    errorChecklist.message || "No se pudo consultar el checklist documental.",
                    "error"
                );
            }
        }

    } catch (error) {
        console.error("Error al cargar el detalle del documento:", error);

        document.getElementById("documentLoading").hidden = true;
        document.getElementById("checklistLoading").hidden = true;
        document.getElementById("documentEmptyState").hidden = false;
        document.getElementById("checklistEmptyState").hidden = false;

        mostrarNotificacion(
            error.message || "No se pudo cargar el detalle del documento.",
            "error"
        );
    }
}

/* =========================================
   EVENTOS
   ========================================= */

document.getElementById("btnDescargarDocumento")
    ?.addEventListener("click", descargarDocumento);

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

document.addEventListener("DOMContentLoaded", cargarDetalleDocumento);
