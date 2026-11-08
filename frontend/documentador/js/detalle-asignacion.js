/* =========================================
   CONFIGURACIÓN
   ========================================= */

const API_URL = "http://127.0.0.1:8000";

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");

let asignacionActual = null;
let documentoActual = null;
let archivoSeleccionado = null;
let cargandoDocumento = false;

const estadosAsignacion = {
    pendiente: {
        texto: "Pendiente",
        clase: "status-pending"
    },
    en_proceso: {
        texto: "En proceso",
        clase: "status-progress"
    },
    pendiente_documentacion: {
        texto: "Pendiente de documentación",
        clase: "status-documentation"
    },
    en_documentacion: {
        texto: "En documentación",
        clase: "status-documentation"
    },
    en_revision: {
        texto: "En revisión",
        clase: "status-review"
    },
    observado: {
        texto: "Observado",
        clase: "status-observed"
    },
    completado: {
        texto: "Completado",
        clase: "status-completed"
    }
};


/* =========================================
   ELEMENTOS
   ========================================= */

const detalleContenido = document.getElementById("detalleContenido");
const detalleError = document.getElementById("detalleError");
const detalleErrorMensaje = document.getElementById("detalleErrorMensaje");

const documentFileInput = document.getElementById("documentFileInput");
const btnCargarDocumento = document.getElementById("btnCargarDocumento");
const btnConfirmarReemplazo = document.getElementById("btnConfirmarReemplazo");

const reemplazoModalElemento = document.getElementById(
    "confirmarReemplazoModal"
);

const reemplazoModal = reemplazoModalElemento
    ? new bootstrap.Modal(reemplazoModalElemento)
    : null;


/* =========================================
   API
   ========================================= */

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

async function obtenerRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => ({}));

    if (respuesta.status === 401 || respuesta.status === 403) {
        window.location.replace("../index.html");
        throw new Error("Tu sesión no está autorizada para consultar esta información.");
    }

    if (!respuesta.ok) {
        throw new Error(
            datos.detail ||
            datos.message ||
            `No se pudo completar la solicitud (HTTP ${respuesta.status}).`
        );
    }

    return datos;
}

