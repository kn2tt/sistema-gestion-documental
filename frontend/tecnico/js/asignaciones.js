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

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
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
        .join("") || "T";
}


function fechaLabel(value) {
    if (!value) return "Sin fecha límite";

    const fecha = String(value).substring(0, 10);
    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    const [year, month, day] = partes;

    const meses = [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic"
    ];

    return `${Number(day)} ${meses[Number(month) - 1] ?? ""} ${year}`;
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
   NOTIFICACIONES
   ========================================= */

function mostrarNotificacion(mensaje, tipo = "info") {
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

    const config = configuracion[tipo] ?? configuracion.info;

    const elemento = document.createElement("div");
    elemento.className = `system-notification ${tipo}`;

    const encabezado = document.createElement("div");
    encabezado.className = "notification-header";

    const icono = document.createElement("i");
    icono.className = `bi ${config.icono} notification-icon`;

    const contenido = document.createElement("div");
    contenido.className = "notification-content";

    const titulo = document.createElement("div");
    titulo.className = "notification-title";
    titulo.textContent = config.titulo;

    const texto = document.createElement("div");
    texto.className = "notification-message";
    texto.textContent = mensaje;

    const cerrar = document.createElement("button");
    cerrar.type = "button";
    cerrar.className = "notification-close";
    cerrar.setAttribute("aria-label", "Cerrar notificación");
    cerrar.innerHTML = '<i class="bi bi-x"></i>';

    cerrar.addEventListener("click", () => elemento.remove());

    contenido.append(titulo, texto);
    encabezado.append(icono, contenido, cerrar);
    elemento.appendChild(encabezado);
    contenedor.appendChild(elemento);

    setTimeout(() => {
        elemento.remove();

        if (contenedor.isConnected && !contenedor.children.length) {
            contenedor.remove();
        }
    }, 4500);
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

    clientes.forEach(function (cliente) {
        const nombre = cliente.nombre;

        if (!nombre) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "assignment-client-option";
        button.dataset.value = nombre;

        const icon = document.createElement("span");
        icon.className = "assignment-client-option-icon";
        icon.innerHTML = '<i class="bi bi-building"></i>';

        const text = document.createElement("span");
        text.className = "assignment-client-option-name";
        text.textContent = nombre;

        button.append(icon, text);

        button.addEventListener("click", function () {
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

        clientes.forEach(function (cliente) {
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

btnCambiarCliente?.addEventListener("click", function () {
    const isOpen =
        btnCambiarCliente.getAttribute("aria-expanded") === "true";

    mostrarSelectorClientes(!isOpen);
});

clienteAsignacionesSelect?.addEventListener(
    "change",
    function () {
        actualizarClienteSeleccionado();
        actualizarOpcionesSeleccionadas();

        aplicarFiltroClienteAsignaciones(this.value);
    }
);


/* =========================================
   SESIÓN DEL TÉCNICO
   ========================================= */

async function comprobarSesionTecnico() {
    try {
        const response = await apiFetch(`${API_URL}/auth/me`);

        if (!response.ok) {
            window.location.href = "../index.html";
            return false;
        }

        const usuario = await response.json();

        if (usuario.rol?.toLowerCase() !== "tecnico") {
            if (usuario.rol?.toLowerCase() === "administrador") {
                window.location.href = "../administrador/dashboard.html";
            } else {
                window.location.href = "../index.html";
            }

            return false;
        }

        const nombre = obtenerNombreCompleto(usuario);
        const iniciales = obtenerIniciales(nombre);

        document.getElementById("sidebarUserName").textContent =
            nombre || "Técnico";

        document.getElementById("sidebarUserEmail").textContent =
            usuario.correo || "";

        document.getElementById("sidebarUserAvatar").textContent =
            iniciales;

        document.getElementById("topbarUserName").textContent =
            nombre || "Técnico";

        document.getElementById("topbarUserAvatar").textContent =
            iniciales;

        return true;

    } catch (error) {
        console.error("No se pudo comprobar la sesión:", error);

        mostrarNotificacion(
            "No se pudo comprobar la sesión del usuario.",
            "error"
        );

        return false;
    }
}


/* =========================================
   CARGAR ASIGNACIONES
   ========================================= */

async function cargarAsignaciones() {
    assignmentTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Cargando tus asignaciones...
            </td>
        </tr>
    `;

    try {
        const response = await apiFetch(
            `${API_URL}/asignaciones/tecnico/mis-asignaciones`
        );

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = "../index.html";
                return;
            }

            throw new Error(
                `No se pudieron consultar las asignaciones (HTTP ${response.status}).`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "El servidor no devolvió una lista de asignaciones."
            );
        }

        asignacionesData = data;

        actualizarResumenAsignaciones();
        renderizarAsignaciones();

    } catch (error) {
        console.error("Error al cargar asignaciones:", error);

        assignmentTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    No se pudieron cargar tus asignaciones.
                    Intenta actualizar la página.
                </td>
            </tr>
        `;

        document.getElementById("totalResultados").textContent =
            "No se pudieron consultar las asignaciones";

        document.getElementById("contadorAsignaciones").textContent =
            "Error al cargar los registros";
    }
}


/* =========================================
   RESUMEN
   ========================================= */

function actualizarResumenAsignaciones() {
    const total = asignacionesData.length;

    const enProceso = asignacionesData.filter(assignment => [
        "en_proceso",
        "en_documentacion",
        "en_revision"
    ].includes(assignment.estado)).length;

    const pendientes = asignacionesData.filter(assignment => [
        "pendiente",
        "pendiente_documentacion"
    ].includes(assignment.estado)).length;

    const completadas = asignacionesData.filter(
        assignment => assignment.estado === "completado"
    ).length;

    document.getElementById("totalAsignaciones").textContent = total;
    document.getElementById("asignacionesEnProceso").textContent = enProceso;
    document.getElementById("asignacionesPendientes").textContent = pendientes;
    document.getElementById("asignacionesCompletadas").textContent = completadas;
}


/* =========================================
   FILTROS
   ========================================= */

function obtenerAsignacionesFiltradas() {
    const busqueda = normalizarTexto(searchInput.value);

    return asignacionesData.filter(assignment => {
        const texto = normalizarTexto([
            assignment.proyecto_nombre,
            assignment.site_nombre,
            assignment.subproyecto_nombre,
            assignment.tipo_documento_nombre,
            `ASG-${String(assignment.id).padStart(4, "0")}`
        ].join(" "));

        const coincideBusqueda =
            !busqueda || texto.includes(busqueda);

        let coincideVista = true;

        if (vistaAsignacionesActual === "activas") {
            coincideVista = esAsignacionActiva(assignment.estado);
        } else if (vistaAsignacionesActual === "observadas") {
            coincideVista = assignment.estado === "observado";
        } else if (vistaAsignacionesActual === "completadas") {
            coincideVista = assignment.estado === "completado";
        }

        const coincideCliente =
            clienteSeleccionado !== "" &&
            normalizarTexto(assignment.cliente_nombre) ===
            normalizarTexto(clienteSeleccionado);

        return coincideCliente && coincideBusqueda && coincideVista;
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


searchInput.addEventListener("input", function () {
    paginaActualAsignaciones = 1;
    renderizarAsignaciones();
});


/* =========================================
   RENDERIZAR TABLA
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
                <td colspan="7" class="text-center py-4">
                    No se encontraron asignaciones para esta vista.
                </td>
            </tr>
        `;

        actualizarPaginacion(0);
        actualizarContador(0);
        return;
    }

    assignmentTableBody.innerHTML = registrosPagina.map(assignment => {
        const id = assignment.id;

        const proyecto =
            assignment.proyecto_nombre || `Proyecto ${assignment.proyecto_id}`;

        const site =
            assignment.site_nombre || `Site ${assignment.site_id}`;

        const subproyecto =
            assignment.subproyecto_nombre ||
            `Subproyecto ${assignment.subproyecto_id}`;

        const documento =
            assignment.tipo_documento_nombre ||
            `Documento ${assignment.tipo_documento_id}`;

        const codigo = `ASG-${String(id).padStart(4, "0")}`;

        return `
            <tr>
                <td>
                    <span class="assignment-name">
                        ${escapeHTML(proyecto)}
                    </span>

                    <span class="assignment-code">
                        ${codigo}
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
                    <strong>${escapeHTML(
                        fechaLabel(assignment.fecha_limite)
                    )}</strong>
                </td>

                <td>
                    <span class="assignment-status ${estadoClass(
                        assignment.estado
                    )}">
                        ${escapeHTML(estadoLabel(assignment.estado))}
                    </span>
                </td>

                <td>
                    <a
                        href="detalle-asignacion.html?id=${encodeURIComponent(id)}"
                        class="technician-checklist-button"
                        title="Ver detalles de la asignación"
                    >
                        <i class="bi bi-eye"></i>
                        Ver detalles
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

        boton.addEventListener("click", function () {
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
   SIDEBAR RESPONSIVE
   ========================================= */

const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

mobileMenuButton.addEventListener("click", function () {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
});

sidebarOverlay.addEventListener("click", function () {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
});


/* =========================================
   INICIALIZACIÓN
   ========================================= */

async function inicializarPanelTecnico() {
    const sesionValida = await comprobarSesionTecnico();

    if (!sesionValida) return;

    await cargarAsignaciones();
    cargarClientesAsignaciones();
}

inicializarPanelTecnico();