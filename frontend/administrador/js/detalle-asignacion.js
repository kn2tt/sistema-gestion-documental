/* =====================================================
   CONFIGURACIÓN
   ===================================================== */

const API_URL = "http://127.0.0.1:8000";

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");


/* =====================================================
   UTILIDADES
   ===================================================== */

function obtenerElemento(selector, contexto = document) {
    return contexto.querySelector(selector);
}

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
    if (elemento) {
        elemento.textContent =
            valor !== null && valor !== undefined && valor !== ""
                ? valor
                : alternativa;
    }
}

function obtenerIniciales(nombre, apellido = "") {
    const palabras = `${nombre || ""} ${apellido || ""}`
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return palabras
        .slice(0, 2)
        .map(palabra => palabra.charAt(0).toUpperCase())
        .join("") || "—";
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = String(fecha).split("-");

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

function mostrarError(mensaje) {
    let alerta = document.getElementById("detalleError");

    if (!alerta) {
        alerta = document.createElement("div");
        alerta.id = "detalleError";
        alerta.className = "alert alert-danger";
        alerta.setAttribute("role", "alert");

        const contenido = document.querySelector(".page-content");

        if (contenido) {
            contenido.prepend(alerta);
        }
    }

    alerta.textContent = mensaje;
    alerta.classList.remove("d-none");
}

function ocultarError() {
    const alerta = document.getElementById("detalleError");

    if (alerta) {
        alerta.classList.add("d-none");
    }
}

/* =====================================================
   NOTIFICACIONES DEL SISTEMA
   ===================================================== */

function mostrarNotificacion(
    mensaje,
    tipo = "success",
    titulo = ""
) {
    const contenedor = document.getElementById(
        "notificationContainer"
    );

    if (!contenedor) {
        console.error(
            "No se encontró el contenedor de notificaciones."
        );
        return;
    }

    const configuracion = {
        success: {
            titulo: "Operación completada",
            icono: "bi-check-circle-fill"
        },

        warning: {
            titulo: "Atención",
            icono: "bi-exclamation-triangle-fill"
        },

        error: {
            titulo: "No se pudo completar",
            icono: "bi-x-circle-fill"
        }
    };

    const opciones =
        configuracion[tipo] ||
        configuracion.success;

    const notificacion = document.createElement("div");

    notificacion.className =
        `system-notification ${tipo}`;

    notificacion.setAttribute(
        "role",
        tipo === "error" ? "alert" : "status"
    );

    const icono = document.createElement("i");

    icono.className =
        `bi ${opciones.icono} notification-icon`;

    icono.setAttribute("aria-hidden", "true");

    const contenido = document.createElement("div");

    contenido.className = "notification-content";

    const encabezado = document.createElement("strong");

    encabezado.className = "notification-title";
    encabezado.textContent = titulo || opciones.titulo;

    const texto = document.createElement("p");

    texto.className = "notification-message";
    texto.textContent = mensaje;

    const cerrar = document.createElement("button");

    cerrar.type = "button";
    cerrar.className = "notification-close";

    cerrar.setAttribute(
        "aria-label",
        "Cerrar notificación"
    );

    cerrar.innerHTML =
        '<i class="bi bi-x-lg" aria-hidden="true"></i>';

    contenido.append(encabezado, texto);

    notificacion.append(
        icono,
        contenido,
        cerrar
    );

    contenedor.appendChild(notificacion);

    let temporizador;

    function cerrarNotificacion() {
        if (
            notificacion.classList.contains(
                "notification-leaving"
            )
        ) {
            return;
        }

        clearTimeout(temporizador);

        notificacion.classList.add(
            "notification-leaving"
        );

        notificacion.addEventListener(
            "animationend",
            function () {
                notificacion.remove();
            },
            {
                once: true
            }
        );

        setTimeout(function () {
            notificacion.remove();
        }, 250);
    }

    cerrar.addEventListener(
        "click",
        cerrarNotificacion
    );

    temporizador = setTimeout(
        cerrarNotificacion,
        4500
    );
}

/* =====================================================
   ESTADOS DE LA ASIGNACIÓN
   ===================================================== */

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

function obtenerEstado(estado) {
    return estadosAsignacion[estado] || {
        texto: estado || "Sin estado",
        clase: "status-pending"
    };
}

function actualizarEstado(estado) {
    const badge = document.getElementById("estadoAsignacion");
    const configuracion = obtenerEstado(estado);

    if (badge) {
        badge.className = `status-badge ${configuracion.clase}`;
        badge.replaceChildren();

        const indicador = document.createElement("span");
        badge.appendChild(indicador);
        badge.appendChild(
            document.createTextNode(configuracion.texto)
        );

        badge.hidden = false;
    }

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

        const icono = esAnterior
            ? "bi-check-lg"
            : (iconos[paso.dataset.status] || "bi-circle");

        marcador.replaceChildren();

        const elementoIcono = document.createElement("i");
        elementoIcono.className = `bi ${icono}`;
        marcador.appendChild(elementoIcono);
    });
}


/* =====================================================
   INFORMACIÓN GENERAL
   ===================================================== */

function actualizarEncabezado(asignacion) {
    const titulo = obtenerElemento(".title-row h1");
    const subtitulo = obtenerElemento(".title-row p");

    mostrarTexto(
        titulo,
        asignacion.proyecto_nombre,
        "Detalle de asignación"
    );

    mostrarTexto(
        subtitulo,
        `Detalle de la asignación #ASG-${String(asignacion.id).padStart(4, "0")}`
    );

    document.title =
        `ASG-${String(asignacion.id).padStart(4, "0")} | Gestión Documental`;

    actualizarEstado(asignacion.estado);
}


function actualizarTarjetasInformacion(asignacion) {
    mostrarTexto(
        document.getElementById("clienteAsignacion"),
        asignacion.cliente_nombre,
        "Cliente no incluido en la respuesta de la API"
    );

    mostrarTexto(
        document.getElementById("siteAsignacion"),
        asignacion.site_nombre
    );

    mostrarTexto(
        document.getElementById("tipoDocumentoAsignacion"),
        asignacion.tipo_documento_nombre
    );

    const contenedorAlcances = document.getElementById("alcanceAsignacion");

    const alcances = Array.isArray(asignacion.alcances)
        ? asignacion.alcances
        : [];

    if (contenedorAlcances) {
        if (alcances.length === 0) {
            contenedorAlcances.innerHTML = `
                <span class="scope-empty">
                    No hay alcances asociados
                </span>
            `;
        } else {
            contenedorAlcances.innerHTML = alcances.map((alcance, indice) => {
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
    }
}


async function obtenerNombreCliente(proyectoId) {
    if (!proyectoId) return null;

    const respuesta = await apiFetch(
        `${API_URL}/proyectos/cliente`
    );

    if (!respuesta.ok) return null;

    const proyectos = await respuesta.json();

    const proyecto = proyectos.find(
        item => Number(item.id) === Number(proyectoId)
    );

    return proyecto?.cliente_nombre ?? null;
}


function actualizarFechas(asignacion) {
    const filas = document.querySelectorAll(".date-row");

    if (filas[0]) {
        mostrarTexto(
            filas[0].querySelector("strong"),
            formatearFecha(asignacion.fecha_asignacion)
        );
    }

    if (filas[1]) {
        mostrarTexto(
            filas[1].querySelector("strong"),
            formatearFecha(asignacion.fecha_limite)
        );
    }

    if (filas[2]) {
        const elementoDias = filas[2].querySelector("strong");

        if (!elementoDias) return;

        elementoDias.classList.remove("days-warning");

        if (!asignacion.fecha_limite) {
            elementoDias.textContent = "Sin fecha límite";
            return;
        }

        // Acepta fechas YYYY-MM-DD y fechas ISO con hora.
        const fechaTexto = String(asignacion.fecha_limite).slice(0, 10);
        const partes = fechaTexto.split("-").map(Number);

        if (
            partes.length !== 3 ||
            partes.some(Number.isNaN)
        ) {
            elementoDias.textContent = "Fecha límite inválida";
            return;
        }

        const [anio, mes, dia] = partes;
        const fechaLimiteUTC = Date.UTC(anio, mes - 1, dia);

        // Utiliza el día calendario local del usuario.
        const ahora = new Date();
        const hoyUTC = Date.UTC(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate()
        );

        const diferencia = Math.round(
            (fechaLimiteUTC - hoyUTC) / 86400000
        );

        if (asignacion.estado === "completado") {
            elementoDias.textContent = "Finalizada";
        } else if (diferencia < 0) {
            elementoDias.textContent =
                `Vencida hace ${Math.abs(diferencia)} día(s)`;
            elementoDias.classList.add("days-warning");
        } else if (diferencia === 0) {
            elementoDias.textContent = "Vence hoy";
            elementoDias.classList.add("days-warning");
        } else {
            elementoDias.textContent =
                `${diferencia} ${diferencia === 1 ? "día" : "días"}`;
        }
    }
}


/* =====================================================
   RESPONSABLES
   ===================================================== */

function actualizarTecnicos(asignacion) {
    const lista = obtenerElemento(".responsible-list");

    if (!lista) return;

    const tecnicos = Array.isArray(asignacion.tecnicos)
        ? asignacion.tecnicos
        : [];

    const contador = obtenerElemento(".responsible-count");

    mostrarTexto(
        contador,
        `${tecnicos.length} ${tecnicos.length === 1 ? "técnico" : "técnicos"}`
    );

    if (tecnicos.length === 0) {
        lista.innerHTML = `
            <div class="text-muted small">
                No hay técnicos asignados.
            </div>
        `;
        return;
    }

    lista.innerHTML = tecnicos.map(tecnico => {
        const nombre = `${tecnico.nombre || ""} ${tecnico.apellido || ""}`.trim();

        return `
            <div class="responsible-item">
                <div class="person-avatar technician">
                    ${escaparHTML(obtenerIniciales(tecnico.nombre, tecnico.apellido))}
                </div>

                <div class="person-data">
                    <strong>${escaparHTML(nombre || "Sin nombre")}</strong>
                    <span>Técnico</span>
                    <small>Evidencias fotográficas</small>
                </div>

                <span class="role-badge technician-badge">
                    Técnico
                </span>
            </div>
        `;
    }).join("");
}

function actualizarDocumentador(asignacion) {
    const contenedor = obtenerElemento(".documenter-assignment");

    if (!contenedor) return;

    if (
        asignacion.documentador_id &&
        asignacion.documentador_nombre
    ) {
        contenedor.innerHTML = `
            <div class="responsible-item documenter-item">
                <div class="person-avatar documenter">
                    ${escaparHTML(
                        obtenerIniciales(asignacion.documentador_nombre)
                    )}
                </div>

                <div class="person-data">
                    <strong>
                        ${escaparHTML(asignacion.documentador_nombre)}
                    </strong>
                    <span>Documentador asignado</span>
                </div>

                <button
                    type="button"
                    class="responsible-change-btn"
                    id="changeDocumenterBtn"
                >
                    <i class="bi bi-pencil"></i>
                    Cambiar
                </button>
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <div class="responsible-item documenter-item">
                <div class="person-avatar documenter">
                    <i class="bi bi-person"></i>
                </div>

                <div class="person-data">
                    <strong>Sin documentador asignado</strong>
                    <span>Documentador</span>
                </div>

                <button
                    type="button"
                    class="responsible-change-btn"
                    id="assignDocumenterBtn"
                >
                    <i class="bi bi-plus-lg"></i>
                    Asignar
                </button>
            </div>
        `;
    }

    configurarBotonDocumentador();
}


/* =====================================================
   CONTROL DE EDICIÓN DE EVIDENCIAS
   ===================================================== */

function actualizarBotonEdicionEvidencias(asignacion) {
    const boton = document.getElementById(
        "btnEditarEvidencias"
    );

    if (!boton || !asignacion) return;

    const habilitada = Boolean(
        asignacion.edicion_evidencias_habilitada
    );

    const completada = asignacion.estado === "completado";

    boton.hidden = false;
    boton.disabled = completada;

    boton.innerHTML = habilitada
        ? '<i class="bi bi-lock-fill"></i> Deshabilitar edición'
        : '<i class="bi bi-unlock"></i> Habilitar edición';

    boton.title = completada
        ? "No se puede habilitar la edición de una asignación completada."
        : habilitada
            ? "Bloquear la edición de fotografías del técnico."
            : "Permitir nuevamente la edición de fotografías del técnico.";
}


async function cambiarPermisoEdicionEvidencias() {
    const asignacion = window.asignacionDetalleActual;

    if (!asignacion) return;

    if (
        asignacion.estado === "completado" &&
        !asignacion.edicion_evidencias_habilitada
    ) {
        mostrarNotificacion(
            "No se puede habilitar la edición de una asignación completada.",
            "warning"
        );
        return;
    }

    const nuevaHabilitacion = !Boolean(
        asignacion.edicion_evidencias_habilitada
    );

    const confirmacion = window.confirm(
        nuevaHabilitacion
            ? "¿Deseas habilitar nuevamente la edición de evidencias para el técnico?"
            : "¿Deseas deshabilitar la edición de evidencias para el técnico?"
    );

    if (!confirmacion) return;

    const boton = document.getElementById(
        "btnEditarEvidencias"
    );

    const contenidoOriginal = boton.innerHTML;

    boton.disabled = true;

    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Actualizando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/${assignmentId}/edicion-evidencias`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    habilitada: nuevaHabilitacion
                })
            }
        );

        const datos = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401) {
            window.location.href = "../index.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.detail || "No se pudo actualizar el permiso de edición."
            );
        }

        asignacion.edicion_evidencias_habilitada =
            datos.edicion_evidencias_habilitada;

        actualizarBotonEdicionEvidencias(asignacion);

        mostrarNotificacion(
            datos.mensaje || "El permiso se actualizó correctamente.",
            "success"
        );

    } catch (error) {
        console.error(
            "Error al cambiar el permiso de edición:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo actualizar el permiso.",
            "error"
        );

    } finally {
        boton.innerHTML = contenidoOriginal;
        actualizarBotonEdicionEvidencias(asignacion);
    }
}

document.getElementById(
    "btnEditarEvidencias"
)?.addEventListener(
    "click",
    cambiarPermisoEdicionEvidencias
);


/* =====================================================
   CARGAR ASIGNACIÓN DESDE FASTAPI
   ===================================================== */

async function cargarAsignacion() {
    if (!assignmentId || !/^\d+$/.test(assignmentId)) {
        mostrarError(
            "No se indicó un identificador válido. Regresa a asignaciones y selecciona un registro."
        );
        return;
    }

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}`
        );

        if (!respuesta.ok) {
            if (respuesta.status === 404) {
                throw new Error("La asignación solicitada no existe.");
            }

            throw new Error(
                `No se pudo cargar la asignación (HTTP ${respuesta.status}).`
            );
        }

        const asignacion = await respuesta.json();
        window.asignacionDetalleActual = asignacion;
        actualizarBotonEdicionEvidencias(asignacion);

        console.log("Datos recibidos de la asignación:", asignacion);

        ocultarError();

        actualizarEncabezado(asignacion);
        actualizarTarjetasInformacion(asignacion);
        actualizarFechas(asignacion);
        actualizarTecnicos(asignacion);
        actualizarDocumentador(asignacion);

        await cargarChecklistAsignacion();

    } catch (error) {
        console.error("Error al cargar la asignación:", error);

        mostrarError(
            error.message ||
            "No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose."
        );
    }
}


/* =====================================================
   SIDEBAR
   ===================================================== */

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    sidebar?.classList.add("show");
    sidebarOverlay?.classList.add("show");
}