async function obtenerArchivoRespuesta(respuesta) {
    if (respuesta.status === 401 || respuesta.status === 403) {
        window.location.replace("../index.html");
        throw new Error("Tu sesión no está autorizada para descargar este archivo.");
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

function mostrarTexto(elemento, valor, alternativa = "No disponible") {
    if (!elemento) return;

    elemento.textContent =
        valor !== null && valor !== undefined && valor !== ""
            ? valor
            : alternativa;
}

function obtenerIniciales(nombre, apellido = "") {
    return `${nombre || ""} ${apellido || ""}`
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(palabra => palabra.charAt(0).toUpperCase())
        .join("") || "D";
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = String(fecha).substring(0, 10).split("-");

    if (partes.length !== 3) return fecha;

    const [anio, mes, dia] = partes;

    const fechaLocal = new Date(
        Number(anio),
        Number(mes) - 1,
        Number(dia)
    );

    if (Number.isNaN(fechaLocal.getTime())) return fecha;

    return fechaLocal.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatearFechaHora(fecha) {
    if (!fecha) return "Sin fecha";

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return formatearFecha(fecha);
    }

    return valor.toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function asignacionLabel(id) {
    return `ASG-${String(id).padStart(4, "0")}`;
}

function mostrarNotificacion(mensaje, tipo = "info") {
    if (typeof window.mostrarNotificacion === "function") {
        window.mostrarNotificacion(mensaje, tipo);
    }
}

function mostrarErrorDetalle(mensaje) {
    detalleError.hidden = false;
    detalleErrorMensaje.textContent = mensaje;
    detalleContenido.hidden = true;
}


/* =========================================
   USUARIO Y SESIÓN
   ========================================= */

async function cargarUsuario() {
    const respuesta = await apiFetch(`${API_URL}/auth/me`);
    const usuario = await obtenerRespuesta(respuesta);

    if (usuario.rol?.toLowerCase() !== "documentador") {
        window.location.replace("../index.html");
        return false;
    }

    const nombre = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim()
        || "Documentador";

    const iniciales = obtenerIniciales(
        usuario.nombre,
        usuario.apellido
    );

    document.getElementById("sidebarUserName").textContent = nombre;
    document.getElementById("sidebarUserEmail").textContent =
        usuario.correo || "Usuario del sistema";

    document.getElementById("sidebarUserAvatar").textContent = iniciales;
    document.getElementById("topbarUserName").textContent = nombre;
    document.getElementById("topbarUserAvatar").textContent = iniciales;

    return true;
}


/* =========================================
   ESTADO DE LA ASIGNACIÓN
   ========================================= */

function actualizarEstado(estado) {
    const badge = document.getElementById("estadoAsignacion");

    const configuracion = estadosAsignacion[estado] || {
        texto: estado || "Sin estado",
        clase: "status-pending"
    };

    badge.className = `status-badge ${configuracion.clase}`;
    badge.replaceChildren();

    const indicador = document.createElement("span");

    badge.append(
        indicador,
        document.createTextNode(configuracion.texto)
    );

    badge.hidden = false;

    const pasos = Array.from(
        document.querySelectorAll(".workflow-step")
    );

    const indiceActual = pasos.findIndex(
        paso => paso.dataset.status === estado
    );

    const iconos = {
        pendiente: "bi-clipboard-check",
        en_proceso: "bi-tools",
        pendiente_documentacion: "bi-file-earmark",
        en_documentacion: "bi-pencil-square",
        en_revision: "bi-search",
        observado: "bi-exclamation-triangle",
        completado: "bi-flag"
    };

    pasos.forEach((paso, indice) => {
        const esActual = paso.dataset.status === estado;

        const esAnterior =
            indiceActual > 0 &&
            indice < indiceActual &&
            estado !== "pendiente";

        paso.classList.toggle("active", esActual);
        paso.classList.toggle("completed", esAnterior);

        const marcador = paso.querySelector(".workflow-marker");

        if (!marcador) return;

        marcador.innerHTML = `<i class="bi ${
            esAnterior
                ? "bi-check-lg"
                : (iconos[paso.dataset.status] || "bi-circle")
        }"></i>`;
    });
}


/* =========================================
   INFORMACIÓN DE LA ASIGNACIÓN
   ========================================= */

function actualizarEncabezado(asignacion) {
    mostrarTexto(
        document.getElementById("tituloAsignacion"),
        asignacion.proyecto_nombre,
        "Detalle de asignación"
    );

    mostrarTexto(
        document.getElementById("subtituloAsignacion"),
        `Detalle de la asignación #${asignacionLabel(asignacion.id)}`
    );

    document.title =
        `${asignacionLabel(asignacion.id)} | Gestión Documental`;

}

function actualizarInformacionGeneral(asignacion) {
    mostrarTexto(
        document.getElementById("clienteAsignacion"),
        asignacion.cliente_nombre
    );

    mostrarTexto(
        document.getElementById("siteAsignacion"),
        asignacion.site_nombre
    );

    mostrarTexto(
        document.getElementById("tipoDocumentoAsignacion"),
        asignacion.tipo_documento_nombre
    );

    const contenedor = document.getElementById("alcanceAsignacion");

    const alcances = Array.isArray(asignacion.alcances)
        ? asignacion.alcances
        : [];

    if (!alcances.length) {
        contenedor.innerHTML = `
            <span class="scope-empty">
                No hay alcances asociados
            </span>
        `;
        return;
    }

    contenedor.innerHTML = alcances.map((alcance, indice) => {
        const nombre = typeof alcance === "string"
            ? alcance
            : alcance.nombre || "Alcance sin nombre";

        return `
            <div class="scope-item">
                <span class="scope-number">${indice + 1}</span>

                <div class="scope-text">
                    <strong>${escaparHTML(nombre)}</strong>
                </div>
            </div>
        `;
    }).join("");
}

function actualizarTecnicos(asignacion) {
    const contenedor = document.getElementById("tecnicosAsignacion");

    const tecnicos = Array.isArray(asignacion.tecnicos)
        ? asignacion.tecnicos
        : [];

    if (!tecnicos.length) {
        contenedor.innerHTML = `
            <p class="generated-checklist-group-empty">
                No se encontraron técnicos asignados.
            </p>
        `;
        return;
    }

    contenedor.innerHTML = tecnicos.map(tecnico => {
        const nombre = `${tecnico.nombre || ""} ${tecnico.apellido || ""}`.trim();

        return `
            <div class="responsible-item">
                <div class="person-avatar technician">
                    ${escaparHTML(
                        obtenerIniciales(tecnico.nombre, tecnico.apellido)
                    )}
                </div>

                <div class="person-data">
                    <strong>${escaparHTML(nombre || "Técnico")}</strong>
                    <span>Responsable técnico</span>
                </div>

                <span class="role-badge technician-badge">
                    Técnico
                </span>
            </div>
        `;
    }).join("");
}

function actualizarFechas(asignacion) {
    mostrarTexto(
        document.getElementById("fechaAsignacion"),
        formatearFecha(asignacion.fecha_asignacion)
    );

    mostrarTexto(
        document.getElementById("fechaLimiteAsignacion"),
        formatearFecha(asignacion.fecha_limite)
    );

    const elementoDias = document.getElementById(
        "diasRestantesAsignacion"
    );

    elementoDias.classList.remove("days-warning", "days-overdue");

    if (!asignacion.fecha_limite) {
        elementoDias.textContent = "Sin fecha límite";
        return;
    }

    const fechaTexto = String(asignacion.fecha_limite).substring(0, 10);
    const partes = fechaTexto.split("-").map(Number);

    if (
        partes.length !== 3 ||
        partes.some(Number.isNaN)
    ) {
        elementoDias.textContent = "Fecha límite inválida";
        return;
    }

    const [anio, mes, dia] = partes;

    const fechaLimiteUTC = Date.UTC(
        anio,
        mes - 1,
        dia
    );

    const ahora = new Date();

    const hoyUTC = Date.UTC(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
    );

    const diferencia = Math.round(
        (fechaLimiteUTC - hoyUTC) / 86400000
    );

    if (diferencia < 0) {
        elementoDias.textContent =
            `Vencida hace ${Math.abs(diferencia)} día(s)`;

        elementoDias.classList.add("days-overdue");

    } else if (diferencia === 0) {
        elementoDias.textContent = "Vence hoy";
        elementoDias.classList.add("days-warning");

    } else {
        elementoDias.textContent =
            `${diferencia} ${diferencia === 1 ? "día" : "días"}`;
    }
}

function renderizarAsignacion(asignacion) {
    actualizarEncabezado(asignacion);
    actualizarEstado(asignacion.estado);
    actualizarInformacionGeneral(asignacion);
    actualizarFechas(asignacion);
}


/* =========================================
   PLANTILLA Y CARPETA DRIVE
   ========================================= */

async function cargarContextoDocumental() {
    const respuesta = await apiFetch(
        `${API_URL}/documentos/asignacion/${assignmentId}/contexto`
    );

    const contexto = await obtenerRespuesta(respuesta);

    mostrarTexto(
        document.getElementById("plantillaNombre"),
        contexto.plantilla_nombre,
        "Plantilla asignada"
    );

    const enlaceDrive = contexto.drive_web_view_link;
    const botonDrive = document.getElementById("btnAbrirDrive");
    const estadoDrive = document.getElementById("driveEstado");

    if (enlaceDrive) {
        botonDrive.href = enlaceDrive;
        botonDrive.classList.remove("disabled");
        botonDrive.removeAttribute("aria-disabled");

        estadoDrive.textContent =
            "Carpeta de evidencias disponible.";
    } else {
        botonDrive.href = "#";
        botonDrive.classList.add("disabled");
        botonDrive.setAttribute("aria-disabled", "true");

        estadoDrive.textContent =
            "Todavía no se ha registrado una carpeta de evidencias.";
    }
}

async function descargarPlantilla() {
    const boton = document.getElementById("btnDescargarPlantilla");

    if (boton.disabled) return;

    const contenidoOriginal = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Descargando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/asignacion/${assignmentId}/plantilla`
        );

        const blob = await obtenerArchivoRespuesta(respuesta);

        descargarBlob(
            blob,
            obtenerNombreArchivoRespuesta(respuesta) ||
            `plantilla-${asignacionLabel(assignmentId)}`
        );

        mostrarNotificacion(
            "La plantilla se descargó correctamente.",
            "success"
        );

    } catch (error) {
        mostrarNotificacion(
            error.message || "No se pudo descargar la plantilla.",
            "error"
        );

    } finally {
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}


/* =========================================
   DESCARGAS
   ========================================= */

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
   CHECKLIST DOCUMENTAL
   ========================================= */

function actualizarProgresoChecklist(items) {
    const total = items.length;

    const completados = items.filter(
        item => item.completado
    ).length;

    const pendientes = total - completados;

    const porcentaje = total > 0
        ? Math.round((completados / total) * 100)
        : 0;

    document.getElementById(
        "checklistProgressPercentage"
    ).textContent = `${porcentaje}%`;

    document.getElementById(
        "checklistProgressBar"
    ).style.width = `${porcentaje}%`;

    document.getElementById(
        "checklistCompletedCount"
    ).textContent =
        `${completados} de ${total} ${
            total === 1 ? "ítem atendido" : "ítems atendidos"
        }`;

    document.getElementById(
        "checklistPendingCount"
    ).textContent =
        `${pendientes} ${
            pendientes === 1 ? "pendiente" : "pendientes"
        }`;
}

function renderizarChecklist(items) {
    const contenedor = document.getElementById("checklistItems");
    const vacio = document.getElementById("checklistEmptyState");

    contenedor.replaceChildren();

    if (!items.length) {
        vacio.hidden = false;
        actualizarProgresoChecklist([]);
        return;
    }

    vacio.hidden = true;

    const grupos = new Map();

    items.forEach(item => {
        const encabezado = item.encabezado || "Otros requisitos";

        if (!grupos.has(encabezado)) {
            grupos.set(encabezado, []);
        }

        grupos.get(encabezado).push(item);
    });

    grupos.forEach((elementos, encabezado) => {
        const grupo = document.createElement("div");
        grupo.className = "document-checklist-group";

        const titulo = document.createElement("div");
        titulo.className = "document-checklist-group-header";

        const tituloTexto = document.createElement("strong");
        tituloTexto.textContent = encabezado;

        const contador = document.createElement("span");
        contador.textContent = `${elementos.length} ${
            elementos.length === 1 ? "ítem" : "ítems"
        }`;

        titulo.append(tituloTexto, contador);
        grupo.appendChild(titulo);

        const lista = document.createElement("div");
        lista.className = "document-checklist-items";

        elementos.forEach(item => {
            const fila = document.createElement("label");
            fila.className = "document-checklist-item";
            fila.htmlFor = `document-check-${item.id}`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = `document-check-${item.id}`;
            checkbox.checked = Boolean(item.completado);

            const contenido = document.createElement("span");
            contenido.className = "document-checklist-item-content";

            const nombre = document.createElement("strong");
            nombre.textContent = item.titulo || "Ítem sin título";

            const descripcion = document.createElement("span");
            descripcion.textContent =
                item.descripcion || "Sin descripción adicional.";

            contenido.append(nombre, descripcion);

            if (item.obligatorio) {
                const obligatorio = document.createElement("small");
                obligatorio.className = "document-checklist-required";
                obligatorio.textContent = "Obligatorio";
                contenido.appendChild(obligatorio);
            }

            const estado = document.createElement("span");
            estado.className = `document-checklist-item-state ${
                item.completado ? "completed" : "pending"
            }`;

            estado.textContent = item.completado
                ? "Atendido"
                : "Pendiente";

            checkbox.addEventListener("change", () => {
                actualizarProgresoItem(item, checkbox, estado, items);
            });

            fila.append(checkbox, contenido, estado);
            lista.appendChild(fila);
        });

        grupo.appendChild(lista);
        contenedor.appendChild(grupo);
    });

    actualizarProgresoChecklist(items);
}

async function actualizarProgresoItem(item, checkbox, estado, items) {
    const valorAnterior = !checkbox.checked;
    const nuevoValor = checkbox.checked;

    checkbox.disabled = true;

    estado.textContent = "Guardando...";
    estado.className = "document-checklist-item-state saving";

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/checklist-documental/items/${item.id}/progreso`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    completado: nuevoValor
                })
            }
        );

        const resultado = await obtenerRespuesta(respuesta);

        item.completado = resultado.completado;

        estado.textContent = resultado.completado
            ? "Atendido"
            : "Pendiente";

        estado.className = `document-checklist-item-state ${
            resultado.completado ? "completed" : "pending"
        }`;

        actualizarProgresoChecklist(items);

    } catch (error) {
        checkbox.checked = valorAnterior;

        estado.textContent = valorAnterior
            ? "Atendido"
            : "Pendiente";

        estado.className = `document-checklist-item-state ${
            valorAnterior ? "completed" : "pending"
        }`;

        mostrarNotificacion(
            error.message || "No se pudo actualizar el ítem.",
            "error"
        );

    } finally {
        checkbox.disabled = false;
    }
}

