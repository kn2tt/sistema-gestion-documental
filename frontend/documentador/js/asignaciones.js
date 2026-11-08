"use strict";

/* =========================================
   CONFIGURACIÓN
   ========================================= */

const API_URL = "http://127.0.0.1:8000";
const ASIGNACIONES_POR_PAGINA = 10;

let asignacionesData = [];
let paginaActualAsignaciones = 1;
let vistaAsignacionesActual = "activas";
let clienteSeleccionado = "";

/* =========================================
   ELEMENTOS
   ========================================= */

const assignmentTableBody = document.getElementById(
    "assignmentTableBody"
);

const searchInput = document.getElementById("searchInput");

const assignmentViewCards = document.querySelectorAll(
    ".assignment-view-card"
);

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

/* =========================================
   API
   ========================================= */

async function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}

async function obtenerRespuesta(response) {
    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const mensaje = typeof data?.detail === "string"
            ? data.detail
            : "No se pudo completar la solicitud.";

        throw new Error(mensaje);
    }

    return data;
}

/* =========================================
   UTILIDADES
   ========================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function normalizarTexto(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obtenerNombreCompleto(usuario) {
    return [
        usuario?.nombre,
        usuario?.apellido
    ].filter(Boolean).join(" ").trim();
}

function obtenerIniciales(nombre) {
    return String(nombre ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(parte => parte.charAt(0).toUpperCase())
        .join("") || "D";
}

function fechaLabel(value) {
    if (!value) return "Sin fecha límite";

    const fecha = String(value).substring(0, 10);
    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return escapeHTML(fecha);
    }

    const [year, month, day] = partes;

    const meses = [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic"
    ];

    return `${Number(day)} ${meses[Number(month) - 1] ?? ""} ${year}`;
}

function asignacionLabel(id) {
    return `ASG-${String(id).padStart(4, "0")}`;
}

/* =========================================
   ESTADOS
   ========================================= */

function estadoLabel(estado) {
    const labels = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        pendiente_documentacion: "Pendiente de documentación",
        en_documentacion: "En documentación",
        en_revision: "En revisión",
        observado: "Observado",
        completado: "Completado"
    };

    return labels[estado] ?? estado ?? "Sin estado";
}

function estadoClass(estado) {
    const clases = {
        pendiente: "pending",
        en_proceso: "process",
        pendiente_documentacion: "pending",
        en_documentacion: "process",
        en_revision: "process",
        observado: "observed",
        completado: "complete"
    };

    return clases[estado] ?? "pending";
}

function esAsignacionActiva(estado) {
    return [
        "pendiente",
        "en_proceso",
        "pendiente_documentacion",
        "en_documentacion",
        "en_revision"
    ].includes(estado);
}

/* =========================================
   USUARIO Y SESIÓN
   ========================================= */

async function cargarUsuario() {
    const response = await apiFetch(`${API_URL}/auth/me`);
    const usuario = await obtenerRespuesta(response);

    if (usuario.rol?.toLowerCase() !== "documentador") {
        window.location.replace("../index.html");
        return false;
    }

    const nombre = obtenerNombreCompleto(usuario) || "Documentador";
    const iniciales = obtenerIniciales(nombre);

    document.getElementById("sidebarUserName").textContent = nombre;
    document.getElementById("sidebarUserEmail").textContent =
        usuario.correo || "Usuario del sistema";

    document.getElementById("sidebarUserAvatar").textContent = iniciales;
    document.getElementById("topbarUserName").textContent = nombre;
    document.getElementById("topbarUserAvatar").textContent = iniciales;

    return true;
}

/* =========================================
   RESUMEN
   ========================================= */

function actualizarResumen(asignaciones) {
    const total = asignaciones.length;

    const pendientes = asignaciones.filter(item => [
        "pendiente",
        "pendiente_documentacion"
    ].includes(item.estado)).length;

    const enDocumentacion = asignaciones.filter(item => [
        "en_documentacion",
        "en_revision",
        "observado"
    ].includes(item.estado)).length;

    const completadas = asignaciones.filter(
        item => item.estado === "completado"
    ).length;

    document.getElementById("totalAsignaciones").textContent = total;
    document.getElementById("asignacionesPendientes").textContent = pendientes;
    document.getElementById("asignacionesEnDocumentacion").textContent =
        enDocumentacion;
    document.getElementById("asignacionesCompletadas").textContent = completadas;
}