function closeSidebar() {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");
}

mobileMenuButton?.addEventListener("click", openSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

document.querySelectorAll(".sidebar .nav-item").forEach(item => {
    item.addEventListener("click", closeSidebar);
});


/* =====================================================
   MODAL DE EVIDENCIAS
   ===================================================== */

const uploadModal = document.getElementById("uploadModal");
const uploadEvidenceButton = document.getElementById("uploadEvidenceBtn");
const closeModalButton = document.getElementById("closeModal");
const cancelUploadButton = document.getElementById("cancelUpload");
const evidenceFile = document.getElementById("evidenceFile");
const selectedFile = document.getElementById("selectedFile");
const confirmUpload = document.getElementById("confirmUpload");

function openUploadModal() {
    uploadModal?.classList.add("show");
}

function closeUploadModal() {
    uploadModal?.classList.remove("show");
}

uploadEvidenceButton?.addEventListener("click", openUploadModal);
closeModalButton?.addEventListener("click", closeUploadModal);
cancelUploadButton?.addEventListener("click", closeUploadModal);

evidenceFile?.addEventListener("change", function () {
    if (evidenceFile.files.length > 0) {
        mostrarTexto(selectedFile, evidenceFile.files[0].name);
    } else {
        mostrarTexto(selectedFile, "Ningún archivo seleccionado");
    }
});

confirmUpload?.addEventListener("click", function () {
    if (!evidenceFile?.files.length) {
        alert("Selecciona una fotografía antes de continuar.");
        return;
    }

    const archivo = evidenceFile.files[0];

    if (!["image/jpeg", "image/png"].includes(archivo.type)) {
        alert("El archivo debe ser JPG, JPEG o PNG.");
        return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
        alert("La fotografía no debe superar los 10 MB.");
        return;
    }

    alert(
        "El archivo cumple las validaciones, pero la carga todavía no está conectada al endpoint de evidencias."
    );
});


/* =====================================================
   MODAL ASIGNAR / CAMBIAR DOCUMENTADOR
   ===================================================== */

const documenterModal = document.getElementById("documenterModal");
const documenterSelect = document.getElementById("documenterSelect");
const documenterModalTitle = document.getElementById("documenterModalTitle");
const documenterModalMessage = document.getElementById("documenterModalMessage");
const saveDocumenterBtn = document.getElementById("saveDocumenterBtn");

let documentadorActualId = null;

function cerrarModalDocumentador() {
    documenterModal?.classList.remove("show");
}


const documenterSearch = document.getElementById("documenterSearch");
const documenterOptions = document.getElementById("documenterOptions");
const documenterCount = document.getElementById("documenterCount");
const clearDocumenterSearch = document.getElementById("clearDocumenterSearch");

let documentadoresDisponibles = [];
let documentadorSeleccionadoId = null;

function obtenerInicialesDocumentador(usuario) {
    return `${usuario.nombre?.trim().charAt(0) || ""}${usuario.apellido?.trim().charAt(0) || ""}`
        .toUpperCase();
}

function renderizarDocumentadores() {
    if (!documenterOptions) return;

    const busqueda = documenterSearch.value.trim().toLocaleLowerCase();

    const filtrados = documentadoresDisponibles.filter(usuario => {
        const nombre = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
        const correo = usuario.correo || "";

        return `${nombre} ${correo}`.toLocaleLowerCase().includes(busqueda);
    });

    documenterCount.textContent = filtrados.length;
    clearDocumenterSearch.hidden = !documenterSearch.value;

    documenterOptions.replaceChildren();

    if (filtrados.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "documenter-empty";

        const icono = document.createElement("i");
        icono.className = "bi bi-search";

        const mensaje = document.createElement("span");
        mensaje.textContent = "No se encontraron documentadores.";

        vacio.append(icono, mensaje);
        documenterOptions.appendChild(vacio);
        return;
    }

    filtrados.forEach(usuario => {
        const nombre = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
        const seleccionado = String(usuario.id) === String(documentadorSeleccionadoId);

        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.className = `documenter-option${seleccionado ? " selected" : ""}`;
        opcion.setAttribute("role", "option");
        opcion.setAttribute("aria-selected", String(seleccionado));

        const avatar = document.createElement("span");
        avatar.className = "documenter-option-avatar";
        avatar.textContent = obtenerInicialesDocumentador(usuario);

        const info = document.createElement("span");
        info.className = "documenter-option-info";

        const nombreElemento = document.createElement("span");
        nombreElemento.className = "documenter-option-name";
        nombreElemento.textContent = nombre;

        const correo = document.createElement("span");
        correo.className = "documenter-option-email";
        correo.textContent = usuario.correo || "Documentador";

        info.append(nombreElemento, correo);

        const check = document.createElement("span");
        check.className = "documenter-option-check";
        check.innerHTML = '<i class="bi bi-check-lg"></i>';

        opcion.append(avatar, info, check);

        opcion.addEventListener("click", function () {
            documentadorSeleccionadoId = usuario.id;
            documenterModalMessage.textContent = "";
            renderizarDocumentadores();
        });

        documenterOptions.appendChild(opcion);
    });
}

async function abrirModalDocumentador() {
    if (!documenterModal || !documenterOptions) {
        console.error("No se encontró el modal del documentador.");
        return;
    }

    const asignacionActual = window.asignacionDetalleActual;
    documentadorSeleccionadoId = asignacionActual?.documentador_id ?? null;

    documenterModalTitle.textContent = documentadorSeleccionadoId
        ? "Cambiar documentador"
        : "Asignar documentador";

    documenterModalMessage.textContent = "";
    documenterSearch.value = "";
    documenterOptions.innerHTML = `
        <div class="documenter-empty">
            <i class="bi bi-arrow-repeat"></i>
            <span>Cargando documentadores...</span>
        </div>`;

    saveDocumenterBtn.disabled = true;
    documenterModal.classList.add("show");

    try {
        const respuesta = await apiFetch(`${API_URL}/usuarios/`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los usuarios.");
        }

        const usuarios = await respuesta.json();

        documentadoresDisponibles = usuarios.filter(usuario =>
            usuario.rol === "documentador" && usuario.activo === true
        );

        if (
            documentadorSeleccionadoId !== null &&
            !documentadoresDisponibles.some(
                usuario => String(usuario.id) === String(documentadorSeleccionadoId)
            )
        ) {
            documentadorSeleccionadoId = null;
        }

        renderizarDocumentadores();

        saveDocumenterBtn.disabled = documentadoresDisponibles.length === 0;

        if (documentadoresDisponibles.length === 0) {
            documenterModalMessage.textContent =
                "No hay documentadores activos disponibles.";
        }

        documenterSearch.focus();

    } catch (error) {
        console.error("Error al cargar documentadores:", error);

        documenterOptions.innerHTML = `
            <div class="documenter-empty">
                <i class="bi bi-exclamation-circle"></i>
                <span>No se pudieron cargar los documentadores.</span>
            </div>`;

        documenterModalMessage.textContent =
            error.message || "Ocurrió un error al cargar los usuarios.";
    }
}

documenterSearch?.addEventListener("input", renderizarDocumentadores);

clearDocumenterSearch?.addEventListener("click", function () {
    documenterSearch.value = "";
    renderizarDocumentadores();
    documenterSearch.focus();
});


document.getElementById("closeDocumenterModal")
    ?.addEventListener("click", cerrarModalDocumentador);

document.getElementById("cancelDocumenterModal")
    ?.addEventListener("click", cerrarModalDocumentador);

documenterModal?.addEventListener("click", function (event) {
    if (event.target === documenterModal) {
        cerrarModalDocumentador();
    }
});


saveDocumenterBtn?.addEventListener("click", async function () {
    const documentadorId = documentadorSeleccionadoId;

    const teniaDocumentador = Boolean(
        window.asignacionDetalleActual?.documentador_id
    );

    if (!assignmentId || !documentadorId) {
        documenterModalMessage.textContent =
            "Selecciona un documentador antes de guardar.";
        return;
    }

    const boton = this;
    const contenidoOriginal = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML = `
        <span class="documenter-save-spinner" aria-hidden="true"></span>
        Guardando...
    `;

    documenterModalMessage.textContent = "";

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    documentador_id: Number(documentadorId)
                })
            }
        );

        if (!respuesta.ok) {
            let mensaje = "No se pudo guardar el documentador.";

            try {
                const detalle = await respuesta.json();
                mensaje = detalle.detail || mensaje;
            } catch {
                // Mantiene el mensaje predeterminado.
            }

            throw new Error(
                typeof mensaje === "string"
                    ? mensaje
                    : JSON.stringify(mensaje)
            );
        }

        cerrarModalDocumentador();
        await cargarAsignacion();

        mostrarNotificacion(
            window.asignacionDetalleActual?.documentador_id
                ? "El documentador se actualizó correctamente."
                : "El documentador se asignó correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al guardar el documentador:", error);

        documenterModalMessage.textContent =
            error.message || "No se pudo guardar el documentador.";

    } finally {
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
});