async function cargarChecklistDocumental() {
    const contenedor = document.getElementById("checklistItems");
    const vacio = document.getElementById("checklistEmptyState");

    contenedor.innerHTML = `
        <div class="document-loading">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Cargando checklist documental...
        </div>
    `;

    vacio.hidden = true;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/asignacion/${assignmentId}/checklist-documental`
        );

        if (respuesta.status === 404) {
            contenedor.replaceChildren();
            vacio.hidden = false;
            actualizarProgresoChecklist([]);
            return;
        }

        const checklist = await obtenerRespuesta(respuesta);

        renderizarChecklist(
            Array.isArray(checklist.items) ? checklist.items : []
        );

    } catch (error) {
        contenedor.replaceChildren();

        vacio.hidden = false;
        vacio.querySelector("strong").textContent =
            "No se pudo cargar el checklist";

        vacio.querySelector("span").textContent =
            error.message || "Inténtalo nuevamente.";

        actualizarProgresoChecklist([]);
    }
}


/* =========================================
   DOCUMENTO ELABORADO
   ========================================= */

function actualizarVistaDocumento(documento) {
    documentoActual = documento;

    const contenedor = document.getElementById("documentoActual");
    const estado = document.getElementById("documentFileStatus");
    const tituloCarga = document.getElementById("documentUploadTitle");
    const descripcionCarga = document.getElementById(
        "documentUploadDescription"
    );

    if (!documento) {
        contenedor.hidden = true;

        estado.textContent = "Sin documento";
        estado.className = "document-file-status";

        tituloCarga.textContent = "Cargar documento";
        descripcionCarga.textContent =
            "Selecciona el archivo elaborado para esta asignación.";

        btnCargarDocumento.innerHTML = `
            <i class="bi bi-upload me-1"></i>
            Cargar documento
        `;

        actualizarBotonCarga();
        return;
    }

    contenedor.hidden = false;

    document.getElementById("documentoNombre").textContent =
        documento.nombre_archivo || "Documento sin nombre";

    document.getElementById("documentoFecha").textContent =
        `Última carga: ${formatearFechaHora(documento.fecha_carga)}`;

    estado.textContent = "Documento cargado";
    estado.className = "document-file-status uploaded";

    tituloCarga.textContent = "Reemplazar documento";
    descripcionCarga.textContent =
        "Si seleccionas un nuevo archivo, sustituirá al documento vigente.";

    btnCargarDocumento.innerHTML = `
        <i class="bi bi-upload me-1"></i>
        Reemplazar documento
    `;

    actualizarBotonCarga();
}

async function cargarDocumentoActual() {
    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/asignacion/${assignmentId}`
        );

        const documento = await obtenerRespuesta(respuesta);

        actualizarVistaDocumento(documento);

        if (documento?.id) {
            await cargarHistorialDocumento(documento.id);
        } else {
            renderizarHistorial([]);
        }

    } catch (error) {
        mostrarNotificacion(
            error.message || "No se pudo consultar el documento.",
            "error"
        );
    }
}

