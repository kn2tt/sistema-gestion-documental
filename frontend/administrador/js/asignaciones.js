/* =========================================
   CONFIGURACIÓN DE LA API
   ========================================= */

const API_URL = "http://127.0.0.1:8000";

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

/* =========================================
   VARIABLES GLOBALES
   ========================================= */

const ASIGNACIONES_POR_PAGINA = 20;
let paginaActualAsignaciones = 1;

/* =========================================
   NOTIFICACIONES DEL SISTEMA
   ========================================= */

function mostrarNotificacion(mensaje, tipo = "info", titulo = "") {
    let contenedor = document.querySelector(".notification-container");

    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.className = "notification-container";
        document.body.appendChild(contenedor);
    }

    const configuracion = {
        success: {
            icono: "bi-check-circle-fill",
            titulo: "Operación exitosa"
        },
        error: {
            icono: "bi-x-circle-fill",
            titulo: "Error"
        },
        warning: {
            icono: "bi-exclamation-triangle-fill",
            titulo: "Advertencia"
        },
        info: {
            icono: "bi-info-circle-fill",
            titulo: "Información"
        }
    };

    const notificacion = configuracion[tipo]
        ? configuracion[tipo]
        : configuracion.info;

    const elemento = document.createElement("div");
    elemento.className = `system-notification ${tipo}`;

    const encabezado = document.createElement("div");
    encabezado.className = "notification-header";

    const icono = document.createElement("i");
    icono.className = `bi ${notificacion.icono} notification-icon`;

    const contenido = document.createElement("div");
    contenido.className = "notification-content";

    const tituloElemento = document.createElement("div");
    tituloElemento.className = "notification-title";
    tituloElemento.textContent = titulo || notificacion.titulo;

    const mensajeElemento = document.createElement("div");
    mensajeElemento.className = "notification-message";
    mensajeElemento.textContent = mensaje;

    const botonCerrar = document.createElement("button");
    botonCerrar.className = "notification-close";
    botonCerrar.type = "button";
    botonCerrar.setAttribute("aria-label", "Cerrar notificación");

    const iconoCerrar = document.createElement("i");
    iconoCerrar.className = "bi bi-x";

    botonCerrar.appendChild(iconoCerrar);
    contenido.append(tituloElemento, mensajeElemento);
    encabezado.append(icono, contenido, botonCerrar);
    elemento.appendChild(encabezado);
    contenedor.appendChild(elemento);

    function cerrarNotificacion() {
        if (!elemento.isConnected) return;

        elemento.classList.add("notification-exit");

        elemento.addEventListener("animationend", () => {
            elemento.remove();

            if (contenedor.isConnected && !contenedor.children.length) {
                contenedor.remove();
            }
        }, { once: true });
    }

    botonCerrar.addEventListener("click", cerrarNotificacion);

    setTimeout(cerrarNotificacion, 4500);
}

/* =========================================
   SIDEBAR MOBILE
   ========================================= */

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