/* =====================================================
   RESPONSABLES
   ===================================================== */

function configurarBotonDocumentador() {
    const botonCambiar = obtenerElemento("#changeDocumenterBtn");
    const botonAsignar = obtenerElemento("#assignDocumenterBtn");

    botonCambiar?.addEventListener("click", abrirModalDocumentador);
    botonAsignar?.addEventListener("click", abrirModalDocumentador);
}



/* =====================================================
   MODAL GESTIONAR TÉCNICOS
   ===================================================== */

const techniciansModal = document.getElementById("techniciansModal");
const technicianSearch = document.getElementById("technicianSearch");
const technicianOptions = document.getElementById("technicianOptions");
const technicianCount = document.getElementById("technicianCount");
const clearTechnicianSearch = document.getElementById("clearTechnicianSearch");
const techniciansModalMessage = document.getElementById("techniciansModalMessage");
const saveTechniciansBtn = document.getElementById("saveTechniciansBtn");

let tecnicosDisponibles = [];
let tecnicosSeleccionadosIds = [];
let guardandoTecnicos = false;

function cerrarModalTecnicos() {
    if (guardandoTecnicos) return;
    techniciansModal?.classList.remove("show");
}

function renderizarTecnicos() {
    if (!technicianOptions) return;

    const busqueda = technicianSearch.value.trim().toLocaleLowerCase();

    const filtrados = tecnicosDisponibles.filter(tecnico => {
        const nombre = `${tecnico.nombre || ""} ${tecnico.apellido || ""}`.trim();
        const correo = tecnico.correo || "";

        return `${nombre} ${correo}`.toLocaleLowerCase().includes(busqueda);
    });

    technicianCount.textContent = filtrados.length;
    clearTechnicianSearch.hidden = !technicianSearch.value;

    technicianOptions.replaceChildren();

    if (filtrados.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "documenter-empty";

        const icono = document.createElement("i");
        icono.className = "bi bi-search";

        const mensaje = document.createElement("span");
        mensaje.textContent = busqueda
            ? "No se encontraron técnicos."
            : "No hay técnicos activos disponibles.";

        vacio.append(icono, mensaje);
        technicianOptions.appendChild(vacio);
        return;
    }

    filtrados.forEach(tecnico => {
        const nombre = `${tecnico.nombre || ""} ${tecnico.apellido || ""}`.trim();
        const seleccionado = tecnicosSeleccionadosIds.some(
            id => String(id) === String(tecnico.id)
        );

        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.className = `documenter-option${seleccionado ? " selected" : ""}`;
        opcion.setAttribute("role", "option");
        opcion.setAttribute("aria-selected", String(seleccionado));

        const avatar = document.createElement("span");
        avatar.className = "documenter-option-avatar";
        avatar.textContent = obtenerIniciales(tecnico.nombre, tecnico.apellido);

        const info = document.createElement("span");
        info.className = "documenter-option-info";

        const nombreElemento = document.createElement("span");
        nombreElemento.className = "documenter-option-name";
        nombreElemento.textContent = nombre || "Sin nombre";

        const correo = document.createElement("span");
        correo.className = "documenter-option-email";
        correo.textContent = tecnico.correo || "Técnico";

        info.append(nombreElemento, correo);

        const check = document.createElement("span");
        check.className = "documenter-option-check";
        check.innerHTML = '<i class="bi bi-check-lg"></i>';

        opcion.append(avatar, info, check);

        opcion.addEventListener("click", function () {
            if (seleccionado) {
                tecnicosSeleccionadosIds = tecnicosSeleccionadosIds.filter(
                    id => String(id) !== String(tecnico.id)
                );
            } else {
                tecnicosSeleccionadosIds.push(tecnico.id);
            }

            techniciansModalMessage.textContent = "";
            renderizarTecnicos();
        });

        technicianOptions.appendChild(opcion);
    });
}

async function abrirModalTecnicos() {
    if (!techniciansModal || !technicianOptions) {
        console.error("No se encontró el modal para gestionar técnicos.");
        return;
    }

    const asignacionActual = window.asignacionDetalleActual;

    if (!asignacionActual) {
        mostrarError("Primero debes cargar la asignación.");
        return;
    }

    tecnicosSeleccionadosIds = Array.isArray(asignacionActual.tecnicos)
        ? asignacionActual.tecnicos.map(tecnico => tecnico.id)
        : [];

    techniciansModalMessage.textContent = "";
    technicianSearch.value = "";

    technicianOptions.innerHTML = `
        <div class="documenter-empty">
            <i class="bi bi-arrow-repeat"></i>
            <span>Cargando técnicos...</span>
        </div>
    `;

    saveTechniciansBtn.disabled = true;
    techniciansModal.classList.add("show");

    try {
        const respuesta = await apiFetch(`${API_URL}/usuarios/`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los usuarios.");
        }

        const usuarios = await respuesta.json();

        tecnicosDisponibles = usuarios.filter(usuario =>
            ["tecnico", "técnico"].includes(
                String(usuario.rol || "").trim().toLocaleLowerCase()
            ) && usuario.activo === true
        );

        // Conserva los técnicos ya asignados, aunque estén inactivos.
        const idsDisponibles = new Set(
            tecnicosDisponibles.map(tecnico => String(tecnico.id))
        );

        const tecnicosActuales = Array.isArray(asignacionActual.tecnicos)
            ? asignacionActual.tecnicos
            : [];

        tecnicosActuales.forEach(tecnico => {
            if (
                !idsDisponibles.has(String(tecnico.id)) &&
                !tecnicosDisponibles.some(
                    disponible => String(disponible.id) === String(tecnico.id)
                )
            ) {
                tecnicosDisponibles.push({
                    ...tecnico,
                    activo: false
                });
            }
        });

        // Evita duplicados si algún técnico ya estaba en la lista.
        tecnicosDisponibles = [
            ...new Map(
                tecnicosDisponibles.map(tecnico => [
                    String(tecnico.id),
                    tecnico
                ])
            ).values()
        ];

        renderizarTecnicos();

        saveTechniciansBtn.disabled = tecnicosDisponibles.length === 0;

        if (tecnicosDisponibles.length === 0) {
            techniciansModalMessage.textContent =
                "No hay técnicos disponibles para asignar.";
        }

        technicianSearch.focus();

    } catch (error) {
        console.error("Error al cargar técnicos:", error);

        technicianOptions.innerHTML = `
            <div class="documenter-empty">
                <i class="bi bi-exclamation-circle"></i>
                <span>No se pudieron cargar los técnicos.</span>
            </div>
        `;

        techniciansModalMessage.textContent =
            error.message || "Ocurrió un error al cargar los técnicos.";
    }
}

technicianSearch?.addEventListener("input", renderizarTecnicos);

clearTechnicianSearch?.addEventListener("click", function () {
    technicianSearch.value = "";
    renderizarTecnicos();
    technicianSearch.focus();
});

document.getElementById("manageTechniciansBtn")
    ?.addEventListener("click", abrirModalTecnicos);

document.getElementById("closeTechniciansModal")
    ?.addEventListener("click", cerrarModalTecnicos);

document.getElementById("cancelTechniciansModal")
    ?.addEventListener("click", cerrarModalTecnicos);

techniciansModal?.addEventListener("click", function (event) {
    if (event.target === techniciansModal) {
        cerrarModalTecnicos();
    }
});

saveTechniciansBtn?.addEventListener("click", async function () {
    if (!assignmentId || guardandoTecnicos) return;

    const boton = this;
    const contenidoOriginal = boton.innerHTML;

    guardandoTecnicos = true;
    boton.disabled = true;
    boton.innerHTML = `
        <span class="documenter-save-spinner" aria-hidden="true"></span>
        Guardando...
    `;

    techniciansModalMessage.textContent = "";

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tecnicos_ids: tecnicosSeleccionadosIds.map(Number)
                })
            }
        );

        if (!respuesta.ok) {
            let mensaje = "No se pudieron guardar los técnicos.";

            try {
                const detalle = await respuesta.json();
                mensaje = detalle.detail || mensaje;
            } catch {
                // Mantiene el mensaje predeterminado.
            }

            throw new Error(
                typeof mensaje === "string"
                    ? mensaje
                    : JSON.stringify(mensaje)
            );
        }

        techniciansModal.classList.remove("show");

        await cargarAsignacion();

        mostrarNotificacion(
            "Los técnicos responsables se actualizaron correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al guardar los técnicos:", error);

        techniciansModalMessage.textContent =
            error.message || "No se pudieron guardar los técnicos.";

    } finally {
        guardandoTecnicos = false;
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
});


configurarBotonDocumentador();


/* =====================================================
   ADMINISTRAR PLANTILLAS DE CHECKLIST
   ===================================================== */

const manageChecklistTemplatesModal = document.getElementById(
    "manageChecklistTemplatesModal"
);
const manageChecklistTemplatesListView = document.getElementById(
    "checklistTemplatesListView"
);
const manageChecklistTemplateFormView = document.getElementById(
    "checklistTemplateFormView"
);
const manageChecklistTemplatesList = document.getElementById(
    "manageChecklistTemplatesList"
);
const manageChecklistTemplatesMessage = document.getElementById(
    "manageChecklistTemplatesMessage"
);
const manageChecklistTemplatesTitle = document.getElementById(
    "manageChecklistTemplatesTitle"
);
const manageChecklistTemplatesSubtitle = document.getElementById(
    "manageChecklistTemplatesSubtitle"
);

const checklistTemplateIdInput = document.getElementById(
    "checklistTemplateId"
);
const checklistTemplateDocumentType = document.getElementById(
    "checklistTemplateDocumentType"
);
const checklistTemplateNameInput = document.getElementById(
    "checklistTemplateName"
);
const checklistTemplateFormDescription = document.getElementById(
    "checklistTemplateFormDescription"
);
const checklistTemplateFormItems = document.getElementById(
    "checklistTemplateFormItems"
);
const checklistTemplateFormMessage = document.getElementById(
    "checklistTemplateFormMessage"
);
const saveChecklistTemplateBtn = document.getElementById(
    "saveChecklistTemplateBtn"
);

let plantillasChecklist = [];
let tiposDocumentoChecklist = [];
let requisitosFotograficosChecklist = [];
let itemsPlantillaOriginales = [];
let guardandoPlantillaChecklist = false;

function mostrarMensajeAdministracionChecklist(
    mensaje,
    tipo = "info",
    formulario = false
) {
    const elemento = formulario
        ? checklistTemplateFormMessage
        : manageChecklistTemplatesMessage;

    if (!elemento) return;

    elemento.className = "checklist-template-message";

    if (tipo === "danger") {
        elemento.classList.add("error");
    }

    elemento.textContent = mensaje;
    elemento.hidden = false;
}

function ocultarMensajeAdministracionChecklist(formulario = false) {
    const elemento = formulario
        ? checklistTemplateFormMessage
        : manageChecklistTemplatesMessage;

    if (!elemento) return;

    elemento.textContent = "";
    elemento.hidden = true;
}