function actualizarBotonCarga() {
    btnCargarDocumento.disabled =
        !archivoSeleccionado || cargandoDocumento;
}

function validarArchivo(archivo) {
    if (!archivo) return false;

    const extensionesPermitidas = [
        "xlsx", "xls", "docx", "doc", "pdf",
        "pptx", "ppt", "odt", "ods"
    ];

    const extension = archivo.name.split(".").pop().toLowerCase();

    if (!extensionesPermitidas.includes(extension)) {
        mostrarNotificacion(
            "El formato del archivo no está permitido.",
            "warning"
        );

        return false;
    }

    return true;
}

function seleccionarArchivo() {
    const archivo = documentFileInput.files[0] || null;

    const nombreArchivo = document.getElementById(
        "documentSelectedFile"
    );

    if (!archivo) {
        archivoSeleccionado = null;

        if (nombreArchivo) {
            nombreArchivo.textContent = "Ningún archivo seleccionado";
        }

        actualizarBotonCarga();
        return;
    }

    if (!validarArchivo(archivo)) {
        documentFileInput.value = "";
        archivoSeleccionado = null;

        if (nombreArchivo) {
            nombreArchivo.textContent = "Ningún archivo seleccionado";
        }

        actualizarBotonCarga();
        return;
    }

    archivoSeleccionado = archivo;

    if (nombreArchivo) {
        nombreArchivo.textContent = archivo.name;
    }

    actualizarBotonCarga();
}