mobileMenuButton?.addEventListener("click", openSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

function openSidebar() {
    sidebar?.classList.add("show");
    sidebarOverlay?.classList.add("show");
}

function closeSidebar() {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");
}

document.querySelectorAll(".sidebar .nav-item").forEach(function (item) {
    item.addEventListener("click", closeSidebar);
});

/* =========================================================
   CARGA DE COMBOBOX DEL MODAL DE ASIGNACIONES
   ========================================================= */

let proyectosAsignacion = [];
let sitesAsignacion = [];
let plantillasAsignacion = [];
let usuariosAsignacion = [];

/* =========================================
   MODAL DE ASIGNACIÓN
   ========================================= */

const assignmentModalElement = document.getElementById("assignmentModal");

const assignmentModal = assignmentModalElement
    ? new bootstrap.Modal(assignmentModalElement)
    : null;

document.getElementById("saveAssignment")?.addEventListener("click", guardarAsignacion);


/* =========================================
   MODAL EDITAR ASIGNACIÓN
   ========================================= */

const editarAsignacionModalElement =
    document.getElementById("editarAsignacionModal");

const editarAsignacionModal = editarAsignacionModalElement
    ? bootstrap.Modal.getOrCreateInstance(editarAsignacionModalElement)
    : null;

const btnActualizarAsignacion =
    document.getElementById("actualizarAsignacion");

let assignmentEditingId = null;
let editarTechnicianNames = new Map();
let editandoAsignacionEnProceso = false;


/* =========================================
   SELECCIÓN DE TÉCNICOS
   ========================================= */

const technicianSearch = document.getElementById("technicianSearch");
const selectedTechnicians = document.getElementById("selectedTechnicians");
const technicianCount = document.getElementById("technicianCount");
const technicianEmpty = document.getElementById("technicianEmpty");

const selectedTechnicianNames = new Map();

function getInitials(name) {
    const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function updateTechnicianUI() {
    if (!selectedTechnicians) return;

    selectedTechnicians.innerHTML = "";

    if (selectedTechnicianNames.size === 0) {
        const empty = document.createElement("span");
        empty.className = "empty-selection";
        empty.textContent = "Ningún técnico seleccionado";
        selectedTechnicians.appendChild(empty);
    } else {
        selectedTechnicianNames.forEach(function (name, value) {
            const tag = document.createElement("span");
            tag.className = "selected-technician";

            tag.innerHTML = `
                <span class="selected-technician-avatar">
                    ${escapeHTML(getInitials(name))}
                </span>
                <span>${escapeHTML(name)}</span>
                <button
                    type="button"
                    class="remove-technician"
                    data-value="${escapeHTML(value)}"
                    title="Quitar técnico"
                    aria-label="Quitar ${escapeHTML(name)}">
                    <i class="bi bi-x"></i>
                </button>
            `;

            selectedTechnicians.appendChild(tag);
        });
    }

    const count = selectedTechnicianNames.size;

    if (technicianCount) {
        technicianCount.textContent =
            count === 0
                ? "0 técnicos seleccionados"
                : count === 1
                    ? "1 técnico seleccionado"
                    : `${count} técnicos seleccionados`;
    }

    const contenedorTecnicos = document.getElementById("technicianOptions");

    contenedorTecnicos?.querySelectorAll(".technician-option").forEach(
        function (option) {
            const value = String(option.dataset.value ?? "");

            option.classList.toggle(
                "selected",
                selectedTechnicianNames.has(value)
            );
        }
    );
}

selectedTechnicians?.addEventListener("click", function (event) {
    const button = event.target.closest(".remove-technician");
    if (!button) return;

    selectedTechnicianNames.delete(String(button.dataset.value));
    updateTechnicianUI();
});


/* =========================================
   BUSCAR TÉCNICO
   ========================================= */

technicianSearch?.addEventListener("input", actualizarOpcionesTecnicosModal);

updateTechnicianUI();


/* =========================================
   ASIGNACIONES: TABLA Y FILTROS
   ========================================= */

const assignmentTableBody = document.getElementById("assignmentTableBody");

/* =========================================
   MODAL ELIMINAR ASIGNACIÓN
   ========================================= */

let assignmentIdToDelete = null;

const eliminarAsignacionModalElement =
    document.getElementById("eliminarAsignacionModal");

const eliminarAsignacionModal = eliminarAsignacionModalElement
    ? bootstrap.Modal.getOrCreateInstance(eliminarAsignacionModalElement)
    : null;

const eliminarAsignacionMensaje =
    document.getElementById("eliminarAsignacionMensaje");

const btnConfirmarEliminarAsignacion =
    document.getElementById("btnConfirmarEliminarAsignacion");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const documentFilter = document.getElementById("documentFilter");
const technicianFilter = document.getElementById("technicianFilter");
const dateFromFilter = document.getElementById("filtroFechaDesde");
const dateToFilter = document.getElementById("filtroFechaHasta");

const assignmentViewCards = document.querySelectorAll(
    ".assignment-view-card"
);

let assignmentsData = [];
let currentAssignmentView = "activas";
let proyectosIdsClienteSeleccionado = new Set();

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function assignmentFullName(person) {
    if (!person) return "";
    return `${person.nombre ?? ""} ${person.apellido ?? ""}`.trim();
}

function assignmentStatusLabel(status) {
    const labels = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        pendiente_documentacion: "Pendiente de documentación",
        en_documentacion: "En documentación",
        en_revision: "En revisión",
        observado: "Observado",
        completado: "Completado"
    };

    return labels[status] ?? status ?? "Sin estado";
}

function assignmentStatusClass(status) {
    const classes = {
        pendiente: "pending",
        en_proceso: "process",
        pendiente_documentacion: "pending",
        en_documentacion: "process",
        en_revision: "process",
        observado: "observed",
        completado: "complete"
    };

    return classes[status] ?? "pending";
}

function assignmentDateLabel(value) {
    if (!value) return "Sin fecha límite";

    const date = String(value).substring(0, 10);
    const parts = date.split("-");

    if (parts.length !== 3) return date;

    const [year, month, day] = parts;
    const months = [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic"
    ];

    return `${Number(day)} ${months[Number(month) - 1] ?? ""} ${year}`;
}

function assignmentDocumentKey(name) {
    const document = normalizeText(name);

    if (document.includes("tss")) return "tss";
    if (document.includes("power")) return "power";
    if (document.includes("reporte")) return "reporte";

    return document;
}

async function cargarAsignaciones() {
    if (!assignmentTableBody) return;

    assignmentTableBody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4">
                Cargando asignaciones...
            </td>
        </tr>
    `;

    try {
        const response = await apiFetch(`${API_URL}/asignaciones/`);

        if (!response.ok) {
            throw new Error(`Error al consultar asignaciones: HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("El backend no devolvió una lista de asignaciones.");
        }

        assignmentsData = data;

        actualizarFiltroTiposDocumento();
        actualizarFiltroTecnicos();
        renderizarAsignaciones();
    } catch (error) {
        console.error("Error al cargar asignaciones:", error);

        assignmentTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    No se pudieron cargar las asignaciones. Verifica que el backend
                    esté ejecutándose y que permita solicitudes desde este origen.
                </td>
            </tr>
        `;
    }
}

function actualizarFiltroTecnicos() {
    if (!technicianFilter) return;

    const currentValue = technicianFilter.value;
    const technicians = new Map();

    assignmentsData.forEach(function (assignment) {
        (assignment.tecnicos ?? []).forEach(function (technician) {
            technicians.set(
                String(technician.id),
                assignmentFullName(technician)
            );
        });
    });

    technicianFilter.innerHTML = '<option value="">Todos los técnicos</option>';

    [...technicians.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "es"))
        .forEach(function ([id, name]) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = name;
            technicianFilter.appendChild(option);
        });

    if (technicians.has(currentValue)) {
        technicianFilter.value = currentValue;
    }
}


/* =========================================
   ACTUALIZAR FILTRO DE TIPOS DE DOCUMENTO
   ========================================= */

async function actualizarFiltroTiposDocumento() {
    if (!documentFilter) return;

    const valorActual = documentFilter.value;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/tipos-documento/activos`
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error al cargar los tipos de documentos: ${respuesta.status}`
            );
        }

        const tiposDocumento = await respuesta.json();

        documentFilter.replaceChildren();

        const opcionTodos = document.createElement("option");
        opcionTodos.value = "";
        opcionTodos.textContent = "Todos los documentos";
        documentFilter.appendChild(opcionTodos);

        tiposDocumento
            .sort((a, b) =>
                a.nombre.localeCompare(b.nombre, "es")
            )
            .forEach(function (tipo) {
                const opcion = document.createElement("option");

                opcion.value = String(tipo.id);
                opcion.textContent = tipo.nombre;

                documentFilter.appendChild(opcion);
            });

        const existeValor = Array.from(
            documentFilter.options
        ).some(function (opcion) {
            return opcion.value === valorActual;
        });

        if (existeValor) {
            documentFilter.value = valorActual;
        }
    } catch (error) {
        console.error(
            "Error al cargar el filtro de tipos de documentos:",
            error
        );

        mostrarNotificacion(
            "No se pudieron cargar los tipos de documentos.",
            "error"
        );
    }
}

function renderizarAsignaciones() {
    if (!assignmentTableBody) return;

    const filteredAssignments = filtrarAsignaciones();
    const totalAsignaciones = filteredAssignments.length;
    const totalPaginas = Math.ceil(
        totalAsignaciones / ASIGNACIONES_POR_PAGINA
    );

    // Mantener la página dentro del rango disponible.
    if (totalPaginas === 0) {
        paginaActualAsignaciones = 1;
    } else if (paginaActualAsignaciones > totalPaginas) {
        paginaActualAsignaciones = totalPaginas;
    }

    const inicio = (paginaActualAsignaciones - 1) *
        ASIGNACIONES_POR_PAGINA;

    const asignacionesPagina = filteredAssignments.slice(
        inicio,
        inicio + ASIGNACIONES_POR_PAGINA
    );

    if (totalAsignaciones === 0) {
        assignmentTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    No se encontraron asignaciones con los filtros seleccionados.
                </td>
            </tr>
        `;

        actualizarContadorAsignaciones(0);
        renderizarPaginacionAsignaciones(0);
        return;
    }

    assignmentTableBody.innerHTML = asignacionesPagina.map(function (assignment) {
        const id = assignment.id;
        const status = assignment.estado;
        const technicians = assignment.tecnicos ?? [];

        const techniciansHTML = technicians.length
            ? `<div class="responsible-list">
                ${technicians.map(function (technician) {
                    const name = assignmentFullName(technician);

                    return `<span>
                        <span class="mini-avatar">${escapeHTML(
                            getInitials(name)
                        )}</span>
                        ${escapeHTML(name)}
                    </span>`;
                }).join("")}
               </div>`
            : "Sin técnicos asignados";

        const documenterHTML = assignment.documentador_nombre
            ? `<span class="documenter-name">
                <span class="mini-avatar documenter">${escapeHTML(
                    getInitials(assignment.documentador_nombre)
                )}</span>
                ${escapeHTML(assignment.documentador_nombre)}
               </span>`
            : `<span class="documenter-pending">
                <i class="bi bi-person-plus"></i> Sin asignar
               </span>`;

        const projectName =
            assignment.proyecto_nombre || `Proyecto ${assignment.proyecto_id ?? ""}`;

        const siteName =
            assignment.site_nombre || `Site ${assignment.site_id ?? ""}`;

        const subprojectName =
            assignment.subproyecto_nombre || `Subproyecto ${assignment.subproyecto_id ?? ""}`;

        const documentName =
            assignment.tipo_documento_nombre || `Documento ${assignment.tipo_documento_id ?? ""}`;

        const dueDate = assignmentDateLabel(assignment.fecha_limite);
        const code = `ASG-${String(id).padStart(4, "0")}`;

        const searchText = normalizeText([
            projectName,
            siteName,
            subprojectName,
            documentName,
            assignment.documentador_nombre,
            code,
            ...technicians.map(assignmentFullName)
        ].join(" "));

        return `
            <tr
                data-id="${id}"
                data-status="${escapeHTML(status)}"
                data-document="${escapeHTML(assignmentDocumentKey(documentName))}"
                data-technicians="${escapeHTML(
                    technicians.map(person => person.id).join(",")
                )}"
                data-search="${escapeHTML(searchText)}">

                <td>
                    <a href="detalle-asignacion.html?id=${encodeURIComponent(id)}"
                       class="assignment-name">
                        ${escapeHTML(projectName)}
                    </a>
                    <span class="assignment-code">${code}</span>
                </td>

                <td>
                    <strong class="site-code">${escapeHTML(siteName)}</strong>
                </td>

                <td>${escapeHTML(subprojectName)}</td>

                <td>
                    <span class="document-name">
                        ${escapeHTML(documentName)}
                    </span>
                </td>

                <td>${techniciansHTML}</td>

                <td>${documenterHTML}</td>

                <td><strong>${escapeHTML(dueDate)}</strong></td>

                <td>
                    <span class="assignment-status ${assignmentStatusClass(status)}">
                        ${escapeHTML(assignmentStatusLabel(status))}
                    </span>
                </td>

                <td>
                    <div class="d-flex align-items-center gap-1">
                        <button
                            type="button"
                            class="table-action"
                            title="Ver detalle"
                            aria-label="Ver detalle de asignación ${id}"
                            data-view-assignment="${id}">
                            <i class="bi bi-eye"></i>
                        </button>

                        <button
                            type="button"
                            class="table-action"
                            title="Editar asignación"
                            aria-label="Editar asignación ${id}"
                            data-edit-assignment="${id}">
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            type="button"
                            class="table-action"
                            title="Eliminar asignación"
                            aria-label="Eliminar asignación ${id}"
                            data-delete-assignment="${id}">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    actualizarContadorAsignaciones(totalAsignaciones);
    renderizarPaginacionAsignaciones(totalPaginas);
}


function renderizarPaginacionAsignaciones(totalPaginas) {
    const paginacion = document.getElementById(
        "paginacionAsignaciones"
    );

    if (!paginacion) return;

    paginacion.replaceChildren();

    function crearBoton(texto, pagina, opciones = {}) {
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "pagination-button";

        if (opciones.activo) {
            boton.classList.add("active");
            boton.setAttribute("aria-current", "page");
        }

        if (opciones.deshabilitado) {
            boton.classList.add("disabled");
            boton.disabled = true;
            boton.setAttribute("aria-disabled", "true");
        }

        if (opciones.icono) {
            const icono = document.createElement("i");
            icono.className = `bi ${opciones.icono}`;
            icono.setAttribute("aria-hidden", "true");

            boton.appendChild(icono);
            boton.setAttribute("aria-label", texto);
            boton.title = texto;
        } else {
            boton.textContent = texto;
        }

        boton.addEventListener("click", function () {
            if (
                boton.disabled ||
                pagina === paginaActualAsignaciones
            ) {
                return;
            }

            paginaActualAsignaciones = pagina;
            renderizarAsignaciones();
        });

        paginacion.appendChild(boton);
    }

    crearBoton(
        "Página anterior",
        Math.max(1, paginaActualAsignaciones - 1),
        {
            icono: "bi-chevron-left",
            deshabilitado:
                totalPaginas === 0 ||
                paginaActualAsignaciones === 1
        }
    );

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        crearBoton(
            String(pagina),
            pagina,
            {
                activo: pagina === paginaActualAsignaciones
            }
        );
    }

    crearBoton(
        "Página siguiente",
        Math.min(totalPaginas, paginaActualAsignaciones + 1),
        {
            icono: "bi-chevron-right",
            deshabilitado:
                totalPaginas === 0 ||
                paginaActualAsignaciones >= totalPaginas
        }
    );
}

function filtrarAsignaciones() {
    const search = normalizeText(searchInput?.value);
    const documentType = documentFilter?.value ?? "";
    const technician = technicianFilter?.value ?? "";
    const status = statusFilter?.value ?? "";
    const dateFrom = dateFromFilter?.value ?? "";
    const dateTo = dateToFilter?.value ?? "";

    return assignmentsData.filter(function (assignment) {
        const technicians = assignment.tecnicos ?? [];
        const dueDate = String(assignment.fecha_limite ?? "").substring(0, 10);

        const searchText = normalizeText([
            assignment.proyecto_nombre,
            assignment.site_nombre,
            assignment.subproyecto_nombre,
            assignment.tipo_documento_nombre,
            assignment.documentador_nombre,
            `ASG-${String(assignment.id).padStart(4, "0")}`,
            ...technicians.map(assignmentFullName)
        ].join(" "));

        const matchesSearch = !search || searchText.includes(search);

        const matchesDocument = !documentType ||
            String(assignment.tipo_documento_id ?? "") === documentType;

        const matchesTechnician = !technician ||
            technicians.some(person => String(person.id) === technician);

        const matchesStatus = !status || assignment.estado === status;

        const matchesDateFrom = !dateFrom || (dueDate && dueDate >= dateFrom);
        const matchesDateTo = !dateTo || (dueDate && dueDate <= dateTo);

        let matchesView = true;

        if (currentAssignmentView === "activas") {
            matchesView = [
                "pendiente",
                "en_proceso",
                "pendiente_documentacion",
                "en_documentacion",
                "en_revision"
            ].includes(assignment.estado);
        } else if (currentAssignmentView === "observadas") {
            matchesView = assignment.estado === "observado";
        } else if (currentAssignmentView === "completadas") {
            matchesView = assignment.estado === "completado";
        }

        const matchesClient =
        clienteAsignacionesSelect?.value !== "" &&
        clienteAsignacionesSelect?.value != null &&
        proyectosIdsClienteSeleccionado.has(
            String(assignment.proyecto_id)
        );

        return matchesClient &&
            matchesSearch &&
            matchesDocument &&
            matchesTechnician &&
            matchesStatus &&
            matchesDateFrom &&
            matchesDateTo &&
            matchesView;
    });
}


function actualizarContadorAsignaciones(totalFiltrado) {
    const counter = document.querySelector(
        ".assignments-card .table-header span"
    );

    if (counter) {
        counter.textContent =
            `${totalFiltrado} ${totalFiltrado === 1
                ? "asignación encontrada"
                : "asignaciones encontradas"}`;
    }

    const footer = document.getElementById(
        "contadorAsignaciones"
    );

    if (footer) {
        if (totalFiltrado === 0) {
            footer.textContent = "Mostrando 0 de 0 asignaciones";
            return;
        }

        const inicio = (paginaActualAsignaciones - 1) *
            ASIGNACIONES_POR_PAGINA + 1;

        const fin = Math.min(
            paginaActualAsignaciones * ASIGNACIONES_POR_PAGINA,
            totalFiltrado
        );

        footer.textContent =
            `Mostrando ${inicio}–${fin} de ${totalFiltrado} asignaciones`;
    }
}

[
    searchInput,
    statusFilter,
    documentFilter,
    technicianFilter,
    dateFromFilter,
    dateToFilter
].forEach(function (element) {
    const aplicarFiltros = function () {
        paginaActualAsignaciones = 1;
        renderizarAsignaciones();
    };

    element?.addEventListener("input", aplicarFiltros);
    element?.addEventListener("change", aplicarFiltros);
});

assignmentViewCards.forEach(function (card) {
    card.addEventListener("click", function () {
        currentAssignmentView = card.dataset.assignmentView || "activas";

        assignmentViewCards.forEach(function (item) {
            const selected = item === card;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

        paginaActualAsignaciones = 1;
        renderizarAsignaciones();
    });
});

/* =========================================
   CREAR ASIGNACIÓN
   ========================================= */

function obtenerValorCampo(ids) {
    for (const id of ids) {
        const element = document.getElementById(id);

        if (element && String(element.value ?? "").trim() !== "") {
            return element.value;
        }
    }

    return null;
}


function limpiarModalAsignacion() {
    const campos = [
        "assignmentClient",
        "assignmentProject",
        "assignmentSite",
        "assignmentSubproject",
        "assignmentDocumentType",
        "assignmentTemplate",
        "assignmentDocumenter",
        "assignmentStartDate",
        "assignmentDueDate",
        "assignmentStatus",
        "assignmentSpecifications"
    ];

    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (!campo) return;

        if (campo.tagName === "SELECT") {
            campo.selectedIndex = 0;
            campo.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
            campo.value = "";
        }
    });

    selectedTechnicianNames.clear();
    updateTechnicianUI();
    actualizarOpcionesTecnicosModal();

    const busqueda = document.getElementById("technicianSearch");
    if (busqueda) {
        busqueda.value = "";
        actualizarOpcionesTecnicosModal();
    }

    mostrarSelectorClientes(false);
    actualizarClienteSeleccionado();
    actualizarOpcionesSeleccionadas();
}



async function guardarAsignacion() {
    const saveButton = document.getElementById("saveAssignment");
    if (!saveButton || saveButton.disabled) return;

    const proyectoId = document.getElementById("assignmentProject")?.value;
    const siteId = document.getElementById("assignmentSite")?.value;
    const subproyectoId = document.getElementById("assignmentSubproject")?.value;
    const tipoDocumentoId = document.getElementById("assignmentDocumentType")?.value;
    const plantillaId = document.getElementById("assignmentTemplate")?.value;
    const documentadorId = document.getElementById("assignmentDocumenter")?.value;
    const fechaAsignacion = document.getElementById("assignmentStartDate")?.value;
    const fechaLimite = document.getElementById("assignmentDueDate")?.value;

    if (
        !proyectoId ||
        !siteId ||
        !subproyectoId ||
        !tipoDocumentoId ||
        !plantillaId
    ) {
        mostrarNotificacion(
            "Completa los campos obligatorios: proyecto, site, subproyecto, tipo de documento y plantilla.",
            "warning"
        );
        return;
    }

    if (selectedTechnicianNames.size === 0) {
        mostrarNotificacion(
            "Selecciona al menos un técnico para la asignación.",
            "warning"
        );
        return;
    }

    const payload = {
        proyecto_id: Number(proyectoId),
        site_id: Number(siteId),
        subproyecto_id: Number(subproyectoId),
        tipo_documento_id: Number(tipoDocumentoId),
        plantilla_id: Number(plantillaId),
        tecnicos_ids: [...selectedTechnicianNames.keys()].map(Number),
        documentador_id: documentadorId ? Number(documentadorId) : null,
        fecha_limite: fechaLimite || null
    };

    if (fechaAsignacion) {
        payload.fecha_asignacion = fechaAsignacion;
    }

    const textoOriginal = saveButton.innerHTML;

    saveButton.disabled = true;
    saveButton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"
              aria-hidden="true"></span>
        Creando asignación...
    `;

    try {
        const response = await apiFetch(`${API_URL}/asignaciones/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let mensaje =
                `No se pudo crear la asignación (HTTP ${response.status}).`;

            try {
                const error = await response.json();

                if (error.detail) {
                    mensaje = Array.isArray(error.detail)
                        ? error.detail.map(item => item.msg).join("\n")
                        : typeof error.detail === "string"
                            ? error.detail
                            : JSON.stringify(error.detail);
                }
            } catch (_) {}

            throw new Error(mensaje);
        }

        assignmentModal?.hide();
        limpiarModalAsignacion();

        await cargarAsignaciones();

        mostrarNotificacion(
            "La asignación se creó correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al crear la asignación:", error);

        mostrarNotificacion(
            error.message || "Ocurrió un error al crear la asignación.",
            "error"
        );
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = textoOriginal;
    }
}


/* =========================================
   EDITAR Y ELIMINAR ASIGNACIÓN
   ========================================= */

assignmentTableBody?.addEventListener("click", function (event) {
    const viewButton = event.target.closest("[data-view-assignment]");

    if (viewButton) {
        const id = viewButton.dataset.viewAssignment;

        window.location.href =
            `detalle-asignacion.html?id=${encodeURIComponent(id)}`;
        return;
    }

    const editButton = event.target.closest("[data-edit-assignment]");

    if (editButton) {
        const id = editButton.dataset.editAssignment;

        const asignacion = assignmentsData.find(
            item => String(item.id) === String(id)
        );

        if (!asignacion) {
            mostrarNotificacion(
                "No se encontró la asignación que deseas editar.",
                "error"
            );
            return;
        }

        window.abrirModalEditarAsignacion(asignacion);
        return;
    }

    const deleteButton = event.target.closest("[data-delete-assignment]");

    if (!deleteButton) return;

    assignmentIdToDelete = deleteButton.dataset.deleteAssignment;

    const codigo =
        `ASG-${String(assignmentIdToDelete).padStart(4, "0")}`;

    if (eliminarAsignacionMensaje) {
        eliminarAsignacionMensaje.textContent =
            `Se eliminará la asignación ${codigo}. Esta acción no se puede deshacer.`;
    }

    eliminarAsignacionModal?.show();
});

/* =========================================
   CONFIRMAR ELIMINACIÓN DE ASIGNACIÓN
   ========================================= */

btnConfirmarEliminarAsignacion?.addEventListener(
    "click",
    async function () {
        if (!assignmentIdToDelete) return;

        const textoOriginal = btnConfirmarEliminarAsignacion.innerHTML;

        btnConfirmarEliminarAsignacion.disabled = true;
        btnConfirmarEliminarAsignacion.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Eliminando...
        `;

        try {
            const response = await apiFetch(
                `${API_URL}/asignaciones/${assignmentIdToDelete}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                let message =
                    `No se pudo eliminar la asignación (HTTP ${response.status}).`;

                try {
                    const error = await response.json();
                    message = error.detail || message;
                } catch (_) {}

                throw new Error(message);
            }

            eliminarAsignacionModal?.hide();
            assignmentIdToDelete = null;

            await cargarAsignaciones();

        } catch (error) {
            console.error("Error al eliminar asignación:", error);

            if (typeof mostrarNotificacion === "function") {
                mostrarNotificacion(
                    error.message ||
                    "Ocurrió un error al eliminar la asignación.",
                    "error"
                );
            } else {
                console.error(
                    error.message ||
                    "Ocurrió un error al eliminar la asignación."
                );
            }

        } finally {
            btnConfirmarEliminarAsignacion.disabled = false;
            btnConfirmarEliminarAsignacion.innerHTML = textoOriginal;
        }
    }
);


/* =========================================
   SELECTOR DE CLIENTES
   ========================================= */

const clienteAsignacionesSelect = document.getElementById(
    "clienteAsignacionesSelect"
);

const clienteAsignacionesNombre = document.getElementById(
    "clienteAsignacionesNombre"
);

const btnCambiarCliente = document.getElementById(
    "btnCambiarCliente"
);

const selectorClientesPanel = document.getElementById(
    "selectorClientesPanel"
);

const listaClientesAsignaciones = document.getElementById(
    "listaClientesAsignaciones"
);

const mensajeClientesVacios = document.getElementById(
    "mensajeClientesVacios"
);

function mostrarSelectorClientes(mostrar) {
    if (!selectorClientesPanel || !btnCambiarCliente) return;

    selectorClientesPanel.hidden = !mostrar;

    btnCambiarCliente.setAttribute("aria-expanded", String(mostrar));
    btnCambiarCliente.setAttribute(
        "aria-label",
        mostrar ? "Ocultar clientes" : "Mostrar clientes"
    );
}

function actualizarClienteSeleccionado() {
    if (!clienteAsignacionesSelect || !clienteAsignacionesNombre) return;

    const option = clienteAsignacionesSelect.selectedOptions[0];

    clienteAsignacionesNombre.textContent =
        option && option.value
            ? option.textContent.trim()
            : "Seleccionar cliente";
}

function actualizarOpcionesSeleccionadas() {
    if (!clienteAsignacionesSelect || !listaClientesAsignaciones) return;

    listaClientesAsignaciones
        .querySelectorAll(".assignment-client-option")
        .forEach(function (button) {
            const selected =
                button.dataset.value === clienteAsignacionesSelect.value;

            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
}

async function aplicarFiltroClienteAsignaciones(clienteId) {
    proyectosIdsClienteSeleccionado.clear();

    if (!clienteId) {
        renderizarAsignaciones();
        return;
    }

    try {
        const response = await apiFetch(
            `${API_URL}/proyectos/cliente/${encodeURIComponent(clienteId)}`
        );

        if (!response.ok) {
            throw new Error(
                `No se pudieron cargar los proyectos del cliente (HTTP ${response.status}).`
            );
        }

        const proyectos = await response.json();

        if (!Array.isArray(proyectos)) {
            throw new Error(
                "El backend no devolvió una lista de proyectos."
            );
        }

        proyectos.forEach(function (proyecto) {
            if (proyecto.id != null) {
                proyectosIdsClienteSeleccionado.add(
                    String(proyecto.id)
                );
            }
        });

        actualizarFiltroTecnicos();
        renderizarAsignaciones();

    } catch (error) {
        console.error(
            "Error al filtrar asignaciones por cliente:",
            error
        );

        renderizarAsignaciones();

        mostrarNotificacion(
            error.message || "No se pudieron filtrar las asignaciones por cliente.",
            "error"
        );
    }
}

function seleccionarClienteAsignaciones(clienteId) {
    if (!clienteAsignacionesSelect) return;

    clienteAsignacionesSelect.value = String(clienteId);

    clienteAsignacionesSelect.dispatchEvent(
        new Event("change", { bubbles: true })
    );

    actualizarClienteSeleccionado();
    actualizarOpcionesSeleccionadas();
    mostrarSelectorClientes(false);
}

function renderizarClientesAsignaciones(clientes) {
    if (!listaClientesAsignaciones) return;

    listaClientesAsignaciones.innerHTML = "";

    if (mensajeClientesVacios) {
        mensajeClientesVacios.hidden = clientes.length > 0;
    }

    clientes.forEach(function (cliente) {
        const id = cliente.id ?? cliente.client_id;
        const name = cliente.nombre ?? cliente.name;

        if (id == null || !name) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "assignment-client-option";
        button.dataset.value = String(id);

        const icon = document.createElement("span");
        icon.className = "assignment-client-option-icon";
        icon.innerHTML = '<i class="bi bi-building"></i>';

        const text = document.createElement("span");
        text.className = "assignment-client-option-name";
        text.textContent = name;

        button.append(icon, text);

        button.addEventListener("click", function () {
            seleccionarClienteAsignaciones(id);
        });

        listaClientesAsignaciones.appendChild(button);
    });

    actualizarOpcionesSeleccionadas();
}

async function cargarClientesAsignaciones() {
    if (!listaClientesAsignaciones) return;

    listaClientesAsignaciones.innerHTML = "";

    if (mensajeClientesVacios) {
        mensajeClientesVacios.hidden = true;
    }

    try {
        const response = await apiFetch(`${API_URL}/clientes/activos`);

        if (!response.ok) {
            throw new Error(`Error al consultar clientes: HTTP ${response.status}`);
        }

        const clientes = await response.json();

        if (!Array.isArray(clientes)) {
            throw new Error("El backend no devolvió una lista de clientes.");
        }

        if (clienteAsignacionesSelect) {
            clienteAsignacionesSelect.innerHTML = "";

            clientes.forEach(function (cliente) {
                const id = cliente.id ?? cliente.client_id;
                const name = cliente.nombre ?? cliente.name;

                if (id == null || !name) return;

                const option = document.createElement("option");
                option.value = String(id);
                option.textContent = name;

                clienteAsignacionesSelect.appendChild(option);
            });
        }

        renderizarClientesAsignaciones(clientes);
        actualizarClienteSeleccionado();

        if (clienteAsignacionesSelect?.value) {
            await aplicarFiltroClienteAsignaciones(
                clienteAsignacionesSelect.value
            );
        } else {
            proyectosIdsClienteSeleccionado.clear();
            renderizarAsignaciones();
        }
    } catch (error) {
        console.error("No se pudieron cargar los clientes:", error);

        if (mensajeClientesVacios) {
            mensajeClientesVacios.hidden = false;
            mensajeClientesVacios.textContent =
                "No se pudieron cargar los clientes. Verifica la conexión con el servidor.";
        }
    }
}

btnCambiarCliente?.addEventListener("click", function () {
    const isOpen =
        btnCambiarCliente.getAttribute("aria-expanded") === "true";

    mostrarSelectorClientes(!isOpen);
});

clienteAsignacionesSelect?.addEventListener(
    "change",
    async function () {
        actualizarClienteSeleccionado();
        actualizarOpcionesSeleccionadas();

        await aplicarFiltroClienteAsignaciones(this.value);
    }
);

/* CARGAR OPCIONES DE UN SELECT */
function llenarSelectAsignacion(select, registros, textoInicial, obtenerTexto) {
    if (!select) return;

    select.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = textoInicial;

    select.appendChild(opcionInicial);

    registros.forEach(registro => {
        const opcion = document.createElement("option");

        opcion.value = String(registro.id);
        opcion.textContent = obtenerTexto(registro);

        select.appendChild(opcion);
    });

    select.disabled = registros.length === 0;
}


/* CARGAR CLIENTES */
async function cargarClientesModalAsignacion() {
    const select = document.getElementById("assignmentClient");
    if (!select) return;

    const respuesta = await apiFetch(`${API_URL}/clientes/activos`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los clientes.");
    }

    const clientes = await respuesta.json();

    llenarSelectAsignacion(
        select,
        clientes,
        "Seleccionar cliente",
        cliente => cliente.nombre
    );
}


/* CARGAR PROYECTOS DEL CLIENTE */
async function cargarProyectosModalAsignacion(clienteId) {
    const select = document.getElementById("assignmentProject");
    const selectSite = document.getElementById("assignmentSite");
    const selectSubproyecto = document.getElementById("assignmentSubproject");

    llenarSelectAsignacion(select, [], "Seleccionar proyecto", p => p.nombre);
    llenarSelectAsignacion(selectSite, [], "Seleccionar site", s => s.nombre);
    llenarSelectAsignacion(
        selectSubproyecto,
        [],
        "Sin subproyecto",
        s => s.nombre
    );

    if (!clienteId) return;

    const respuesta = await apiFetch(
        `${API_URL}/proyectos/cliente/${clienteId}`
    );

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los proyectos.");
    }

    proyectosAsignacion = await respuesta.json();

    llenarSelectAsignacion(
        select,
        proyectosAsignacion,
        "Seleccionar proyecto",
        proyecto => proyecto.nombre
    );
}


/* CARGAR SITES DEL PROYECTO */
async function cargarSitesModalAsignacion(proyectoId) {
    const select = document.getElementById("assignmentSite");
    const selectSubproyecto = document.getElementById("assignmentSubproject");

    llenarSelectAsignacion(select, [], "Seleccionar site", s => s.nombre);
    llenarSelectAsignacion(
        selectSubproyecto,
        [],
        "Sin subproyecto",
        s => s.nombre
    );

    if (!proyectoId) return;

    /*
     * La ruta GET /sites/ ya se utiliza en el proyecto.
     * Filtramos por proyecto_id para no inventar una ruta nueva.
     */
    const respuesta = await apiFetch(`${API_URL}/sites/`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los sites.");
    }

    const sites = await respuesta.json();

    sitesAsignacion = sites.filter(
        site => String(site.proyecto_id) === String(proyectoId)
    );

    llenarSelectAsignacion(
        select,
        sitesAsignacion,
        "Seleccionar site",
        site => site.nombre
    );
}

/* CARGAR SUBPROYECTOS DEL SITE */
async function cargarSubproyectosModalAsignacion(siteId) {
    const select = document.getElementById("assignmentSubproject");

    llenarSelectAsignacion(
        select,
        [],
        "Sin subproyecto",
        subproyecto => subproyecto.nombre
    );

    if (!siteId) return;

    const respuesta = await apiFetch(`${API_URL}/subproyectos/`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los subproyectos.");
    }

    const subproyectos = await respuesta.json();

    const subproyectosDelSite = subproyectos.filter(
        subproyecto => String(subproyecto.site_id) === String(siteId)
    );

    llenarSelectAsignacion(
        select,
        subproyectosDelSite,
        subproyectosDelSite.length > 0
            ? "Seleccionar subproyecto (opcional)"
            : "Sin subproyectos registrados",
        subproyecto => subproyecto.nombre
    );
}

/* CARGAR TIPOS DE DOCUMENTO */
async function cargarTiposDocumentoModalAsignacion() {
    const select = document.getElementById("assignmentDocumentType");
    if (!select) return;

    const respuesta = await apiFetch(`${API_URL}/tipos-documento/activos`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los tipos de documento.");
    }

    const tipos = await respuesta.json();

    llenarSelectAsignacion(
        select,
        tipos,
        "Seleccionar tipo de documento",
        tipo => tipo.nombre
    );
}


/* CARGAR PLANTILLAS */
async function cargarPlantillasModalAsignacion() {
    const respuesta = await apiFetch(`${API_URL}/plantillas/`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar las plantillas.");
    }

    plantillasAsignacion = await respuesta.json();

    filtrarPlantillasModalAsignacion();
}


/* FILTRAR PLANTILLAS POR TIPO DE DOCUMENTO */
function filtrarPlantillasModalAsignacion() {
    const selectTipo = document.getElementById("assignmentDocumentType");
    const selectPlantilla = document.getElementById("assignmentTemplate");

    if (!selectTipo || !selectPlantilla) return;

    const tipoId = selectTipo.value;

    const plantillasFiltradas = tipoId
        ? plantillasAsignacion.filter(
            plantilla =>
                String(plantilla.tipo_documento_id) === String(tipoId) &&
                plantilla.activo !== false
        )
        : [];

    llenarSelectAsignacion(
        selectPlantilla,
        plantillasFiltradas,
        tipoId
            ? "Seleccionar plantilla (opcional)"
            : "Selecciona primero un tipo de documento",
        plantilla => plantilla.nombre
    );
}


/* CARGAR TÉCNICOS Y DOCUMENTADORES */
async function cargarUsuariosModalAsignacion() {
    const respuesta = await apiFetch(`${API_URL}/usuarios/`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los usuarios.");
    }

    usuariosAsignacion = await respuesta.json();

    const tecnicos = usuariosAsignacion.filter(
        usuario => usuario.activo === true && usuario.rol === "tecnico"
    );

    const documentadores = usuariosAsignacion.filter(
        usuario => usuario.activo === true && usuario.rol === "documentador"
    );

    /* DOCUMENTADORES */
    llenarSelectAsignacion(
        document.getElementById("assignmentDocumenter"),
        documentadores,
        "Seleccionar documentador (opcional)",
        usuario => `${usuario.nombre} ${usuario.apellido || ""}`.trim()
    );

    /* TÉCNICOS */
    const contenedor = document.getElementById("technicianOptions");

    if (!contenedor) return;

    contenedor.replaceChildren();

    tecnicos.forEach(usuario => {
        const opcion = document.createElement("button");

        opcion.type = "button";
        opcion.className = "technician-option";
        opcion.dataset.value = String(usuario.id);
        opcion.dataset.name =
            `${usuario.nombre} ${usuario.apellido || ""}`.trim();

        const avatar = document.createElement("span");
        avatar.className = "technician-option-avatar";
        avatar.textContent = getInitials(opcion.dataset.name);

        const nombre = document.createElement("span");
        nombre.className = "technician-option-name";
        nombre.textContent = opcion.dataset.name;

        opcion.append(avatar, nombre);
        contenedor.appendChild(opcion);
    });

    actualizarOpcionesTecnicosModal();
}


/* ACTUALIZAR VISIBILIDAD Y SELECCIÓN DE TÉCNICOS */
function actualizarOpcionesTecnicosModal() {
    const contenedor = document.getElementById("technicianOptions");
    const busqueda = (
        document.getElementById("technicianSearch")?.value || ""
    ).trim().toLowerCase();

    const vacio = document.getElementById("technicianEmpty");
    if (!contenedor) return;

    let visibles = 0;

    contenedor.querySelectorAll(".technician-option").forEach(opcion => {
        const coincide = opcion.dataset.name.toLowerCase().includes(busqueda);

        opcion.hidden = !coincide;
        opcion.classList.toggle(
            "selected",
            selectedTechnicianNames.has(opcion.dataset.value)
        );

        if (coincide) visibles++;
    });

    if (vacio) vacio.hidden = visibles > 0;
}


/* INICIALIZAR LOS COMBOBOX */
async function inicializarModalAsignacion() {
    try {
        await Promise.all([
            cargarClientesModalAsignacion(),
            cargarTiposDocumentoModalAsignacion(),
            cargarPlantillasModalAsignacion(),
            cargarUsuariosModalAsignacion()
        ]);

    } catch (error) {
        console.error("Error al cargar el formulario de asignaciones:", error);

        mostrarNotificacion(
            error.message || "No se pudieron cargar los datos del formulario.",
            "error"
        );
    }
}


/* =========================================
   CARGAR DATOS DEL MODAL DE EDICIÓN
   ========================================= */

function asignacionEditarSelect(id) {
    return document.getElementById(`editar${id}`);
}

function llenarSelectEdicion(id, registros, textoInicial, obtenerTexto) {
    const select = document.getElementById(id);
    if (!select) return;

    select.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = textoInicial;
    select.appendChild(opcionInicial);

    registros.forEach(registro => {
        const opcion = document.createElement("option");
        opcion.value = String(registro.id);
        opcion.textContent = obtenerTexto(registro);
        select.appendChild(opcion);
    });

    select.disabled = false;
}

async function cargarClientesEdicion() {
    const response = await apiFetch(`${API_URL}/clientes/activos`);

    if (!response.ok) {
        throw new Error("No se pudieron cargar los clientes para editar.");
    }

    const clientes = await response.json();

    llenarSelectEdicion(
        "editarAssignmentClient",
        clientes,
        "Seleccionar cliente",
        cliente => cliente.nombre
    );

    return clientes;
}

async function cargarProyectosEdicion(clienteId) {
    const select = document.getElementById("editarAssignmentProject");

    llenarSelectEdicion(
        "editarAssignmentProject",
        [],
        "Seleccionar proyecto",
        proyecto => proyecto.nombre
    );

    limpiarSelectEdicion(
        "editarAssignmentSite",
        "Seleccionar site"
    );

    limpiarSelectEdicion(
        "editarAssignmentSubproject",
        "Seleccionar subproyecto"
    );

    if (!clienteId) return [];

    const response = await apiFetch(
        `${API_URL}/proyectos/cliente/${encodeURIComponent(clienteId)}`
    );

    if (!response.ok) {
        throw new Error("No se pudieron cargar los proyectos.");
    }

    const proyectos = await response.json();

    llenarSelectEdicion(
        "editarAssignmentProject",
        proyectos,
        "Seleccionar proyecto",
        proyecto => proyecto.nombre
    );

    if (select) select.disabled = false;

    return proyectos;
}

function limpiarSelectEdicion(id, textoInicial) {
    const select = document.getElementById(id);
    if (!select) return;

    select.replaceChildren();

    const opcion = document.createElement("option");
    opcion.value = "";
    opcion.textContent = textoInicial;

    select.appendChild(opcion);
    select.disabled = true;
}

async function cargarSitesEdicion(proyectoId) {
    limpiarSelectEdicion(
        "editarAssignmentSite",
        "Seleccionar site"
    );

    limpiarSelectEdicion(
        "editarAssignmentSubproject",
        "Seleccionar subproyecto"
    );

    if (!proyectoId) return [];

    const response = await apiFetch(`${API_URL}/sites/`);

    if (!response.ok) {
        throw new Error("No se pudieron cargar los sites.");
    }

    const sites = await response.json();

    const filtrados = sites.filter(
        site => String(site.proyecto_id) === String(proyectoId)
    );

    llenarSelectEdicion(
        "editarAssignmentSite",
        filtrados,
        "Seleccionar site",
        site => site.nombre
    );

    return filtrados;
}

async function cargarSubproyectosEdicion(siteId) {
    limpiarSelectEdicion(
        "editarAssignmentSubproject",
        "Seleccionar subproyecto"
    );

    if (!siteId) return [];

    const response = await apiFetch(`${API_URL}/subproyectos/`);

    if (!response.ok) {
        throw new Error("No se pudieron cargar los subproyectos.");
    }

    const subproyectos = await response.json();

    const filtrados = subproyectos.filter(
        subproyecto => String(subproyecto.site_id) === String(siteId)
    );

    llenarSelectEdicion(
        "editarAssignmentSubproject",
        filtrados,
        filtrados.length
            ? "Seleccionar subproyecto"
            : "Sin subproyectos registrados",
        subproyecto => subproyecto.nombre
    );

    return filtrados;
}

async function cargarTiposDocumentoEdicion() {
    const response = await apiFetch(`${API_URL}/tipos-documento/activos`);

    if (!response.ok) {
        throw new Error("No se pudieron cargar los tipos de documento.");
    }

    const tipos = await response.json();

    llenarSelectEdicion(
        "editarAssignmentDocumentType",
        tipos,
        "Seleccionar tipo de documento",
        tipo => tipo.nombre
    );

    return tipos;
}

async function cargarPlantillasEdicion(tipoDocumentoId) {
    const select = document.getElementById("editarAssignmentTemplate");

    if (!tipoDocumentoId) {
        limpiarSelectEdicion(
            "editarAssignmentTemplate",
            "Selecciona primero un tipo de documento"
        );
        return [];
    }

    const plantillas = plantillasAsignacion.filter(
        plantilla =>
            String(plantilla.tipo_documento_id) === String(tipoDocumentoId) &&
            plantilla.activo !== false
    );

    llenarSelectEdicion(
        "editarAssignmentTemplate",
        plantillas,
        "Seleccionar plantilla",
        plantilla => plantilla.nombre
    );

    if (select) select.disabled = false;

    return plantillas;
}

function nombreUsuarioAsignacion(usuario) {
    return `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();
}

async function cargarPersonalEdicion() {
    if (!usuariosAsignacion.length) {
        const response = await apiFetch(`${API_URL}/usuarios/`);

        if (!response.ok) {
            throw new Error("No se pudieron cargar los usuarios.");
        }

        usuariosAsignacion = await response.json();
    }

    const documentadores = usuariosAsignacion.filter(
        usuario =>
            usuario.activo === true &&
            usuario.rol === "documentador"
    );

    llenarSelectEdicion(
        "editarAssignmentDocumenter",
        documentadores,
        "Seleccionar documentador (opcional)",
        nombreUsuarioAsignacion
    );

    renderizarTecnicosEdicion();
}

function renderizarTecnicosEdicion() {
    const contenedor = document.getElementById("editarTechnicianOptions");
    const seleccionados = document.getElementById("editarSelectedTechnicians");
    const contador = document.getElementById("editarTechnicianCount");
    const vacio = document.getElementById("editarTechnicianEmpty");
    const busqueda = document.getElementById("editarTechnicianSearch");

    if (!contenedor || !seleccionados) return;

    const tecnicos = usuariosAsignacion.filter(
        usuario =>
            usuario.activo === true &&
            usuario.rol === "tecnico"
    );

    const termino = normalizeText(busqueda?.value);

    contenedor.replaceChildren();
    seleccionados.replaceChildren();

    let visibles = 0;

    tecnicos.forEach(usuario => {
        const id = String(usuario.id);
        const nombre = nombreUsuarioAsignacion(usuario);
        const coincide = normalizeText(nombre).includes(termino);

        if (!coincide) return;

        visibles++;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "technician-option";
        boton.dataset.value = id;
        boton.dataset.name = nombre;

        if (editarTechnicianNames.has(id)) {
            boton.classList.add("selected");
        }

        const avatar = document.createElement("span");
        avatar.className = "technician-option-avatar";
        avatar.textContent = getInitials(nombre);

        const texto = document.createElement("span");
        texto.className = "technician-option-name";
        texto.textContent = nombre;

        boton.append(avatar, texto);
        contenedor.appendChild(boton);
    });

    editarTechnicianNames.forEach((nombre, id) => {
        const etiqueta = document.createElement("span");
        etiqueta.className = "selected-technician";

        const avatar = document.createElement("span");
        avatar.className = "selected-technician-avatar";
        avatar.textContent = getInitials(nombre);

        const texto = document.createElement("span");
        texto.textContent = nombre;

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "remove-technician";
        quitar.dataset.value = id;
        quitar.title = "Quitar técnico";
        quitar.setAttribute("aria-label", `Quitar ${nombre}`);

        const icono = document.createElement("i");
        icono.className = "bi bi-x";

        quitar.appendChild(icono);
        etiqueta.append(avatar, texto, quitar);
        seleccionados.appendChild(etiqueta);
    });

    if (contador) {
        contador.textContent = String(editarTechnicianNames.size);
    }

    if (vacio) {
        vacio.hidden = visibles > 0;
    }
}

/* =========================================
   EVENTOS DEL MODAL DE EDICIÓN
   ========================================= */

document.getElementById("editarAssignmentClient")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarProyectosEdicion(this.value);
        } catch (error) {
            mostrarNotificacion(error.message, "error");
        }
    }
);

document.getElementById("editarAssignmentProject")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarSitesEdicion(this.value);
        } catch (error) {
            mostrarNotificacion(error.message, "error");
        }
    }
);