async function solicitarAPIChecklist(url, opciones = {}) {
    const respuesta = await apiFetch(url, opciones);

    if (!respuesta.ok) {
        let mensaje = `Error HTTP ${respuesta.status}`;

        try {
            const detalle = await respuesta.json();

            if (typeof detalle.detail === "string") {
                mensaje = detalle.detail;
            } else if (detalle.detail) {
                mensaje = JSON.stringify(detalle.detail);
            }
        } catch {
            // Conserva el mensaje HTTP si la respuesta no es JSON.
        }

        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    const tipoContenido = respuesta.headers.get("content-type") || "";

    if (tipoContenido.includes("application/json")) {
        return respuesta.json();
    }

    return null;
}

function mostrarVistaListaPlantillas() {
    if (manageChecklistTemplatesListView) {
        manageChecklistTemplatesListView.hidden = false;
    }

    if (manageChecklistTemplateFormView) {
        manageChecklistTemplateFormView.hidden = true;
    }

    if (manageChecklistTemplatesTitle) {
        manageChecklistTemplatesTitle.textContent =
            "Plantillas de checklist";
    }

    if (manageChecklistTemplatesSubtitle) {
        manageChecklistTemplatesSubtitle.textContent =
            "Administra los requisitos por tipo de documento.";
    }
}

function mostrarVistaFormularioPlantilla(esEdicion = false) {
    if (manageChecklistTemplatesListView) {
        manageChecklistTemplatesListView.hidden = true;
    }

    if (manageChecklistTemplateFormView) {
        manageChecklistTemplateFormView.hidden = false;
    }

    if (manageChecklistTemplatesTitle) {
        manageChecklistTemplatesTitle.textContent = esEdicion
            ? "Editar plantilla"
            : "Nueva plantilla";
    }

    if (manageChecklistTemplatesSubtitle) {
        manageChecklistTemplatesSubtitle.textContent =
            "Configura el tipo de documento y sus requisitos fotográficos.";
    }

    ocultarMensajeAdministracionChecklist(true);
}

function cerrarAdministracionPlantillas() {
    if (guardandoPlantillaChecklist) return;

    manageChecklistTemplatesModal?.classList.remove("show");
}

async function cargarDatosAdministracionChecklist() {
    const [plantillas, tiposDocumento, requisitos] = await Promise.all([
        solicitarAPIChecklist(`${API_URL}/plantillas-checklist/`),
        solicitarAPIChecklist(`${API_URL}/tipos-documento/`),
        solicitarAPIChecklist(`${API_URL}/requisitos-fotograficos/`)
    ]);

    plantillasChecklist = Array.isArray(plantillas) ? plantillas : [];
    tiposDocumentoChecklist = Array.isArray(tiposDocumento)
        ? tiposDocumento
        : [];
    requisitosFotograficosChecklist = Array.isArray(requisitos)
        ? requisitos
        : [];

    renderizarTiposDocumentoChecklist();
    renderizarListaPlantillasChecklist();
}

function renderizarTiposDocumentoChecklist(tipoSeleccionado = "") {
    if (!checklistTemplateDocumentType) return;

    checklistTemplateDocumentType.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccionar tipo de documento";

    checklistTemplateDocumentType.appendChild(opcionInicial);

    tiposDocumentoChecklist.forEach(tipo => {
        const opcion = document.createElement("option");
        opcion.value = tipo.id;
        opcion.textContent = tipo.nombre || `Tipo ${tipo.id}`;

        checklistTemplateDocumentType.appendChild(opcion);
    });

    checklistTemplateDocumentType.value = tipoSeleccionado
        ? String(tipoSeleccionado)
        : "";
}


function renderizarListaPlantillasChecklist() {
    if (!manageChecklistTemplatesList) return;

    manageChecklistTemplatesList.replaceChildren();

    if (plantillasChecklist.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "checklist-template-empty";
        vacio.textContent =
            "Todavía no hay plantillas registradas. Crea una para comenzar.";

        manageChecklistTemplatesList.appendChild(vacio);
        return;
    }

    plantillasChecklist.forEach(plantilla => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "checklist-template-list-item";

        const informacion = document.createElement("div");
        informacion.className = "checklist-template-list-info";

        const nombre = document.createElement("strong");
        nombre.textContent = plantilla.nombre || "Plantilla sin nombre";

        const tipo = tiposDocumentoChecklist.find(
            elemento =>
                Number(elemento.id) === Number(plantilla.tipo_documento_id)
        );

        const tipoTexto = document.createElement("span");
        tipoTexto.textContent =
            `Tipo de documento: ${tipo?.nombre || plantilla.tipo_documento_id}`;

        const descripcion = document.createElement("p");
        descripcion.textContent =
            plantilla.descripcion || "Sin descripción";

        const resumen = document.createElement("span");
        const cantidadItems = Array.isArray(plantilla.items)
            ? plantilla.items.length
            : 0;

        resumen.textContent =
            `${cantidadItems} ${cantidadItems === 1 ? "ítem" : "ítems"} · ` +
            (plantilla.activo ? "Activa" : "Inactiva");

        informacion.append(nombre, tipoTexto, descripcion, resumen);

        const acciones = document.createElement("div");
        acciones.className = "checklist-template-list-actions";

        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "btn-secondary-custom";
        editar.innerHTML = '<i class="bi bi-pencil"></i> Editar';

        editar.addEventListener("click", () => {
            prepararEdicionPlantilla(plantilla);
        });

        acciones.appendChild(editar);
        tarjeta.append(informacion, acciones);

        manageChecklistTemplatesList.appendChild(tarjeta);
    });
}

function prepararNuevaPlantillaChecklist() {
    ocultarMensajeAdministracionChecklist(true);
    ocultarMensajeAdministracionChecklist();

    checklistTemplateIdInput.value = "";
    checklistTemplateNameInput.value = "";
    checklistTemplateFormDescription.value = "";

    itemsPlantillaOriginales = [];

    renderizarTiposDocumentoChecklist();
    checklistTemplateDocumentType.disabled = false;

    checklistTemplateFormItems.replaceChildren();

    mostrarVistaFormularioPlantilla(false);
}

function prepararEdicionPlantilla(plantilla) {
    ocultarMensajeAdministracionChecklist(true);
    ocultarMensajeAdministracionChecklist();

    checklistTemplateIdInput.value = plantilla.id;
    checklistTemplateNameInput.value = plantilla.nombre || "";
    checklistTemplateFormDescription.value = plantilla.descripcion || "";

    renderizarTiposDocumentoChecklist(plantilla.tipo_documento_id);

    // El tipo se conserva al editar para evitar conflictos
    // con la restricción de una plantilla por tipo de documento.
    checklistTemplateDocumentType.disabled = true;

    itemsPlantillaOriginales = (plantilla.items || []).map(item => ({
        ...item
    }));

    renderizarGruposChecklist(itemsPlantillaOriginales);

    mostrarVistaFormularioPlantilla(true);
}

function obtenerRequisitosParaTipoDocumento(tipoDocumentoId) {
    if (!tipoDocumentoId) return [];

    return requisitosFotograficosChecklist.filter(requisito => {
        if (requisito.activo === false) return false;

        const tiposAsociados = Array.isArray(requisito.tipos_documento_ids)
            ? requisito.tipos_documento_ids
            : [];

        return tiposAsociados.some(
            id => Number(id) === Number(tipoDocumentoId)
        );
    });
}

function renderizarGruposChecklist(items = []) {
    if (!checklistTemplateFormItems) return;

    checklistTemplateFormItems.replaceChildren();

    const tipoDocumentoId = checklistTemplateDocumentType.value;

    if (!tipoDocumentoId) {
        const mensaje = document.createElement("div");
        mensaje.className = "checklist-template-empty";
        mensaje.textContent =
            "Selecciona un tipo de documento para mostrar sus requerimientos fotográficos.";

        checklistTemplateFormItems.appendChild(mensaje);
        return;
    }

    const requisitos = obtenerRequisitosParaTipoDocumento(tipoDocumentoId);
    const requisitosPorId = new Map(
        requisitos.map(requisito => [String(requisito.id), requisito])
    );

    // Conserva los requerimientos de los ítems existentes,
    // aunque ya no estén activos o asociados al tipo de documento.
    items.forEach(item => {
        const requisitoId = String(item.requisito_fotografico_id);

        if (!requisitosPorId.has(requisitoId)) {
            requisitosPorId.set(requisitoId, {
                id: item.requisito_fotografico_id,
                nombre: `Requerimiento actual (${requisitoId})`,
                descripcion: ""
            });
        }
    });

    if (requisitosPorId.size === 0) {
        const mensaje = document.createElement("div");
        mensaje.className = "checklist-template-empty";
        mensaje.textContent =
            "No hay requerimientos fotográficos asociados a este tipo de documento.";

        checklistTemplateFormItems.appendChild(mensaje);
        return;
    }

    requisitosPorId.forEach(requisito => {
        const grupo = document.createElement("section");
        grupo.className = "checklist-template-requirement-group";
        grupo.dataset.requisitoId = requisito.id;

        const encabezado = document.createElement("div");
        encabezado.className = "checklist-template-requirement-header";

        const informacion = document.createElement("div");

        const titulo = document.createElement("h5");
        titulo.textContent = requisito.nombre ||
            `Requerimiento ${requisito.id}`;

        const descripcion = document.createElement("p");
        descripcion.textContent = requisito.descripcion ||
            "Define los ítems específicos que deben verificarse.";

        informacion.append(titulo, descripcion);

        const botonAgregar = document.createElement("button");
        botonAgregar.type = "button";
        botonAgregar.className = "btn-secondary-custom";
        botonAgregar.innerHTML =
            '<i class="bi bi-plus-lg"></i> Agregar ítem específico';

        encabezado.append(informacion, botonAgregar);

        const contenedorItems = document.createElement("div");
        contenedorItems.className = "checklist-template-requirement-items";

        grupo.append(encabezado, contenedorItems);
        checklistTemplateFormItems.appendChild(grupo);

        const itemsDelRequisito = items
            .filter(item =>
                Number(item.requisito_fotografico_id) === Number(requisito.id)
            )
            .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

        itemsDelRequisito.forEach(item => {
            agregarItemFormularioChecklist(
                item,
                requisito.id,
                contenedorItems
            );
        });

        botonAgregar.addEventListener("click", () => {
            agregarItemFormularioChecklist(
                null,
                requisito.id,
                contenedorItems
            );
        });
    });
}

