/* =====================================================
   CONFIGURACIÓN
   ===================================================== */

const API_URL = "http://127.0.0.1:8000";

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

    const respuesta = await fetch(
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
        const respuesta = await fetch(
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
        const respuesta = await fetch(`${API_URL}/usuarios/`);

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
        const respuesta = await fetch(
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
        const respuesta = await fetch(`${API_URL}/usuarios/`);

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
        const respuesta = await fetch(
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
    const respuesta = await fetch(url, opciones);

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
   INTEGRACIÓN DEL CHECKLIST GENERADO DE EVIDENCIAS
   ===================================================== */

const checklistPanel = document.getElementById("checklistPanel");
const checklistEmptyState = document.getElementById("checklistEmptyState");
const checklistContent = document.getElementById("checklistContent");
const checklistItemsContainer = document.getElementById("checklistItems");
const checklistProgressBar = document.getElementById("checklistProgressBar");
const checklistProgressText = document.getElementById("checklistProgressText");
const checklistMessage = document.getElementById("checklistMessage");
const generateChecklistBtn = document.getElementById("generateChecklistBtn");
const checklistActions = document.getElementById("checklistActions");
const updateChecklistBtn = document.getElementById("updateChecklistBtn");
const deleteChecklistBtn = document.getElementById("deleteChecklistBtn");

let checklistActual = null;
let cargandoChecklist = false;

/**
 * Muestra un mensaje de retroalimentación en el área de checklist
 */
function mostrarMensajeChecklist(mensaje, esError = false) {
    if (!checklistMessage) return;
    
    checklistMessage.className = "checklist-template-message";
    if (esError) {
        checklistMessage.classList.add("error");
    }

    checklistMessage.textContent = mensaje;
    checklistMessage.hidden = false;
}

/**
 * Oculta el mensaje de retroalimentación del checklist
 */
function ocultarMensajeChecklist() {
    if (checklistMessage) {
        checklistMessage.textContent = "";
        checklistMessage.hidden = true;
    }
}

/**
 * Actualiza la barra de progreso del checklist y el porcentaje
 */
function actualizarProgresoChecklist(completados, total) {
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    if (checklistProgressBar) {
        checklistProgressBar.style.width = `${porcentaje}%`;
        const progressParent = checklistProgressBar.parentElement;
        if (progressParent) {
            progressParent.setAttribute("aria-valuenow", porcentaje);
        }
    }

    if (checklistProgressText) {
        checklistProgressText.textContent = `${completados} de ${total} completados (${porcentaje}%)`;
    }
}

/**
 * Renderiza los ítems del checklist en el contenedor #checklistItems
 */
function renderizarChecklistAsignacion(checklist) {
    if (!checklistItemsContainer) return;

    checklistActual = checklist;
    checklistItemsContainer.replaceChildren();

    const items = Array.isArray(checklist?.items) ? checklist.items : [];

    if (items.length === 0) {
        checklistItemsContainer.innerHTML = `
            <div class="checklist-template-empty">
                El checklist no contiene ítems para verificar.
            </div>
        `;
        actualizarProgresoChecklist(0, 0);
        return;
    }

    // Ordenar items ascendentemente por 'orden'
    const itemsOrdenados = [...items].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

    let completados = 0;

    itemsOrdenados.forEach(item => {
        // Evalúa si el ítem está completado (según atributo del backend o presencia de evidencia)
        const estaCompletado = Boolean(item.completado || item.evidencia_cargada);
        if (estaCompletado) completados++;

        const itemDiv = document.createElement("div");
        itemDiv.className = `checklist-item ${estaCompletado ? "completed" : "pending"}`;
        itemDiv.dataset.itemId = item.id;

        itemDiv.innerHTML = `
            <div class="check-icon">
                <i class="bi ${estaCompletado ? "bi-check-circle-fill" : "bi-clock-history"}"></i>
            </div>
            
            <div class="check-content">
                <div class="check-title-row">
                    <strong>${escaparHTML(item.titulo)}</strong>
                    ${item.obligatorio ? '<span class="evidence-status pending-status">Obligatorio</span>' : ''}
                    <span class="evidence-status ${estaCompletado ? 'complete' : 'pending-status'}">
                        ${estaCompletado ? 'Completado' : 'Pendiente'}
                    </span>
                </div>

                ${item.descripcion ? `<p>${escaparHTML(item.descripcion)}</p>` : ''}

                <div class="evidence-meta">
                    <span><i class="bi bi-hash"></i> Orden: ${item.orden}</span>
                    <span><i class="bi bi-camera"></i> Requisito #${item.requisito_fotografico_id}</span>
                </div>
            </div>

            <button type="button" class="evidence-btn ${estaCompletado ? 'view' : 'upload'}" onclick="abrirModalEvidenciaItem(${item.id})">
                <i class="bi ${estaCompletado ? 'bi-eye' : 'bi-upload'}"></i>
                ${estaCompletado ? 'Ver Evidencia' : 'Subir Foto'}
            </button>
        `;

        checklistItemsContainer.appendChild(itemDiv);
    });

    actualizarProgresoChecklist(completados, items.length);
}

/**
 * Consulta el checklist desde el backend: GET /asignaciones/{id}/checklist
 */
async function cargarChecklistAsignacion() {
    if (!assignmentId || cargandoChecklist) return;

    cargandoChecklist = true;
    ocultarMensajeChecklist();

    try {
        const respuesta = await fetch(`${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}/checklist`);

        if (respuesta.status === 404) {
            // La asignación no tiene un checklist generado aún
            if (checklistEmptyState) checklistEmptyState.hidden = false;
            if (checklistContent) checklistContent.hidden = true;
            if (checklistActions) checklistActions.hidden = true;
            return;
        }

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar el checklist (HTTP ${respuesta.status}).`);
        }

        const data = await respuesta.json();

        // Mostrar sección de contenido y ocultar estado vacío
        if (checklistEmptyState) checklistEmptyState.hidden = true;
        if (checklistContent) checklistContent.hidden = false;
        if (checklistActions) checklistActions.hidden = false;

        renderizarChecklistAsignacion(data);

    } catch (error) {
        console.error("Error al cargar el checklist:", error);
        mostrarMensajeChecklist(error.message || "No se pudo conectar con el servidor para obtener el checklist.", true);
    } finally {
        cargandoChecklist = false;
    }
}

/**
 * Genera el checklist desde FastAPI: POST /asignaciones/{id}/checklist
 */
async function generarChecklistAsignacion() {
    if (!assignmentId || cargandoChecklist) return;

    const boton = generateChecklistBtn;
    const contenidoOriginal = boton ? boton.innerHTML : "";

    if (boton) {
        boton.disabled = true;
        boton.innerHTML = `<span class="documenter-save-spinner" aria-hidden="true"></span> Generando...`;
    }

    ocultarMensajeChecklist();

    try {
        const respuesta = await fetch(`${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}/checklist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!respuesta.ok) {
            let mensaje = "No se pudo generar el checklist.";
            try {
                const detalle = await respuesta.json();
                mensaje = detalle.detail || mensaje;
            } catch {}
            throw new Error(mensaje);
        }

        const data = await respuesta.json();

        if (checklistEmptyState) checklistEmptyState.hidden = true;
        if (checklistContent) checklistContent.hidden = false;
        if (checklistActions) checklistActions.hidden = false;

        renderizarChecklistAsignacion(data);
        mostrarMensajeChecklist("Checklist generado correctamente.");

    } catch (error) {
        console.error("Error al generar el checklist:", error);
        mostrarMensajeChecklist(error.message || "No se pudo generar el checklist de la asignación.", true);
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }
}

/**
 * Conecta los botones de subir evidencia de cada ítem con el modal de subida de archivos
 */
function abrirModalEvidenciaItem(itemId) {
    console.log(`Subir/Ver evidencia para el ítem de checklist ID: ${itemId}`);
    openUploadModal();
}

// Event Listeners para la gestión del checklist
generateChecklistBtn?.addEventListener("click", generarChecklistAsignacion);

updateChecklistBtn?.addEventListener("click", () => {
    cargarChecklistAsignacion();
});

/* =====================================================
   MODAL Y LÓGICA DE ELIMINACIÓN DE CHECKLIST
   ===================================================== */

const btnConfirmarEliminarChecklist = document.getElementById("btnConfirmarEliminarChecklist");

// Función para obtener/mostrar el modal usando Bootstrap 5 de manera segura
function abrirModalEliminarChecklist() {
    const modalElemento = document.getElementById("eliminarChecklistModal");
    if (!modalElemento) {
        console.error("El elemento #eliminarChecklistModal no se encuentra en el DOM.");
        return;
    }

    if (typeof bootstrap === "undefined") {
        console.error("Bootstrap JS no está cargado. Asegúrate de incluir bootstrap.bundle.min.js.");
        return;
    }

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElemento);
    modalInstance.show();
}

// Abrir el modal cuando se hace clic en 'Eliminar' del checklist
deleteChecklistBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    abrirModalEliminarChecklist();
});