document.getElementById("editarAssignmentSite")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarSubproyectosEdicion(this.value);
        } catch (error) {
            mostrarNotificacion(error.message, "error");
        }
    }
);

document.getElementById("editarAssignmentDocumentType")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarPlantillasEdicion(this.value);
        } catch (error) {
            mostrarNotificacion(error.message, "error");
        }
    }
);

document.getElementById("editarTechnicianSearch")?.addEventListener(
    "input",
    renderizarTecnicosEdicion
);

document.getElementById("editarTechnicianOptions")?.addEventListener(
    "click",
    function (event) {
        const boton = event.target.closest(".technician-option");
        if (!boton) return;

        const id = String(boton.dataset.value);
        const nombre = boton.dataset.name || "";

        if (editarTechnicianNames.has(id)) {
            editarTechnicianNames.delete(id);
        } else {
            editarTechnicianNames.set(id, nombre);
        }

        renderizarTecnicosEdicion();
    }
);

document.getElementById("editarSelectedTechnicians")?.addEventListener(
    "click",
    function (event) {
        const boton = event.target.closest(".remove-technician");
        if (!boton) return;

        editarTechnicianNames.delete(String(boton.dataset.value));
        renderizarTecnicosEdicion();
    }
);


/* =========================================
   ABRIR MODAL EDITAR ASIGNACIÓN
   ========================================= */