async function ejecutarCargaDocumento(botonAccion = btnCargarDocumento) {
    if (!archivoSeleccionado || cargandoDocumento) return;

    const contenidoOriginal = botonAccion.innerHTML;

    cargandoDocumento = true;
    actualizarBotonCarga();

    botonAccion.disabled = true;
    botonAccion.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Guardando...
    `;

    const formData = new FormData();
    formData.append("archivo", archivoSeleccionado);

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/asignacion/${assignmentId}/archivo`,
            {
                method: "POST",
                body: formData
            }
        );

        const documento = await obtenerRespuesta(respuesta);

        documentFileInput.value = "";
        archivoSeleccionado = null;

        const nombreArchivoSeleccionado = document.getElementById(
            "documentSelectedFile"
        );

        if (nombreArchivoSeleccionado) {
            nombreArchivoSeleccionado.textContent = "Ningún archivo seleccionado";
        }

        actualizarVistaDocumento(documento);

        await cargarHistorialDocumento(documento.id);

        mostrarNotificacion(
            documento.limpieza_pendiente
                ? "El documento se guardó, pero la limpieza del archivo anterior está pendiente."
                : "El documento se cargó correctamente.",
            documento.limpieza_pendiente ? "warning" : "success"
        );

    } catch (error) {
        mostrarNotificacion(
            error.message || "No se pudo cargar el documento.",
            "error"
        );

    } finally {
        cargandoDocumento = false;

        botonAccion.disabled = false;
        botonAccion.innerHTML = contenidoOriginal;

        actualizarBotonCarga();

        if (reemplazoModal) {
            reemplazoModal.hide();
        }
    }
}