// Confirmación y eliminación contra la API
btnConfirmarEliminarChecklist?.addEventListener("click", async function () {
    if (!assignmentId) return;

    const boton = this;
    const contenidoOriginal = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML = `<span class="documenter-save-spinner" aria-hidden="true"></span> Eliminando...`;

    try {
        const respuesta = await fetch(`${API_URL}/asignaciones/${encodeURIComponent(assignmentId)}/checklist`, {
            method: "DELETE"
        });

        if (!respuesta.ok && respuesta.status !== 204) {
            let mensaje = "No se pudo eliminar el checklist.";
            try {
                const detalle = await respuesta.json();
                mensaje = detalle.detail || mensaje;
            } catch {}
            throw new Error(mensaje);
        }

        // Ocultar modal de Bootstrap
        const modalElemento = document.getElementById("eliminarChecklistModal");
        if (modalElemento && typeof bootstrap !== "undefined") {
            const modalInstance = bootstrap.Modal.getInstance(modalElemento);
            modalInstance?.hide();
        }

        // Resetear la interfaz del checklist
        if (checklistEmptyState) checklistEmptyState.hidden = false;
        if (checklistContent) checklistContent.hidden = true;
        if (checklistActions) checklistActions.hidden = true;
        if (checklistItemsContainer) checklistItemsContainer.replaceChildren();

        mostrarMensajeChecklist("El checklist ha sido eliminado correctamente.");

    } catch (error) {
        console.error("Error al eliminar el checklist:", error);
        mostrarMensajeChecklist(error.message || "Error al intentar eliminar el checklist.", true);
    } finally {
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
});

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