async function abrirModalEditarAsignacion(asignacion) {
    if (editandoAsignacionEnProceso) return;

    editandoAsignacionEnProceso = true;

    try {
        assignmentEditingId = asignacion.id;

        document.getElementById("editarAsignacionId").value =
            String(asignacion.id);

        editarTechnicianNames.clear();

        const botonEditar = document.querySelector(
            `[data-edit-assignment="${asignacion.id}"]`
        );

        if (botonEditar) botonEditar.disabled = true;

        const [clientes] = await Promise.all([
            cargarClientesEdicion(),
            cargarTiposDocumentoEdicion(),
            cargarPersonalEdicion()
        ]);

        const respuestaPlantillas = await apiFetch(`${API_URL}/plantillas/`);

        if (!respuestaPlantillas.ok) {
            throw new Error("No se pudieron cargar las plantillas para editar.");
        }

        plantillasAsignacion = await respuestaPlantillas.json();

        // Buscar el cliente al que pertenece el proyecto.
        let clienteEncontrado = null;
        let proyectosEncontrados = [];

        for (const cliente of clientes) {
            const response = await apiFetch(
                `${API_URL}/proyectos/cliente/${encodeURIComponent(cliente.id)}`
            );

            if (!response.ok) continue;

            const proyectos = await response.json();

            const existe = proyectos.some(
                proyecto =>
                    String(proyecto.id) === String(asignacion.proyecto_id)
            );

            if (existe) {
                clienteEncontrado = cliente;
                proyectosEncontrados = proyectos;
                break;
            }
        }

        if (!clienteEncontrado) {
            throw new Error(
                "No se pudo identificar el cliente del proyecto de esta asignación."
            );
        }

        const clienteSelect =
            document.getElementById("editarAssignmentClient");

        clienteSelect.value = String(clienteEncontrado.id);

        llenarSelectEdicion(
            "editarAssignmentProject",
            proyectosEncontrados,
            "Seleccionar proyecto",
            proyecto => proyecto.nombre
        );

        document.getElementById("editarAssignmentProject").value =
            String(asignacion.proyecto_id);

        const sites = await cargarSitesEdicion(asignacion.proyecto_id);

        const siteExiste = sites.some(
            site => String(site.id) === String(asignacion.site_id)
        );

        if (!siteExiste) {
            throw new Error(
                "El site actual no aparece entre los sites del proyecto seleccionado."
            );
        }

        document.getElementById("editarAssignmentSite").value =
            String(asignacion.site_id);

        const subproyectos = await cargarSubproyectosEdicion(asignacion.site_id);

        const subproyectoSelect = document.getElementById(
            "editarAssignmentSubproject"
        );

        const subproyectoActual = asignacion.subproyecto_id;

        if (
            subproyectoActual != null &&
            subproyectoActual !== ""
        ) {
            const subproyectoExiste = subproyectos.some(
                subproyecto =>
                    String(subproyecto.id) === String(subproyectoActual)
            );

            if (!subproyectoExiste) {
                throw new Error(
                    "El subproyecto actual no pertenece al site seleccionado o ya no está disponible."
                );
            }

            subproyectoSelect.value = String(subproyectoActual);
        } else {
            subproyectoSelect.value = "";
        }

        document.getElementById("editarAssignmentSubproject").value =
            String(asignacion.subproyecto_id);

        document.getElementById("editarAssignmentDocumentType").value =
            String(asignacion.tipo_documento_id);

        await cargarPlantillasEdicion(asignacion.tipo_documento_id);

        const plantillaSelect =
            document.getElementById("editarAssignmentTemplate");

        plantillaSelect.value = String(asignacion.plantilla_id);

        if (plantillaSelect.value !== String(asignacion.plantilla_id)) {
            throw new Error(
                "No se encontró la plantilla actual entre las plantillas activas del tipo de documento."
            );
        }

        const tecnicosActuales = Array.isArray(asignacion.tecnicos)
            ? asignacion.tecnicos
            : [];

        tecnicosActuales.forEach(tecnico => {
            editarTechnicianNames.set(
                String(tecnico.id),
                nombreUsuarioAsignacion(tecnico)
            );
        });

        renderizarTecnicosEdicion();

        const documenterSelect =
            document.getElementById("editarAssignmentDocumenter");

        documenterSelect.value = asignacion.documentador_id
            ? String(asignacion.documentador_id)
            : "";

        document.getElementById("editarAssignmentStartDate").value =
            asignacion.fecha_asignacion
                ? String(asignacion.fecha_asignacion).substring(0, 10)
                : "";

        document.getElementById("editarAssignmentDueDate").value =
            asignacion.fecha_limite
                ? String(asignacion.fecha_limite).substring(0, 10)
                : "";

        editarAsignacionModal?.show();

    } catch (error) {
        console.error("Error al abrir la asignación para editar:", error);

        mostrarNotificacion(
            error.message || "No se pudo cargar la asignación para editar.",
            "error"
        );

        assignmentEditingId = null;

    } finally {
        editandoAsignacionEnProceso = false;

        const botonEditar = document.querySelector(
            `[data-edit-assignment="${asignacion.id}"]`
        );

        if (botonEditar) botonEditar.disabled = false;
    }
}