function solicitarCargaDocumento() {
    if (!archivoSeleccionado || cargandoDocumento) return;

    if (documentoActual) {
        reemplazoModal?.show();
        return;
    }

    ejecutarCargaDocumento();
}

async function descargarDocumentoActual() {
    if (!documentoActual?.id) return;

    const boton = document.getElementById("btnDescargarDocumento");
    const contenidoOriginal = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Descargando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/${documentoActual.id}/descargar`
        );

        const blob = await obtenerArchivoRespuesta(respuesta);

        descargarBlob(
            blob,
            obtenerNombreArchivoRespuesta(respuesta) ||
            documentoActual.nombre_archivo
        );

        mostrarNotificacion(
            "El documento se descargó correctamente.",
            "success"
        );

        await cargarHistorialDocumento(documentoActual.id);

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
   HISTORIAL DE OPERACIONES
   ========================================= */

function obtenerOperacionLabel(tipo) {
    const etiquetas = {
        subida: "Documento cargado",
        reemplazo: "Documento reemplazado",
        descarga: "Documento descargado",
        eliminacion: "Documento eliminado"
    };

    return etiquetas[tipo] || tipo || "Operación";
}

function obtenerOperacionIcono(tipo) {
    const iconos = {
        subida: "bi-cloud-arrow-up",
        reemplazo: "bi-arrow-repeat",
        descarga: "bi-download",
        eliminacion: "bi-trash3"
    };

    return iconos[tipo] || "bi-clock-history";
}

function renderizarHistorial(operaciones) {
    const contenedor = document.getElementById("documentHistory");

    if (!operaciones.length) {
        contenedor.innerHTML = `
            <div class="document-history-empty">
                <i class="bi bi-clock"></i>
                <span>No hay operaciones registradas.</span>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = operaciones.map(operacion => `
        <div class="document-history-item">

            <div class="document-history-icon">
                <i class="bi ${obtenerOperacionIcono(
                    operacion.tipo_operacion
                )}"></i>
            </div>

            <div class="document-history-content">
                <strong>
                    ${escaparHTML(
                        obtenerOperacionLabel(operacion.tipo_operacion)
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        operacion.nombre_archivo || "Sin nombre de archivo"
                    )}
                </span>

                <small>
                    ${escaparHTML(operacion.usuario_nombre || "Usuario")}
                    ·
                    ${escaparHTML(
                        formatearFechaHora(operacion.fecha_operacion)
                    )}
                </small>

                ${
                    operacion.detalles
                        ? `<p>${escaparHTML(operacion.detalles)}</p>`
                        : ""
                }
            </div>

        </div>
    `).join("");
}