function agregarItemFormularioChecklist(
    item = null,
    requisitoId,
    contenedor
) {
    if (!checklistTemplateFormItems) return;

    const grupoItems = contenedor || checklistTemplateFormItems;

    const fila = document.createElement("div");
    fila.className =
        "checklist-template-item checklist-template-form-item";

    if (item?.id) {
        fila.dataset.itemId = item.id;
    }

    // Fila compacta que siempre permanece visible.
    const encabezado = document.createElement("div");
    encabezado.className = "checklist-template-item-summary";

    const tituloResumen = document.createElement("span");
    tituloResumen.className = "checklist-template-item-summary-title";
    tituloResumen.textContent =
        item?.titulo?.trim() || "Nuevo ítem sin título";

    const acciones = document.createElement("div");
    acciones.className = "checklist-template-item-actions";

    const botonEstado = document.createElement("button");
    botonEstado.type = "button";
    botonEstado.className = "btn-secondary-custom checklist-item-toggle";

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className =
        "btn-secondary-custom checklist-item-remove";
    botonEliminar.innerHTML =
        '<i class="bi bi-trash3"></i> Quitar';

    // Contenedor de los campos editables.
    const campos = document.createElement("div");
    campos.className = "checklist-template-item-fields";

    const grupoTitulo = document.createElement("div");
    grupoTitulo.className = "mb-3";

    const etiquetaTitulo = document.createElement("label");
    etiquetaTitulo.className = "form-label";
    etiquetaTitulo.textContent = "Título del ítem";

    const inputTitulo = document.createElement("input");
    inputTitulo.type = "text";
    inputTitulo.className = "form-control checklist-item-title";
    inputTitulo.maxLength = 200;
    inputTitulo.required = true;
    inputTitulo.value = item?.titulo || "";

    const grupoDescripcion = document.createElement("div");
    grupoDescripcion.className = "mb-3";

    const etiquetaDescripcion = document.createElement("label");
    etiquetaDescripcion.className = "form-label";
    etiquetaDescripcion.textContent = "Descripción";

    const inputDescripcion = document.createElement("textarea");
    inputDescripcion.className =
        "form-control checklist-item-description";
    inputDescripcion.rows = 2;
    inputDescripcion.value = item?.descripcion || "";

    const grupoOrden = document.createElement("div");
    grupoOrden.className = "mb-3";

    const etiquetaOrden = document.createElement("label");
    etiquetaOrden.className = "form-label";
    etiquetaOrden.textContent = "Orden";

    const inputOrden = document.createElement("input");
    inputOrden.type = "number";
    inputOrden.className = "form-control checklist-item-order";
    inputOrden.min = "1";
    inputOrden.step = "1";

    const cantidadItems = checklistTemplateFormItems.querySelectorAll(
        ".checklist-template-form-item"
    ).length;

    inputOrden.value = item?.orden ?? cantidadItems + 1;
    inputOrden.required = true;

    const grupoObligatorio = document.createElement("div");
    grupoObligatorio.className = "form-check mb-3";

    const inputObligatorio = document.createElement("input");
    inputObligatorio.type = "checkbox";
    inputObligatorio.className =
        "form-check-input checklist-item-required";
    inputObligatorio.checked = item
        ? Boolean(item.obligatorio)
        : true;

    const etiquetaObligatorio = document.createElement("label");
    etiquetaObligatorio.className = "form-check-label";
    etiquetaObligatorio.textContent = "Ítem obligatorio";

    // Agrupar los campos.
    grupoTitulo.append(etiquetaTitulo, inputTitulo);
    grupoDescripcion.append(etiquetaDescripcion, inputDescripcion);
    grupoOrden.append(etiquetaOrden, inputOrden);
    grupoObligatorio.append(inputObligatorio, etiquetaObligatorio);

    campos.append(
        grupoTitulo,
        grupoDescripcion,
        grupoOrden,
        grupoObligatorio
    );

    // Actualizar el título de la fila mientras se escribe.
    inputTitulo.addEventListener("input", () => {
        tituloResumen.textContent =
            inputTitulo.value.trim() || "Nuevo ítem sin título";
    });

    // Contraer o expandir la tarjeta.
    function actualizarEstadoTarjeta(contraida) {
        fila.classList.toggle("is-collapsed", contraida);

        if (contraida) {
            botonEstado.innerHTML =
                '<i class="bi bi-pencil"></i> Editar';
            botonEstado.setAttribute(
                "aria-label",
                "Editar ítem"
            );
            botonEstado.title = "Editar ítem";
        } else {
            botonEstado.innerHTML =
                '<i class="bi bi-check-lg"></i> Listo';
            botonEstado.setAttribute(
                "aria-label",
                "Terminar edición del ítem"
            );
            botonEstado.title = "Contraer ítem";
        }
    }

    botonEstado.addEventListener("click", () => {
        const estaContraida = fila.classList.contains("is-collapsed");

        if (!estaContraida && !inputTitulo.value.trim()) {
            inputTitulo.reportValidity();
            inputTitulo.focus();
            return;
        }

        actualizarEstadoTarjeta(!estaContraida);
    });

    // Quitar únicamente este ítem.
    botonEliminar.addEventListener("click", () => {
        fila.remove();
    });

    acciones.append(botonEstado, botonEliminar);
    encabezado.append(tituloResumen, acciones);

    fila.append(encabezado, campos);
    grupoItems.appendChild(fila);

    // Los ítems existentes comienzan contraídos.
    // Los nuevos comienzan abiertos para facilitar su registro.
    actualizarEstadoTarjeta(Boolean(item?.id));
}

function obtenerItemsFormularioChecklist() {
    const filas = Array.from(
        checklistTemplateFormItems.querySelectorAll(
            ".checklist-template-form-item"
        )
    );

    if (filas.length === 0) {
        throw new Error(
            "Agrega al menos un ítem específico a los requerimientos fotográficos."
        );
    }

    const items = [];

    for (let indice = 0; indice < filas.length; indice++) {
        const fila = filas[indice];

        const grupo = fila.closest(
            ".checklist-template-requirement-group"
        );

        const requisitoId = grupo?.dataset.requisitoId;

        const titulo = fila.querySelector(
            ".checklist-item-title"
        ).value.trim();

        const descripcion = fila.querySelector(
            ".checklist-item-description"
        ).value.trim();

        const obligatorio = fila.querySelector(
            ".checklist-item-required"
        ).checked;

        const ordenTexto = fila.querySelector(
            ".checklist-item-order"
        ).value;

        const orden = Number(ordenTexto);

        if (!requisitoId) {
            throw new Error(
                `No se pudo identificar el requerimiento del ítem ${indice + 1}.`
            );
        }

        if (!titulo) {
            throw new Error(
                `Ingresa el título del ítem ${indice + 1}.`
            );
        }

        if (!Number.isInteger(orden) || orden < 1) {
            throw new Error(
                `El orden del ítem ${indice + 1} debe ser un entero mayor que cero.`
            );
        }

        items.push({
            id: fila.dataset.itemId
                ? Number(fila.dataset.itemId)
                : null,
            requisito_fotografico_id: Number(requisitoId),
            titulo,
            descripcion: descripcion || null,
            obligatorio,
            orden
        });
    }

    return items;
}