/* =========================================
   SELECTOR DE CLIENTES
   ========================================= */

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
            : "Todos los clientes";
}

function actualizarOpcionesSeleccionadas() {
    if (!clienteAsignacionesSelect || !listaClientesAsignaciones) return;

    listaClientesAsignaciones
        .querySelectorAll(".assignment-client-option")
        .forEach(button => {
            const selected =
                button.dataset.value === clienteAsignacionesSelect.value;

            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
}

function aplicarFiltroClienteAsignaciones(clienteNombre) {
    clienteSeleccionado = clienteNombre || "";
    paginaActualAsignaciones = 1;

    renderizarAsignaciones();
}

function seleccionarClienteAsignaciones(clienteNombre) {
    if (!clienteAsignacionesSelect) return;

    clienteAsignacionesSelect.value = clienteNombre;

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

    clientes.forEach(cliente => {
        const nombre = cliente.nombre;

        if (!nombre) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "assignment-client-option";
        button.dataset.value = nombre;
        button.setAttribute("aria-pressed", "false");

        const icon = document.createElement("span");
        icon.className = "assignment-client-option-icon";
        icon.innerHTML = '<i class="bi bi-building"></i>';

        const text = document.createElement("span");
        text.className = "assignment-client-option-name";
        text.textContent = nombre;

        button.append(icon, text);

        button.addEventListener("click", () => {
            seleccionarClienteAsignaciones(nombre);
        });

        listaClientesAsignaciones.appendChild(button);
    });

    actualizarOpcionesSeleccionadas();
}

function cargarClientesAsignaciones() {
    if (!listaClientesAsignaciones) return;

    const nombresClientes = [
        ...new Set(
            asignacionesData
                .map(assignment => assignment.cliente_nombre)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    const clientes = nombresClientes.map(nombre => ({ nombre }));

    if (clienteAsignacionesSelect) {
        clienteAsignacionesSelect.innerHTML = "";

        const optionTodos = document.createElement("option");
        optionTodos.value = "";
        optionTodos.textContent = "Todos los clientes";
        clienteAsignacionesSelect.appendChild(optionTodos);

        clientes.forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.nombre;
            option.textContent = cliente.nombre;

            clienteAsignacionesSelect.appendChild(option);
        });
    }

    renderizarClientesAsignaciones(clientes);

    if (
        clienteSeleccionado &&
        nombresClientes.includes(clienteSeleccionado)
    ) {
        clienteAsignacionesSelect.value = clienteSeleccionado;
    } else {
        clienteSeleccionado = nombresClientes[0] || "";
        clienteAsignacionesSelect.value = clienteSeleccionado;
    }

    actualizarClienteSeleccionado();
    actualizarOpcionesSeleccionadas();

    aplicarFiltroClienteAsignaciones(clienteSeleccionado);
}

btnCambiarCliente?.addEventListener("click", () => {
    const isOpen =
        btnCambiarCliente.getAttribute("aria-expanded") === "true";

    mostrarSelectorClientes(!isOpen);
});

clienteAsignacionesSelect?.addEventListener("change", function () {
    actualizarClienteSeleccionado();
    actualizarOpcionesSeleccionadas();

    aplicarFiltroClienteAsignaciones(this.value);
});

/* =========================================
   FILTROS POR ESTADO Y BÚSQUEDA
   ========================================= */

function obtenerAsignacionesFiltradas() {
    const busqueda = normalizarTexto(searchInput.value);

    return asignacionesData.filter(asignacion => {
        const contenido = normalizarTexto([
            asignacion.id,
            asignacion.proyecto_nombre,
            asignacion.site_nombre,
            asignacion.subproyecto_nombre,
            asignacion.tipo_documento_nombre,
            asignacion.estado
        ].join(" "));

        const coincideBusqueda =
            !busqueda || contenido.includes(busqueda);

        let coincideVista = true;

        if (vistaAsignacionesActual === "activas") {
            coincideVista = esAsignacionActiva(asignacion.estado);
        } else if (vistaAsignacionesActual === "observadas") {
            coincideVista = asignacion.estado === "observado";
        } else if (vistaAsignacionesActual === "completadas") {
            coincideVista = asignacion.estado === "completado";
        }

        const coincideCliente =
            !clienteSeleccionado ||
            normalizarTexto(asignacion.cliente_nombre) ===
            normalizarTexto(clienteSeleccionado);

        return coincideBusqueda && coincideVista && coincideCliente;
    });
}

assignmentViewCards.forEach(button => {
    button.addEventListener("click", function () {
        assignmentViewCards.forEach(card => {
            card.classList.remove("active");
            card.setAttribute("aria-pressed", "false");
        });

        this.classList.add("active");
        this.setAttribute("aria-pressed", "true");

        vistaAsignacionesActual = this.dataset.assignmentView;
        paginaActualAsignaciones = 1;

        renderizarAsignaciones();
    });
});

searchInput.addEventListener("input", () => {
    paginaActualAsignaciones = 1;
    renderizarAsignaciones();
});

/* =========================================
   RENDERIZADO DE LA TABLA
   ========================================= */

function renderizarAsignaciones() {
    const asignaciones = obtenerAsignacionesFiltradas();
    const total = asignaciones.length;

    const totalPaginas = Math.ceil(
        total / ASIGNACIONES_POR_PAGINA
    );

    if (totalPaginas === 0) {
        paginaActualAsignaciones = 1;
    } else if (paginaActualAsignaciones > totalPaginas) {
        paginaActualAsignaciones = totalPaginas;
    }

    const inicio = (
        paginaActualAsignaciones - 1
    ) * ASIGNACIONES_POR_PAGINA;

    const registrosPagina = asignaciones.slice(
        inicio,
        inicio + ASIGNACIONES_POR_PAGINA
    );

    document.getElementById("totalResultados").textContent =
        `${total} ${total === 1
            ? "asignación encontrada"
            : "asignaciones encontradas"}`;

    if (total === 0) {
        assignmentTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="documentador-empty-icon">
                        <i class="bi bi-folder2-open"></i>
                    </div>

                    <strong>No se encontraron asignaciones</strong>

                    <span>
                        No hay asignaciones que coincidan con los filtros seleccionados.
                    </span>
                </td>
            </tr>
        `;

        actualizarContador(0);
        actualizarPaginacion(0);
        return;
    }

    assignmentTableBody.innerHTML = registrosPagina.map(asignacion => {
        const id = Number(asignacion.id);

        const proyecto =
            asignacion.proyecto_nombre ||
            `Proyecto ${asignacion.proyecto_id ?? ""}`;

        const site =
            asignacion.site_nombre ||
            `Site ${asignacion.site_id ?? ""}`;

        const subproyecto =
            asignacion.subproyecto_nombre ||
            `Subproyecto ${asignacion.subproyecto_id ?? ""}`;

        const documento =
            asignacion.tipo_documento_nombre ||
            `Documento ${asignacion.tipo_documento_id ?? ""}`;

        const codigo = asignacionLabel(id);
        const urlDetalle =
            `detalle-asignacion.html?id=${encodeURIComponent(id)}`;

        return `
            <tr>
                <td>
                    <a
                        href="${urlDetalle}"
                        class="assignment-name"
                        title="Ver detalle de la asignación"
                    >
                        ${escapeHTML(proyecto)}
                    </a>

                    <span class="assignment-code">
                        ${escapeHTML(codigo)}
                    </span>
                </td>

                <td>
                    <strong class="site-code">
                        ${escapeHTML(site)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(subproyecto)}
                </td>

                <td>
                    <span class="document-name">
                        ${escapeHTML(documento)}
                    </span>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(fechaLabel(asignacion.fecha_limite))}
                    </strong>
                </td>

                <td>
                    <span class="assignment-status ${estadoClass(
                        asignacion.estado
                    )}">
                        ${escapeHTML(estadoLabel(asignacion.estado))}
                    </span>
                </td>

                <td>
                    <a
                        href="${urlDetalle}"
                        class="table-action"
                        title="Ver detalle"
                        aria-label="Ver detalle de la asignación ${escapeHTML(codigo)}"
                    >
                        <i class="bi bi-eye"></i>
                    </a>
                </td>
            </tr>
        `;
    }).join("");

    actualizarContador(total);
    actualizarPaginacion(totalPaginas);
}

/* =========================================
   PAGINACIÓN
   ========================================= */

function actualizarContador(total) {
    const contador = document.getElementById(
        "contadorAsignaciones"
    );

    if (total === 0) {
        contador.textContent = "Mostrando 0 de 0 asignaciones";
        return;
    }

    const inicio = (
        paginaActualAsignaciones - 1
    ) * ASIGNACIONES_POR_PAGINA + 1;

    const fin = Math.min(
        paginaActualAsignaciones * ASIGNACIONES_POR_PAGINA,
        total
    );

    contador.textContent =
        `Mostrando ${inicio}–${fin} de ${total} asignaciones`;
}

function actualizarPaginacion(totalPaginas) {
    const contenedor = document.getElementById(
        "paginacionAsignaciones"
    );

    contenedor.replaceChildren();

    function crearBoton(texto, pagina, opciones = {}) {
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "pagination-button";
        boton.textContent = texto;

        if (opciones.activo) {
            boton.classList.add("active");
            boton.setAttribute("aria-current", "page");
        }

        if (opciones.deshabilitado) {
            boton.classList.add("disabled");
            boton.disabled = true;
        }

        boton.addEventListener("click", () => {
            if (boton.disabled) return;

            paginaActualAsignaciones = pagina;
            renderizarAsignaciones();
        });

        contenedor.appendChild(boton);
    }

    crearBoton(
        "‹",
        Math.max(1, paginaActualAsignaciones - 1),
        {
            deshabilitado:
                totalPaginas === 0 || paginaActualAsignaciones === 1
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
        "›",
        Math.min(totalPaginas, paginaActualAsignaciones + 1),
        {
            deshabilitado:
                totalPaginas === 0 ||
                paginaActualAsignaciones >= totalPaginas
        }
    );
}

/* =========================================
   CARGAR ASIGNACIONES
   ========================================= */

async function cargarAsignaciones() {
    assignmentTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Cargando asignaciones...
            </td>
        </tr>
    `;

    try {
        const response = await apiFetch(
            `${API_URL}/asignaciones/documentador/mis-asignaciones`
        );

        if (response.status === 401 || response.status === 403) {
            window.location.replace("../index.html");
            return;
        }

        const data = await obtenerRespuesta(response);

        if (!Array.isArray(data)) {
            throw new Error("El servidor no devolvió una lista de asignaciones.");
        }

        asignacionesData = data;

        actualizarResumen(asignacionesData);
        cargarClientesAsignaciones();
        renderizarAsignaciones();

    } catch (error) {
        console.error("Error al cargar asignaciones:", error);

        assignmentTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="documentador-empty-icon">
                        <i class="bi bi-exclamation-circle"></i>
                    </div>

                    <strong>No se pudieron cargar las asignaciones.</strong>

                    <span>
                        Comprueba tu conexión e inténtalo nuevamente.
                    </span>

                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm mt-3"
                        id="retryAssignmentsButton"
                    >
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Reintentar
                    </button>
                </td>
            </tr>
        `;

        document.getElementById("totalResultados").textContent =
            "No se pudieron cargar las asignaciones";

        document.getElementById("contadorAsignaciones").textContent = "";

        document.getElementById("retryAssignmentsButton")
            ?.addEventListener("click", cargarAsignaciones);
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
   INICIALIZACIÓN
   ========================================= */

async function inicializarPagina() {
    configurarMenu();

    try {
        const sesionValida = await cargarUsuario();

        if (!sesionValida) return;

        await cargarAsignaciones();

    } catch (error) {
        console.error("Error al inicializar el panel:", error);

        window.mostrarNotificacion?.(
            "No se pudo validar tu sesión. Inicia sesión nuevamente.",
            "error"
        );

        window.location.replace("../index.html");
    }
}

inicializarPagina();