window.abrirModalEditarAsignacion = abrirModalEditarAsignacion;

/* =========================================
   ACTUALIZAR ASIGNACIÓN
   ========================================= */

btnActualizarAsignacion?.addEventListener(
    "click",
    async function () {
        if (assignmentEditingId === null) {
            mostrarNotificacion(
                "No se ha seleccionado una asignación para editar.",
                "warning"
            );
            return;
        }

        const proyectoId =
            document.getElementById("editarAssignmentProject")?.value;

        const siteId =
            document.getElementById("editarAssignmentSite")?.value;

        const subproyectoId =
            document.getElementById("editarAssignmentSubproject")?.value;

        const tipoDocumentoId =
            document.getElementById("editarAssignmentDocumentType")?.value;

        const plantillaId =
            document.getElementById("editarAssignmentTemplate")?.value;

        const documentadorId =
            document.getElementById("editarAssignmentDocumenter")?.value;

        const fechaAsignacion =
            document.getElementById("editarAssignmentStartDate")?.value;

        const fechaLimite =
            document.getElementById("editarAssignmentDueDate")?.value;

        const estado =
            document.getElementById("editarAssignmentStatus")?.value;

        if (
            !proyectoId ||
            !siteId ||
            !subproyectoId ||
            !tipoDocumentoId ||
            !plantillaId
        ) {
            mostrarNotificacion(
                "Completa los campos obligatorios, incluido el subproyecto y la plantilla.",
                "warning"
            );
            return;
        }

        if (editarTechnicianNames.size === 0) {
            mostrarNotificacion(
                "Selecciona al menos un técnico para la asignación.",
                "warning"
            );
            return;
        }

        const payload = {
            proyecto_id: Number(proyectoId),
            site_id: Number(siteId),
            subproyecto_id: Number(subproyectoId),
            tipo_documento_id: Number(tipoDocumentoId),
            plantilla_id: Number(plantillaId),
            tecnicos_ids: [...editarTechnicianNames.keys()].map(Number),
            documentador_id: documentadorId
                ? Number(documentadorId)
                : null,
            fecha_limite: fechaLimite || null,
            estado: estado
        };

        if (fechaAsignacion) {
            payload.fecha_asignacion = fechaAsignacion;
        }

        const boton = this;
        const textoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Guardando cambios...
        `;

        try {
            const response = await apiFetch(
                `${API_URL}/asignaciones/${assignmentEditingId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                let mensaje =
                    `No se pudo actualizar la asignación (HTTP ${response.status}).`;

                try {
                    const error = await response.json();

                    if (error.detail) {
                        mensaje = Array.isArray(error.detail)
                            ? error.detail.map(item => item.msg).join("\n")
                            : error.detail;
                    }
                } catch (_) {}

                throw new Error(mensaje);
            }

            editarAsignacionModal?.hide();

            assignmentEditingId = null;
            editarTechnicianNames.clear();

            await cargarAsignaciones();

            mostrarNotificacion(
                "La asignación se actualizó correctamente.",
                "success"
            );

        } catch (error) {
            console.error("Error al actualizar la asignación:", error);

            mostrarNotificacion(
                error.message || "Ocurrió un error al actualizar la asignación.",
                "error"
            );

        } finally {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }
);