async function guardarItemsPlantilla(plantillaId, itemsFormulario) {
    const originales = itemsPlantillaOriginales;
    const idsConservados = new Set(
        itemsFormulario
            .filter(item => item.id)
            .map(item => Number(item.id))
    );

    // Actualizar los ítems existentes o crear los nuevos.
    for (const item of itemsFormulario) {
        const datos = {
            requisito_fotografico_id: item.requisito_fotografico_id,
            titulo: item.titulo,
            descripcion: item.descripcion,
            obligatorio: item.obligatorio,
            orden: item.orden
        };

        if (item.id) {
            await solicitarAPIChecklist(
                `${API_URL}/plantillas-checklist/items/${item.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                }
            );
        } else {
            await solicitarAPIChecklist(
                `${API_URL}/plantillas-checklist/${plantillaId}/items`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                }
            );
        }
    }

    // Eliminar los ítems retirados del formulario.
    for (const original of originales) {
        if (!idsConservados.has(Number(original.id))) {
            await solicitarAPIChecklist(
                `${API_URL}/plantillas-checklist/items/${original.id}`,
                { method: "DELETE" }
            );
        }
    }
}

async function abrirAdministracionPlantillas() {
    if (!manageChecklistTemplatesModal) {
        mostrarError(
            "No se encontró el modal de administración de plantillas. Verifica que hayas agregado el HTML correspondiente."
        );
        return;
    }

    manageChecklistTemplatesModal.classList.add("show");
    mostrarVistaListaPlantillas();

    if (manageChecklistTemplatesList) {
        manageChecklistTemplatesList.textContent =
            "Cargando plantillas...";
    }

    ocultarMensajeAdministracionChecklist();

    try {
        await cargarDatosAdministracionChecklist();
    } catch (error) {
        console.error("Error al cargar las plantillas:", error);

        manageChecklistTemplatesList.replaceChildren();

        mostrarMensajeAdministracionChecklist(
            error.message || "No se pudieron cargar las plantillas.",
            "danger"
        );
    }
}

document.getElementById("manageChecklistTemplatesBtn")
    ?.addEventListener("click", abrirAdministracionPlantillas);

document.getElementById("closeManageChecklistTemplatesModal")
    ?.addEventListener("click", cerrarAdministracionPlantillas);

document.getElementById("cancelManageChecklistTemplates")
    ?.addEventListener("click", cerrarAdministracionPlantillas);

manageChecklistTemplatesModal?.addEventListener("click", event => {
    if (event.target === manageChecklistTemplatesModal) {
        cerrarAdministracionPlantillas();
    }
});

document.getElementById("newChecklistTemplateBtn")
    ?.addEventListener("click", () => {
        prepararNuevaPlantillaChecklist();
    });

document.getElementById("backChecklistTemplateListBtn")
    ?.addEventListener("click", () => {
        if (guardandoPlantillaChecklist) return;

        mostrarVistaListaPlantillas();
        ocultarMensajeAdministracionChecklist();

        cargarDatosAdministracionChecklist().catch(error => {
            console.error("Error al actualizar las plantillas:", error);
            mostrarMensajeAdministracionChecklist(
                error.message || "No se pudo actualizar la lista.",
                "danger"
            );
        });
    });

checklistTemplateDocumentType?.addEventListener("change", () => {
    renderizarGruposChecklist();
});

saveChecklistTemplateBtn?.addEventListener("click", async function () {
    if (guardandoPlantillaChecklist) return;

    const nombre = checklistTemplateNameInput.value.trim();
    const tipoDocumentoId = checklistTemplateDocumentType.value;
    const descripcion = checklistTemplateFormDescription.value.trim();
    const plantillaId = checklistTemplateIdInput.value;

    if (!tipoDocumentoId) {
        mostrarMensajeAdministracionChecklist(
            "Selecciona un tipo de documento.",
            "danger",
            true
        );
        return;
    }

    if (!nombre) {
        mostrarMensajeAdministracionChecklist(
            "Ingresa el nombre de la plantilla.",
            "danger",
            true
        );
        return;
    }

    let itemsFormulario;

    try {
        itemsFormulario = obtenerItemsFormularioChecklist();
    } catch (error) {
        mostrarMensajeAdministracionChecklist(
            error.message,
            "danger",
            true
        );
        return;
    }

    const boton = this;
    const contenidoOriginal = boton.innerHTML;

    guardandoPlantillaChecklist = true;
    boton.disabled = true;
    boton.innerHTML = `
        <span class="documenter-save-spinner" aria-hidden="true"></span>
        Guardando...
    `;

    ocultarMensajeAdministracionChecklist(true);

    try {
        let plantillaGuardada;

        if (plantillaId) {
            plantillaGuardada = await solicitarAPIChecklist(
                `${API_URL}/plantillas-checklist/${plantillaId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nombre,
                        descripcion: descripcion || null,
                        activo
                    })
                }
            );
        } else {
            plantillaGuardada = await solicitarAPIChecklist(
                `${API_URL}/plantillas-checklist/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        tipo_documento_id: Number(tipoDocumentoId),
                        nombre,
                        descripcion: descripcion || null,
                        activo: true
                    })
                }
            );
        }

        const idGuardado = plantillaGuardada?.id || plantillaId;

        if (!idGuardado) {
            throw new Error(
                "La API no devolvió el identificador de la plantilla guardada."
            );
        }

        await guardarItemsPlantilla(idGuardado, itemsFormulario);

        mostrarVistaListaPlantillas();

        await cargarDatosAdministracionChecklist();

        mostrarMensajeAdministracionChecklist(
            "La plantilla y sus ítems se guardaron correctamente.",
            "info"
        );

    } catch (error) {
        console.error("Error al guardar la plantilla:", error);

        mostrarMensajeAdministracionChecklist(
            error.message ||
                "No se pudo guardar la plantilla y sus ítems.",
            "danger",
            true
        );
    } finally {
        guardandoPlantillaChecklist = false;
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
});

/* =====================================================
   CHECKLIST GENERADO DE EVIDENCIAS
   ===================================================== */

const checklistEmptyState = document.getElementById("checklistEmptyState");
const checklistContent = document.getElementById("checklistContent");
const checklistItemsContainer = document.getElementById("checklistItems");
const checklistMessage = document.getElementById("checklistMessage");
const generateChecklistBtn = document.getElementById("generateChecklistBtn");
const generatedChecklistStatus = document.getElementById("generatedChecklistStatus");
const generatedChecklistFooter = document.getElementById("generatedChecklistFooter");
const publishChecklistBtn = document.getElementById("publishChecklistBtn");
const startChecklistUpdateBtn = document.getElementById(
    "startChecklistUpdateBtn"
);
const discardChecklistUpdateBtn = document.getElementById(
    "discardChecklistUpdateBtn"
);
const selectChecklistItemsModal = document.getElementById("selectChecklistItemsModal");
const selectChecklistItemsContainer = document.getElementById("selectChecklistItemsContainer");
const selectChecklistItemsMessage = document.getElementById("selectChecklistItemsMessage");
const confirmGenerateChecklistBtn = document.getElementById("confirmGenerateChecklistBtn");

const generatedChecklistItemModal = document.getElementById("generatedChecklistItemModal");

const discardChecklistUpdateModal = document.getElementById(
    "discardChecklistUpdateModal"
);

const confirmDiscardChecklistUpdateBtn = document.getElementById(
    "confirmDiscardChecklistUpdateBtn"
);

const publishChecklistModal = document.getElementById(
    "publishChecklistModal"
);

const confirmPublishChecklistBtn = document.getElementById(
    "confirmPublishChecklistBtn"
);

let publicandoChecklist = false;

const deleteGeneratedChecklistItemMessage = document.getElementById(
    "deleteGeneratedChecklistItemMessage"
);

const confirmDeleteGeneratedChecklistItemBtn = document.getElementById(
    "confirmDeleteGeneratedChecklistItemBtn"
);

let itemChecklistEliminando = null;
let eliminandoItemChecklist = false;
const generatedChecklistItemModalLabel = document.getElementById("generatedChecklistItemModalLabel");
const generatedItemTitle = document.getElementById("generatedItemTitle");
const generatedItemDescription = document.getElementById("generatedItemDescription");
const generatedItemRequired = document.getElementById("generatedItemRequired");
const generatedChecklistItemMessage = document.getElementById("generatedChecklistItemMessage");
const saveGeneratedChecklistItemBtn = document.getElementById("saveGeneratedChecklistItemBtn");

let checklistActual = null;
let borradorActualizacion = null;
let iniciandoActualizacionChecklist = false;
let descartandoActualizacionChecklist = false;
let plantillaParaGenerar = null;
let requisitoItemActual = null;
let itemEditandoActual = null;
let requisitosChecklistConfigurados = [];
let cargandoChecklist = false;
let guardandoItemChecklist = false;


/* =====================================================
   UTILIDADES DEL CHECKLIST
   ===================================================== */

function mostrarMensajeChecklist(mensaje, esError = false) {
    if (!checklistMessage) return;

    checklistMessage.className = "checklist-template-message";

    if (esError) {
        checklistMessage.classList.add("error");
    }

    checklistMessage.textContent = mensaje;
    checklistMessage.hidden = false;
}

function ocultarMensajeChecklist() {
    if (!checklistMessage) return;

    checklistMessage.textContent = "";
    checklistMessage.hidden = true;
}

function mostrarMensajeSeleccionChecklist(mensaje, esError = false) {
    if (!selectChecklistItemsMessage) return;

    selectChecklistItemsMessage.className = "checklist-template-message";

    if (esError) {
        selectChecklistItemsMessage.classList.add("error");
    }

    selectChecklistItemsMessage.textContent = mensaje;
    selectChecklistItemsMessage.hidden = false;
}

function ocultarMensajeSeleccionChecklist() {
    if (!selectChecklistItemsMessage) return;

    selectChecklistItemsMessage.textContent = "";
    selectChecklistItemsMessage.hidden = true;
}

function mostrarMensajeItemGenerado(mensaje, esError = false) {
    if (!generatedChecklistItemMessage) return;

    generatedChecklistItemMessage.className = "checklist-template-message";

    if (esError) {
        generatedChecklistItemMessage.classList.add("error");
    }

    generatedChecklistItemMessage.textContent = mensaje;
    generatedChecklistItemMessage.hidden = false;
}

function ocultarMensajeItemGenerado() {
    if (!generatedChecklistItemMessage) return;

    generatedChecklistItemMessage.textContent = "";
    generatedChecklistItemMessage.hidden = true;
}

function obtenerEstadoChecklist(checklist) {
    return String(checklist?.estado || "borrador").toLowerCase();
}

function checklistEstaPublicado() {
    return obtenerEstadoChecklist(checklistActual) === "publicado";
}

function checklistSePuedeEditar() {
    return Boolean(
        borradorActualizacion ||
        (
            checklistActual &&
            !checklistEstaPublicado()
        )
    );
}

function obtenerChecklistEdicion() {
    return borradorActualizacion || checklistActual;
}

function abrirModalChecklist(elemento) {
    if (!elemento || typeof bootstrap === "undefined") {
        console.error("No se pudo abrir el modal del checklist.");
        return;
    }

    bootstrap.Modal.getOrCreateInstance(elemento).show();
}

function cerrarModalChecklist(elemento) {
    if (!elemento || typeof bootstrap === "undefined") return;

    bootstrap.Modal.getInstance(elemento)?.hide();
}

async function solicitarChecklist(url, opciones = {}) {
    const respuesta = await apiFetch(url, opciones);

    if (!respuesta.ok) {
        let mensaje = `Error HTTP ${respuesta.status}`;

        try {
            const detalle = await respuesta.json();
            mensaje = detalle.detail || mensaje;
        } catch {
            // Se conserva el mensaje HTTP.
        }

        const error = new Error(mensaje);
        error.status = respuesta.status;
        throw error;
    }

    if (respuesta.status === 204) {
        return null;
    }

    const tipoContenido = respuesta.headers.get("content-type") || "";

    if (tipoContenido.includes("application/json")) {
        return respuesta.json();
    }

    return null;
}


/* =====================================================
   REQUERIMIENTOS FOTOGRÁFICOS DE CONFIGURACIÓN
   ===================================================== */

async function cargarRequisitosChecklistConfigurados() {
    if (requisitosChecklistConfigurados.length > 0) {
        return requisitosChecklistConfigurados;
    }

    const requisitos = await solicitarChecklist(
        `${API_URL}/requisitos-fotograficos/`
    );

    requisitosChecklistConfigurados = Array.isArray(requisitos)
        ? requisitos
        : [];

    return requisitosChecklistConfigurados;
}

function obtenerRequisitosDelTipoDocumento() {
    const asignacion = window.asignacionDetalleActual;
    const tipoDocumentoId = asignacion?.tipo_documento_id;

    if (!tipoDocumentoId) return [];

    return requisitosChecklistConfigurados.filter(requisito => {
        if (requisito.activo === false) return false;

        const tiposAsociados = Array.isArray(requisito.tipos_documento_ids)
            ? requisito.tipos_documento_ids
            : [];

        return tiposAsociados.some(
            id => Number(id) === Number(tipoDocumentoId)
        );
    });
}

function obtenerRequisitoPorId(requisitoId) {
    return requisitosChecklistConfigurados.find(
        requisito => Number(requisito.id) === Number(requisitoId)
    );
}

function obtenerNombreRequisito(item) {
    const requisito = obtenerRequisitoPorId(item.requisito_fotografico_id);

    return (
        requisito?.nombre ||
        item.requisito_nombre ||
        item.requisito_fotografico?.nombre ||
        `Requerimiento ${item.requisito_fotografico_id}`
    );
}

function obtenerDescripcionRequisito(item) {
    const requisito = obtenerRequisitoPorId(item.requisito_fotografico_id);

    return (
        requisito?.descripcion ||
        item.requisito_descripcion ||
        item.requisito_fotografico?.descripcion ||
        ""
    );
}


/* =====================================================
   CARGAR CHECKLIST DE LA ASIGNACIÓN
   ===================================================== */

async function cargarChecklistAsignacion() {
    if (!assignmentId || cargandoChecklist) return;

    cargandoChecklist = true;
    ocultarMensajeChecklist();

    try {
        await cargarRequisitosChecklistConfigurados();

        const data = await solicitarChecklist(
            `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}/checklist`
        );

        checklistActual = data;

        let borrador = null;

        // Buscar si existe una actualización temporal.
        try {
            borrador = await solicitarChecklist(
                `${API_URL}/asignaciones/checklist/${encodeURIComponent(data.id)}/actualizacion`
            );
        } catch (error) {
            if (error.status !== 404) {
                throw error;
            }
        }

        borradorActualizacion = borrador;

        if (checklistEmptyState) {
            checklistEmptyState.hidden = true;
        }

        if (checklistContent) {
            checklistContent.hidden = false;
        }

        // Si existe un borrador, mostrarlo sin modificar
        // el objeto correspondiente al checklist publicado.
        renderizarChecklistAsignacion(
            borrador || data,
            Boolean(borrador)
        );

    } catch (error) {
        if (error.status === 404) {
            checklistActual = null;
            borradorActualizacion = null;

            if (checklistEmptyState) {
                checklistEmptyState.hidden = false;
            }

            if (checklistContent) {
                checklistContent.hidden = true;
            }

            return;
        }

        console.error("Error al cargar el checklist:", error);

        mostrarMensajeChecklist(
            error.message || "No se pudo cargar el checklist.",
            true
        );

    } finally {
        cargandoChecklist = false;
    }
}


/* =====================================================
   GENERAR CHECKLIST: SELECCIÓN DE ÍTEMS
   ===================================================== */

async function abrirSeleccionChecklist() {
    if (!assignmentId) return;

    plantillaParaGenerar = null;

    if (confirmGenerateChecklistBtn) {
        confirmGenerateChecklistBtn.disabled = true;
    }

    ocultarMensajeChecklist();
    ocultarMensajeSeleccionChecklist();

    if (selectChecklistItemsContainer) {
        selectChecklistItemsContainer.innerHTML = `
            <div class="checklist-template-empty">
                Cargando plantilla...
            </div>
        `;
    }

    abrirModalChecklist(selectChecklistItemsModal);

    try {
        const asignacion = window.asignacionDetalleActual;
        const tipoDocumentoId = asignacion?.tipo_documento_id;

        if (!tipoDocumentoId) {
            throw new Error(
                "La asignación no contiene un tipo de documento válido."
            );
        }

        const plantilla = await solicitarChecklist(
            `${API_URL}/plantillas-checklist/tipo-documento/${encodeURIComponent(tipoDocumentoId)}`
        );

        if (!plantilla || !Array.isArray(plantilla.items)) {
            throw new Error(
                "No se encontró una plantilla válida para este tipo de documento."
            );
        }

        if (plantilla.activo === false) {
            throw new Error("La plantilla configurada se encuentra inactiva.");
        }

        if (plantilla.items.length === 0) {
            throw new Error("La plantilla no contiene ítems para seleccionar.");
        }

        plantillaParaGenerar = plantilla;

        renderizarSeleccionItemsPlantilla(plantilla.items);

        if (confirmGenerateChecklistBtn) {
            confirmGenerateChecklistBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error al cargar la plantilla:", error);

        if (selectChecklistItemsContainer) {
            selectChecklistItemsContainer.replaceChildren();
        }

        mostrarMensajeSeleccionChecklist(
            error.message || "No se pudo cargar la plantilla.",
            true
        );
    }
}

function renderizarSeleccionItemsPlantilla(items) {
    if (!selectChecklistItemsContainer) return;

    selectChecklistItemsContainer.replaceChildren();

    const grupos = new Map();

    // Agrupar los ítems según su requerimiento fotográfico.
    items.forEach(item => {
        const requisitoId = Number(item.requisito_fotografico_id);

        if (!grupos.has(requisitoId)) {
            grupos.set(requisitoId, []);
        }

        grupos.get(requisitoId).push(item);
    });

    grupos.forEach((itemsGrupo, requisitoId) => {
        const requisito = obtenerRequisitoPorId(requisitoId);

        const grupo = document.createElement("section");
        grupo.className = "checklist-selection-group";
        grupo.dataset.requisitoId = requisitoId;

        const encabezado = document.createElement("div");
        encabezado.className = "checklist-selection-header";

        // Checkbox general del requerimiento.
        const checkboxGrupo = document.createElement("input");
        checkboxGrupo.type = "checkbox";
        checkboxGrupo.className =
            "form-check-input checklist-selection-group-checkbox";
        checkboxGrupo.checked = true;
        checkboxGrupo.setAttribute(
            "aria-label",
            "Seleccionar todos los ítems de este requerimiento"
        );

        // Contenedor del título y descripción.
        const contenidoEncabezado = document.createElement("div");
        contenidoEncabezado.className =
            "checklist-selection-heading-content";

        const titulo = document.createElement("h6");
        titulo.textContent =
            requisito?.nombre ||
            itemsGrupo[0].requisito_fotografico?.nombre ||
            `Requerimiento ${requisitoId}`;

        const descripcion = document.createElement("p");
        descripcion.textContent =
            requisito?.descripcion ||
            itemsGrupo[0].requisito_fotografico?.descripcion ||
            "";

        contenidoEncabezado.appendChild(titulo);

        if (descripcion.textContent) {
            contenidoEncabezado.appendChild(descripcion);
        }

        encabezado.append(checkboxGrupo, contenidoEncabezado);

        const lista = document.createElement("div");
        lista.className = "checklist-selection-items";

        itemsGrupo
            .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
            .forEach(item => {
                const fila = document.createElement("label");
                fila.className = "checklist-selection-item";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className =
                    "form-check-input checklist-selection-item-checkbox";
                checkbox.value = item.id;
                checkbox.checked = true;

                const contenido = document.createElement("span");
                contenido.className = "checklist-selection-item-content";

                const nombre = document.createElement("strong");
                nombre.textContent = item.titulo || "Ítem sin título";

                const detalle = document.createElement("small");
                detalle.textContent = item.descripcion || "Sin descripción";

                contenido.append(nombre, detalle);
                fila.append(checkbox, contenido);
                lista.appendChild(fila);

                // Actualizar el estado del encabezado al cambiar un ítem.
                checkbox.addEventListener("change", () => {
                    actualizarCheckboxGrupo(grupo);
                });
            });

        // Seleccionar o deseleccionar todos los ítems del requerimiento.
        checkboxGrupo.addEventListener("change", () => {
            const checkboxesItems = grupo.querySelectorAll(
                ".checklist-selection-item-checkbox"
            );

            checkboxesItems.forEach(checkbox => {
                checkbox.checked = checkboxGrupo.checked;
            });

            actualizarCheckboxGrupo(grupo);
        });

        grupo.append(encabezado, lista);
        selectChecklistItemsContainer.appendChild(grupo);

        actualizarCheckboxGrupo(grupo);
    });
}

function actualizarCheckboxGrupo(grupo) {
    const checkboxGrupo = grupo.querySelector(
        ".checklist-selection-group-checkbox"
    );

    const checkboxesItems = Array.from(
        grupo.querySelectorAll(
            ".checklist-selection-item-checkbox"
        )
    );

    if (!checkboxGrupo || checkboxesItems.length === 0) return;

    const seleccionados = checkboxesItems.filter(
        checkbox => checkbox.checked
    ).length;

    checkboxGrupo.checked =
        seleccionados === checkboxesItems.length;

    checkboxGrupo.indeterminate =
        seleccionados > 0 &&
        seleccionados < checkboxesItems.length;
}

async function generarChecklistAsignacion() {
    if (!assignmentId || !plantillaParaGenerar) return;

    const seleccionados = Array.from(
        selectChecklistItemsContainer.querySelectorAll(
            ".checklist-selection-item-checkbox:checked"
        )
    ).map(checkbox => Number(checkbox.value));

    if (seleccionados.length === 0) {
        mostrarMensajeSeleccionChecklist(
            "Selecciona al menos un ítem para generar el checklist.",
            true
        );
        return;
    }

    const boton = confirmGenerateChecklistBtn;
    const contenidoOriginal = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML =
        '<span class="documenter-save-spinner" aria-hidden="true"></span> Generando...';

    try {
        const data = await solicitarChecklist(
            `${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}/checklist`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    item_plantilla_ids: seleccionados
                })
            }
        );

        checklistActual = data;

        cerrarModalChecklist(selectChecklistItemsModal);

        if (checklistEmptyState) checklistEmptyState.hidden = true;
        if (checklistContent) checklistContent.hidden = false;

        renderizarChecklistAsignacion(data);

        mostrarNotificacion(
            "El checklist se generó correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al generar el checklist:", error);

        mostrarMensajeSeleccionChecklist(
            error.message || "No se pudo generar el checklist.",
            true
        );
    } finally {
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}


/* =====================================================
   RENDERIZAR ÍTEMS AGRUPADOS POR REQUERIMIENTO
   ===================================================== */

function renderizarChecklistAsignacion(
    checklist,
    esBorradorActualizacion = false
) {
    if (!checklistItemsContainer) return;

    if (esBorradorActualizacion) {
        borradorActualizacion = checklist;
    } else {
        checklistActual = checklist;
    }

    checklistItemsContainer.replaceChildren();

    const items = Array.isArray(checklist?.items)
        ? [...checklist.items]
        : [];

    const publicado =
        !esBorradorActualizacion &&
        checklistEstaPublicado();

    const soloLectura = publicado;

    if (generatedChecklistStatus) {
        generatedChecklistStatus.textContent =
            esBorradorActualizacion
                ? "Borrador de actualización"
                : publicado
                    ? "Publicado"
                    : "Borrador";

        generatedChecklistStatus.classList.toggle(
            "is-published",
            publicado
        );
    }

    if (generatedChecklistFooter) {
        generatedChecklistFooter.hidden = false;
    }

    if (startChecklistUpdateBtn) {
        startChecklistUpdateBtn.hidden = !publicado;
    }

    if (discardChecklistUpdateBtn) {
        discardChecklistUpdateBtn.hidden =
            !esBorradorActualizacion;
    }

    if (publishChecklistBtn) {
        publishChecklistBtn.hidden = publicado;

        publishChecklistBtn.innerHTML =
            esBorradorActualizacion
                ? '<i class="bi bi-check-lg"></i> Publicar actualización'
                : '<i class="bi bi-check-lg"></i> Publicar checklist';
    }

    const grupos = new Map();

    items.forEach(item => {
        const requisitoId = Number(
            item.requisito_fotografico_id
        );

        if (!grupos.has(requisitoId)) {
            grupos.set(requisitoId, []);
        }

        grupos.get(requisitoId).push(item);
    });

    // Mostrar también los requerimientos configurados
    // que todavía no tienen ítems.
    obtenerRequisitosDelTipoDocumento().forEach(requisito => {
        if (!grupos.has(Number(requisito.id))) {
            grupos.set(Number(requisito.id), []);
        }
    });

    if (grupos.size === 0) {
        checklistItemsContainer.innerHTML = `
            <div class="checklist-template-empty">
                No hay requerimientos fotográficos configurados para este tipo de documento.
            </div>
        `;
        return;
    }

    const gruposOrdenados = Array.from(grupos.entries()).sort((a, b) => {
        const requisitoA = obtenerRequisitoPorId(a[0]);
        const requisitoB = obtenerRequisitoPorId(b[0]);

        return Number(requisitoA?.orden || 0) -
            Number(requisitoB?.orden || 0);
    });

    gruposOrdenados.forEach(([requisitoId, itemsGrupo]) => {
        const requisito = obtenerRequisitoPorId(requisitoId);

        const grupo = document.createElement("section");
        grupo.className = "generated-checklist-group";
        grupo.dataset.requisitoId = requisitoId;

        const encabezado = document.createElement("div");
        encabezado.className = "generated-checklist-group-header";

        const informacion = document.createElement("div");
        informacion.className = "generated-checklist-group-info";

        const titulo = document.createElement("h3");

        titulo.textContent =
            requisito?.nombre ||
            (
                itemsGrupo[0]
                    ? obtenerNombreRequisito(itemsGrupo[0])
                    : `Requerimiento ${requisitoId}`
            );

        const descripcion = document.createElement("p");

        descripcion.textContent =
            requisito?.descripcion ||
            (
                itemsGrupo[0]
                    ? obtenerDescripcionRequisito(itemsGrupo[0])
                    : ""
            );

        informacion.append(titulo);

        if (descripcion.textContent) {
            informacion.append(descripcion);
        }

        encabezado.append(informacion);

        if (!soloLectura) {
            const botonAgregar = document.createElement("button");

            botonAgregar.type = "button";
            botonAgregar.className = "checklist-add-item-btn";

            botonAgregar.innerHTML =
                '<i class="bi bi-plus-lg"></i> Agregar ítem';

            botonAgregar.addEventListener("click", () => {
                abrirModalItemGenerado(requisitoId);
            });

            encabezado.appendChild(botonAgregar);
        }

        const lista = document.createElement("div");
        lista.className = "generated-checklist-items";

        itemsGrupo
            .sort((a, b) =>
                Number(a.orden || 0) - Number(b.orden || 0)
            )
            .forEach(item => {
                lista.appendChild(
                    crearFilaItemChecklist(item, soloLectura)
                );
            });

        if (itemsGrupo.length === 0) {
            const vacio = document.createElement("p");

            vacio.className = "generated-checklist-group-empty";

            vacio.textContent = soloLectura
                ? "Este requerimiento no tiene ítems."
                : "Todavía no se han agregado ítems a este requerimiento.";

            lista.appendChild(vacio);
        }

        grupo.append(encabezado, lista);

        checklistItemsContainer.appendChild(grupo);
    });
}

function crearFilaItemChecklist(item, soloLectura) {
    const fila = document.createElement("article");

    fila.className = "generated-checklist-item";
    fila.dataset.itemId = item.id;

    const contenido = document.createElement("div");
    contenido.className = "generated-checklist-item-content";

    const titulo = document.createElement("strong");
    titulo.textContent = item.titulo || "Ítem sin título";

    const descripcion = document.createElement("p");
    descripcion.textContent = item.descripcion || "";

    const obligatorio = document.createElement("small");

    obligatorio.className = "generated-checklist-item-required";

    obligatorio.textContent = item.obligatorio
        ? "Obligatorio"
        : "Opcional";

    contenido.append(titulo);

    if (descripcion.textContent) {
        contenido.append(descripcion);
    }

    contenido.append(obligatorio);

    fila.appendChild(contenido);

    if (!soloLectura) {
        const acciones = document.createElement("div");

        acciones.className = "generated-checklist-item-actions";

        const botonEditar = document.createElement("button");

        botonEditar.type = "button";
        botonEditar.className = "checklist-item-action";
        botonEditar.title = "Editar ítem";

        botonEditar.setAttribute(
            "aria-label",
            "Editar ítem"
        );

        botonEditar.innerHTML =
            '<i class="bi bi-pencil"></i>';

        botonEditar.addEventListener("click", () => {
            abrirModalItemGenerado(
                item.requisito_fotografico_id,
                item
            );
        });

        const botonEliminar = document.createElement("button");

        botonEliminar.type = "button";
        botonEliminar.className =
            "checklist-item-action delete";

        botonEliminar.title = "Eliminar ítem";

        botonEliminar.setAttribute(
            "aria-label",
            "Eliminar ítem"
        );

        botonEliminar.innerHTML =
            '<i class="bi bi-trash3"></i>';

        botonEliminar.addEventListener("click", () => {
            eliminarItemChecklist(item);
        });

        acciones.append(botonEditar, botonEliminar);

        fila.appendChild(acciones);
    }

    return fila;
}


/* =====================================================
   AGREGAR Y EDITAR ÍTEMS DEL CHECKLIST GENERADO
   ===================================================== */

function abrirModalItemGenerado(requisitoId, item = null) {
    if (!checklistSePuedeEditar()) {
        mostrarNotificacion(
            "No se puede modificar un checklist publicado directamente.",
            "warning"
        );
        return;
    }

    requisitoItemActual = Number(requisitoId);
    itemEditandoActual = item ? { ...item } : null;

    ocultarMensajeItemGenerado();

    generatedChecklistItemModalLabel.textContent = item
        ? "Editar ítem"
        : "Agregar ítem";

    generatedItemTitle.value = item?.titulo || "";
    generatedItemDescription.value = item?.descripcion || "";
    generatedItemRequired.checked = item
        ? Boolean(item.obligatorio)
        : true;

    abrirModalChecklist(generatedChecklistItemModal);

    generatedItemTitle.focus();
}


function eliminarItemChecklist(item) {
    if (!checklistSePuedeEditar()) {
        mostrarNotificacion(
            "No se puede modificar un checklist publicado directamente.",
            "warning"
        );
        return;
    }

    itemChecklistEliminando = item;

    if (deleteGeneratedChecklistItemMessage) {
        deleteGeneratedChecklistItemMessage.textContent =
            `¿Estás seguro de que deseas eliminar el ítem "${item.titulo || "Sin título"}"?`;
    }

    abrirModalChecklist(deleteGeneratedChecklistItemModal);
}

async function guardarItemChecklist() {
    const checklistEdicion = obtenerChecklistEdicion();
    const esActualizacion = Boolean(borradorActualizacion);

    if (
        !checklistEdicion ||
        !checklistSePuedeEditar() ||
        guardandoItemChecklist
    ) {
        return;
    }

    const titulo = generatedItemTitle.value.trim();
    const descripcion = generatedItemDescription.value.trim();
    const obligatorio = generatedItemRequired.checked;

    if (!titulo) {
        mostrarMensajeItemGenerado(
            "El título del ítem es obligatorio.",
            true
        );

        generatedItemTitle.focus();
        return;
    }

    const boton = saveGeneratedChecklistItemBtn;
    const contenidoOriginal = boton.innerHTML;

    guardandoItemChecklist = true;

    boton.disabled = true;

    boton.innerHTML =
        '<span class="documenter-save-spinner" aria-hidden="true"></span> Guardando...';

    try {
        const itemsActuales = Array.isArray(checklistEdicion.items)
            ? checklistEdicion.items
            : [];

        const orden = itemEditandoActual
            ? Number(itemEditandoActual.orden || 1)
            : (
                Math.max(
                    0,
                    ...itemsActuales
                        .filter(item =>
                            Number(item.requisito_fotografico_id) === requisitoItemActual
                        )
                        .map(item => Number(item.orden || 0))
                ) + 1
            );

        const payload = {
            titulo,
            descripcion: descripcion || null,
            obligatorio,
            orden
        };

        let url;
        let metodo;

        if (itemEditandoActual) {
            // Editar ítem existente.
            url = esActualizacion
                ? `${API_URL}/asignaciones/checklist/actualizacion/items/${encodeURIComponent(itemEditandoActual.id)}`
                : `${API_URL}/asignaciones/checklist/items/${encodeURIComponent(itemEditandoActual.id)}`;

            metodo = "PUT";

        } else {
            // Agregar un nuevo ítem.
            url = esActualizacion
                ? `${API_URL}/asignaciones/checklist/actualizacion/${encodeURIComponent(checklistEdicion.id)}/items`
                : `${API_URL}/asignaciones/checklist/${encodeURIComponent(checklistEdicion.id)}/items`;

            metodo = "POST";

            payload.requisito_fotografico_id = requisitoItemActual;
        }

        await solicitarChecklist(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        cerrarModalChecklist(generatedChecklistItemModal);

        await cargarChecklistAsignacion();

        mostrarNotificacion(
            itemEditandoActual
                ? "El ítem se actualizó correctamente."
                : "El ítem se agregó correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al guardar el ítem:", error);

        mostrarMensajeItemGenerado(
            error.message || "No se pudo guardar el ítem.",
            true
        );

    } finally {
        guardandoItemChecklist = false;

        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}


/* =====================================================
   ELIMINAR ÍTEM DEL CHECKLIST GENERADO
   ===================================================== */

async function confirmarEliminarItemChecklist() {
    const checklistEdicion = obtenerChecklistEdicion();
    const esActualizacion = Boolean(borradorActualizacion);

    if (
        !itemChecklistEliminando ||
        !checklistEdicion ||
        !checklistSePuedeEditar() ||
        eliminandoItemChecklist
    ) {
        return;
    }

    const boton = confirmDeleteGeneratedChecklistItemBtn;
    const contenidoOriginal = boton.innerHTML;

    eliminandoItemChecklist = true;

    boton.disabled = true;

    boton.innerHTML =
        '<span class="documenter-save-spinner" aria-hidden="true"></span> Eliminando...';

    try {
        const url = esActualizacion
            ? `${API_URL}/asignaciones/checklist/actualizacion/items/${encodeURIComponent(itemChecklistEliminando.id)}`
            : `${API_URL}/asignaciones/checklist/items/${encodeURIComponent(itemChecklistEliminando.id)}`;

        await solicitarChecklist(url, {
            method: "DELETE"
        });

        cerrarModalChecklist(
            deleteGeneratedChecklistItemModal
        );

        itemChecklistEliminando = null;

        await cargarChecklistAsignacion();

        mostrarNotificacion(
            "El ítem se eliminó correctamente.",
            "success"
        );

    } catch (error) {
        console.error(
            "Error al eliminar el ítem:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo eliminar el ítem.",
            "error"
        );

    } finally {
        eliminandoItemChecklist = false;

        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}

/* =====================================================
   INICIAR ACTUALIZACIÓN DEL CHECKLIST
   ===================================================== */

async function iniciarActualizacionChecklist() {
    if (
        !checklistActual ||
        !checklistEstaPublicado() ||
        borradorActualizacion ||
        iniciandoActualizacionChecklist
    ) {
        return;
    }

    const boton = startChecklistUpdateBtn;
    const contenidoOriginal = boton.innerHTML;

    iniciandoActualizacionChecklist = true;

    boton.disabled = true;

    boton.innerHTML =
        '<span class="documenter-save-spinner" aria-hidden="true"></span> Preparando...';

    try {
        const borrador = await solicitarChecklist(
            `${API_URL}/asignaciones/checklist/${encodeURIComponent(checklistActual.id)}/actualizacion`,
            {
                method: "POST"
            }
        );

        borradorActualizacion = borrador;

        renderizarChecklistAsignacion(
            borrador,
            true
        );

        mostrarNotificacion(
            "Se inició la actualización del checklist. Los cambios todavía no afectan al checklist publicado.",
            "success"
        );

    } catch (error) {
        console.error(
            "Error al iniciar la actualización:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo iniciar la actualización.",
            "error"
        );

    } finally {
        iniciandoActualizacionChecklist = false;

        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}


/* =====================================================
   DESCARTAR ACTUALIZACIÓN DEL CHECKLIST
   ===================================================== */

async function descartarActualizacionChecklist() {
    if (
        !borradorActualizacion ||
        descartandoActualizacionChecklist
    ) {
        return;
    }

    const boton = confirmDiscardChecklistUpdateBtn;
    const contenidoOriginal = boton.innerHTML;

    descartandoActualizacionChecklist = true;

    boton.disabled = true;

    boton.innerHTML =
        '<span class="documenter-save-spinner" aria-hidden="true"></span> Descartando...';

    try {
        await solicitarChecklist(
            `${API_URL}/asignaciones/checklist/actualizacion/${encodeURIComponent(borradorActualizacion.id)}`,
            {
                method: "DELETE"
            }
        );

        borradorActualizacion = null;

        // Esperar a que termine de cargarse la vista actualizada.
        await cargarChecklistAsignacion();

        mostrarNotificacion(
            "La actualización se descartó correctamente. El checklist publicado no sufrió modificaciones.",
            "success"
        );

        // Cerrar el modal solamente cuando todo haya terminado.
        cerrarModalChecklist(discardChecklistUpdateModal);

    } catch (error) {
        console.error(
            "Error al descartar la actualización:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo descartar la actualización.",
            "error"
        );

    } finally {
        descartandoActualizacionChecklist = false;

        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}

/* =====================================================
   PUBLICAR CHECKLIST
   ===================================================== */

async function publicarChecklistAsignacion() {
    const checklistEdicion = obtenerChecklistEdicion();
    const esActualizacion = Boolean(borradorActualizacion);

    if (
        !checklistEdicion ||
        !checklistSePuedeEditar() ||
        publicandoChecklist
    ) {
        return;
    }

    const items = Array.isArray(checklistEdicion.items)
        ? checklistEdicion.items
        : [];

    if (items.length === 0) {
        mostrarMensajeChecklist(
            "No puedes publicar un checklist sin ítems.",
            true
        );
        return;
    }

    const boton = confirmPublishChecklistBtn;
    const contenidoOriginal = boton.innerHTML;

    publicandoChecklist = true;

    boton.disabled = true;

    boton.innerHTML =
        '<span class="documenter-save-spinner" aria-hidden="true"></span> Publicando...';

    try {
        const url = esActualizacion
            ? `${API_URL}/asignaciones/checklist/actualizacion/${encodeURIComponent(checklistEdicion.id)}/publicar`
            : `${API_URL}/asignaciones/checklist/${encodeURIComponent(checklistEdicion.id)}/publicar`;

        await solicitarChecklist(url, {
            method: "POST"
        });

        if (esActualizacion) {
            borradorActualizacion = null;
        }

        // Esperar a que termine de cargarse la vista actualizada.
        await cargarChecklistAsignacion();

        mostrarNotificacion(
            esActualizacion
                ? "La actualización del checklist se publicó correctamente."
                : "El checklist se publicó correctamente.",
            "success"
        );

        // Cerrar el modal solamente cuando todo haya terminado.
        cerrarModalChecklist(publishChecklistModal);

    } catch (error) {
        console.error(
            "Error al publicar el checklist:",
            error
        );

        mostrarMensajeChecklist(
            error.message || "No se pudo publicar el checklist.",
            true
        );

    } finally {
        publicandoChecklist = false;

        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
}

/* =====================================================
   EVENTOS DEL CHECKLIST
   ===================================================== */

generateChecklistBtn?.addEventListener(
    "click",
    abrirSeleccionChecklist
);

confirmGenerateChecklistBtn?.addEventListener(
    "click",
    generarChecklistAsignacion
);

saveGeneratedChecklistItemBtn?.addEventListener(
    "click",
    guardarItemChecklist
);

// Abrir confirmación para publicar.
publishChecklistBtn?.addEventListener("click", function () {
    if (
        !checklistSePuedeEditar() ||
        publicandoChecklist
    ) {
        return;
    }

    const items = obtenerChecklistEdicion()?.items || [];

    if (items.length === 0) {
        mostrarMensajeChecklist(
            "No puedes publicar un checklist sin ítems.",
            true
        );
        return;
    }

    abrirModalChecklist(publishChecklistModal);
});


// Confirmar publicación.
confirmPublishChecklistBtn?.addEventListener(
    "click",
    publicarChecklistAsignacion
);


// Abrir confirmación para descartar.
discardChecklistUpdateBtn?.addEventListener("click", function () {
    if (
        !borradorActualizacion ||
        descartandoActualizacionChecklist
    ) {
        return;
    }

    abrirModalChecklist(discardChecklistUpdateModal);
});


// Confirmar descarte.
confirmDiscardChecklistUpdateBtn?.addEventListener(
    "click",
    descartarActualizacionChecklist
);

confirmDeleteGeneratedChecklistItemBtn?.addEventListener(
    "click",
    confirmarEliminarItemChecklist
);

startChecklistUpdateBtn?.addEventListener(
    "click",
    iniciarActualizacionChecklist
);


/* =====================================================
   NAVEGACIÓN
   ===================================================== */

document.getElementById("documentBtn")?.addEventListener("click", function () {
    window.location.href = "documentos.html";
});

document.getElementById("trackingBtn")?.addEventListener("click", function () {
    window.location.href = "seguimiento.html";
});

document.getElementById("trackingBtnBottom")?.addEventListener("click", function () {
    window.location.href = "seguimiento.html";
});

document.getElementById("evidencesBtn")?.addEventListener("click", function () {
    window.location.href = "evidencias.html";
});


/* =====================================================
   TECLADO
   ===================================================== */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeUploadModal();
        cerrarModalDocumentador();
        cerrarModalTecnicos();
        cerrarAdministracionPlantillas();
        closeSidebar();
    }
});

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */

cargarAsignacion();