async function cargarHistorialDocumento(documentoId) {
    const contenedor = document.getElementById("documentHistory");

    if (!documentoId) {
        renderizarHistorial([]);
        return;
    }

    try {
        const respuesta = await apiFetch(
            `${API_URL}/documentos/${documentoId}/operaciones`
        );

        const operaciones = await obtenerRespuesta(respuesta);

        renderizarHistorial(
            Array.isArray(operaciones) ? operaciones : []
        );

    } catch (error) {
        contenedor.innerHTML = `
            <div class="document-history-empty">
                <i class="bi bi-exclamation-circle"></i>
                <span>No se pudo consultar el historial.</span>
            </div>
        `;
    }
}


/* =========================================
   CARGA GENERAL
   ========================================= */

async function cargarAsignacion() {
    if (!assignmentId || !/^\d+$/.test(assignmentId)) {
        mostrarErrorDetalle("El identificador de la asignación no es válido.");
        return;
    }

    detalleError.hidden = true;
    detalleContenido.hidden = true;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}`
        );

        const asignacion = await obtenerRespuesta(respuesta);

        asignacionActual = asignacion;

        renderizarAsignacion(asignacion);

        detalleContenido.hidden = false;

        await Promise.allSettled([
            cargarContextoDocumental(),
            cargarChecklistDocumental(),
            cargarDocumentoActual()
        ]);

    } catch (error) {
        mostrarErrorDetalle(
            error.message || "No se pudo cargar la información de la asignación."
        );
    }
}


/* =========================================
   MENÚ RESPONSIVE
   ========================================= */

function configurarMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const menuButton = document.getElementById("mobileMenuButton");

    if (!sidebar || !overlay || !menuButton) return;

    function cerrarMenu() {
        sidebar.classList.remove("show", "active");
        overlay.classList.remove("show", "active");
    }

    menuButton.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", cerrarMenu);
}


/* =========================================
   EVENTOS
   ========================================= */

function configurarEventos() {
    document.getElementById("btnDescargarPlantilla")
        .addEventListener("click", descargarPlantilla);

    document.getElementById("btnAbrirDrive")
        .addEventListener("click", event => {
            if (event.currentTarget.classList.contains("disabled")) {
                event.preventDefault();
            }
        });

    documentFileInput.addEventListener("change", seleccionarArchivo);

    btnCargarDocumento.addEventListener(
        "click",
        solicitarCargaDocumento
    );

    btnConfirmarReemplazo?.addEventListener(
        "click",
        ejecutarCargaDocumento
    );

    document.getElementById("btnDescargarDocumento")
        .addEventListener("click", descargarDocumentoActual);

    document.getElementById("btnReintentarDetalle")
        .addEventListener("click", cargarAsignacion);
}


/* =========================================
   INICIALIZACIÓN
   ========================================= */

async function inicializarPagina() {
    configurarMenu();
    configurarEventos();

    try {
        const sesionValida = await cargarUsuario();

        if (!sesionValida) return;

        await cargarAsignacion();

    } catch (error) {
        mostrarErrorDetalle(
            error.message || "No se pudo validar tu sesión."
        );
    }
}

inicializarPagina();