editarAsignacionModalElement?.addEventListener(
    "hidden.bs.modal",
    function () {
        assignmentEditingId = null;
        editarTechnicianNames.clear();

        const busqueda = document.getElementById("editarTechnicianSearch");
        if (busqueda) busqueda.value = "";

        const campos = [
            "editarAsignacionId",
            "editarAssignmentClient",
            "editarAssignmentProject",
            "editarAssignmentSite",
            "editarAssignmentSubproject",
            "editarAssignmentDocumentType",
            "editarAssignmentTemplate",
            "editarAssignmentDocumenter",
            "editarAssignmentStartDate",
            "editarAssignmentDueDate",
            "editarAssignmentStatus"
        ];

        campos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = "";
        });

        renderizarTecnicosEdicion();
    }
);


/* EVENTOS DEPENDIENTES */
document.getElementById("assignmentClient")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarProyectosModalAsignacion(this.value);
        } catch (error) {
            console.error("Error al cargar los proyectos:", error);

            mostrarNotificacion(
                error.message || "No se pudieron cargar los proyectos.",
                "error"
            );
        }
    }
);

document.getElementById("assignmentProject")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarSitesModalAsignacion(this.value);
        } catch (error) {
            console.error("Error al cargar los sites:", error);

            mostrarNotificacion(
                error.message || "No se pudieron cargar los sites.",
                "error"
            );
        }
    }
);

document.getElementById("assignmentSite")?.addEventListener(
    "change",
    async function () {
        try {
            await cargarSubproyectosModalAsignacion(this.value);
        } catch (error) {
            console.error("Error al cargar los subproyectos:", error);

            mostrarNotificacion(
                error.message || "No se pudieron cargar los subproyectos.",
                "error"
            );
        }
    }
);

document.getElementById("assignmentDocumentType")?.addEventListener(
    "change",
    filtrarPlantillasModalAsignacion
);


/* SELECCIÓN DINÁMICA DE TÉCNICOS */
document.getElementById("technicianOptions")?.addEventListener(
    "click",
    function (event) {
        const opcion = event.target.closest(".technician-option");
        if (!opcion) return;

        const id = opcion.dataset.value;
        const nombre = opcion.dataset.name;

        if (selectedTechnicianNames.has(id)) {
            selectedTechnicianNames.delete(id);
        } else {
            selectedTechnicianNames.set(id, nombre);
        }

        updateTechnicianUI();
        actualizarOpcionesTecnicosModal();
    }
);

document.getElementById("technicianSearch")?.addEventListener(
    "input",
    actualizarOpcionesTecnicosModal
);



document.getElementById("newAssignmentButton")?.addEventListener(
    "click",
    async function () {
        const boton = this;
        const textoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Cargando...
        `;

        try {
            limpiarModalAsignacion();
            assignmentEditingId = null;

            await inicializarModalAsignacion();

            assignmentModal?.show();

        } catch (error) {
            console.error("Error al preparar una nueva asignación:", error);

            mostrarNotificacion(
                error.message || "No se pudo preparar el formulario.",
                "error"
            );
        } finally {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }
);


/* =========================================
   INICIALIZACIÓN
   ========================================= */

mostrarSelectorClientes(false);
cargarClientesAsignaciones();
cargarAsignaciones();