
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
let itemsChecklistData = [];

const urlsEvidenciaCache = new Map();


/* =========================================
   ELEMENTOS
   ========================================= */

const checklistContainer = document.getElementById("checklistItems");
const checklistContent = document.getElementById("checklistContent");
const checklistEmpty = document.getElementById("checklistEmptyState");


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

    const fechaLocal = new Date(fecha);

    if (Number.isNaN(fechaLocal.getTime())) {
        return String(fecha);
    }

    return fechaLocal.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function normalizarEstado(estado) {
    return String(estado ?? "").trim().toLowerCase();
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


function obtenerEvidenciasItem(itemId) {
    return evidenciasData.filter(
        evidencia =>
            Number(evidencia.item_checklist_id) === Number(itemId)
    );
}


function obtenerEstadoRequisito(evidencias) {
    if (!evidencias.length) {
        return "pending";
    }

    if (evidencias.some(evidencia =>
        ["observada", "observado"].includes(
            normalizarEstado(evidencia.estado)
        )
    )) {
        return "observed";
    }

    return "completed";
}


function obtenerDatosEstado(estado) {
    const estados = {
        completed: {
            texto: "Completado",
            clase: "completed"
        },
        pending: {
            texto: "Pendiente",
            clase: "pending"
        },
        observed: {
            texto: "Observado",
            clase: "observed"
        }
    };

    return estados[estado] ?? estados.pending;
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
        }).filter(Boolean)
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
   PROGRESO DEL CHECKLIST
   ========================================= */

function actualizarProgresoChecklist() {
    const total = itemsChecklistData.length;

    let completados = 0;
    let pendientes = 0;
    let observados = 0;

    itemsChecklistData.forEach(item => {
        const evidencias = obtenerEvidenciasItem(item.id);
        const estado = obtenerEstadoRequisito(evidencias);

        if (estado === "completed") completados++;
        if (estado === "pending") pendientes++;
        if (estado === "observed") observados++;
    });

    const progreso = total > 0
        ? Math.round((completados + observados) / total * 100)
        : 0;

    mostrarTexto(
        "checklistProgressPercentage",
        `${progreso}%`
    );

    mostrarTexto(
        "checklistCompletedCount",
        `${completados + observados} de ${total} ${
            total === 1 ? "ítem con evidencia" : "ítems con evidencia"
        }`
    );

    mostrarTexto(
        "checklistPendingCount",
        `${pendientes} pendientes · ${observados} observados`
    );

    const barra = document.getElementById("checklistProgressBar");
    const contenedorBarra = document.getElementById(
        "checklistProgressBarContainer"
    );

    if (barra) {
        barra.style.width = `${progreso}%`;
    }

    if (contenedorBarra) {
        contenedorBarra.setAttribute("aria-valuenow", progreso);
    }
}


function actualizarEstadoItem(itemId) {
    const elemento = document.getElementById(`estado-item-${itemId}`);

    if (!elemento) return;

    const evidencias = obtenerEvidenciasItem(itemId);
    const estado = obtenerEstadoRequisito(evidencias);
    const datosEstado = obtenerDatosEstado(estado);

    elemento.className = `technician-item-status ${datosEstado.clase}`;
    elemento.textContent = datosEstado.texto;
}


/* =========================================
   CONSULTAR URL DE FOTOGRAFÍA
   ========================================= */

async function obtenerUrlEvidencia(evidencia) {
    if (urlsEvidenciaCache.has(Number(evidencia.id))) {
        return urlsEvidenciaCache.get(Number(evidencia.id));
    }

    const respuesta = await apiFetch(
        `${API_URL}/evidencias/${evidencia.id}/url`
    );

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(
            datos.detail || "No se pudo obtener la fotografía."
        );
    }

    if (!datos.url) {
        throw new Error("El servidor no devolvió la URL de la fotografía.");
    }

    urlsEvidenciaCache.set(Number(evidencia.id), datos.url);

    return datos.url;
}


/* =========================================
   RENDERIZAR GALERÍA DE FOTOGRAFÍAS
   ========================================= */

async function renderizarEvidenciasItem(itemId) {
    const lista = document.getElementById(`evidencias-item-${itemId}`);

    if (!lista) return;

    lista.replaceChildren();

    const evidencias = obtenerEvidenciasItem(itemId);

    if (!evidencias.length) {
        const mensaje = document.createElement("p");

        mensaje.className = "technician-evidence-empty";
        mensaje.textContent =
            "Todavía no se han cargado fotografías para este ítem.";

        lista.appendChild(mensaje);
        return;
    }

    const galeria = document.createElement("div");
    galeria.className = "technician-evidence-gallery";

    const vistas = await Promise.all(
        evidencias.map(async evidencia => {
            try {
                return {
                    evidencia,
                    url: await obtenerUrlEvidencia(evidencia)
                };
            } catch (error) {
                console.error(
                    `No se pudo consultar la fotografía ${evidencia.id}:`,
                    error
                );

                return {
                    evidencia,
                    url: null
                };
            }
        })
    );

    vistas.forEach(({ evidencia, url }) => {
        const contenedor = document.createElement("div");
        contenedor.className = "technician-evidence-preview";

        if (url) {
            const enlace = document.createElement("a");

            enlace.className = "technician-evidence-image-link";
            enlace.href = url;
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";
            enlace.title = "Ver fotografía en tamaño completo";

            const imagen = document.createElement("img");

            imagen.src = url;
            imagen.alt = evidencia.nombre_archivo || "Fotografía de evidencia";
            imagen.loading = "lazy";

            enlace.appendChild(imagen);
            contenedor.appendChild(enlace);

        } else {
            const sinVista = document.createElement("div");
            sinVista.className = "technician-evidence-no-preview";

            const icono = document.createElement("i");
            icono.className = "bi bi-image";

            const texto = document.createElement("span");
            texto.textContent = "Vista previa no disponible";

            sinVista.append(icono, texto);
            contenedor.appendChild(sinVista);
        }

        galeria.appendChild(contenedor);
    });

    lista.appendChild(galeria);
}


/* =========================================
   RENDERIZAR CHECKLIST
   ========================================= */

function renderizarChecklist(items) {
    checklistContainer.replaceChildren();

    itemsChecklistData = [...items].sort(
        (a, b) => Number(a.orden || 0) - Number(b.orden || 0)
    );

    if (!itemsChecklistData.length) {
        checklistContainer.innerHTML = `
            <div class="checklist-template-empty">
                El checklist publicado no contiene ítems.
            </div>
        `;

        actualizarProgresoChecklist();
        return;
    }

    const grupos = new Map();

    itemsChecklistData.forEach(item => {
        const requisitoId =
            item.requisito_fotografico_id ??
            item.requisito_nombre ??
            "otros";

        if (!grupos.has(requisitoId)) {
            grupos.set(requisitoId, []);
        }

        grupos.get(requisitoId).push(item);
    });

    grupos.forEach((itemsGrupo, requisitoId) => {
        const primerItem = itemsGrupo[0];

        const grupo = document.createElement("section");
        grupo.className = "generated-checklist-group";

        const encabezado = document.createElement("div");
        encabezado.className = "generated-checklist-group-header";

        const informacion = document.createElement("div");
        informacion.className = "generated-checklist-group-info";

        const titulo = document.createElement("h3");
        titulo.textContent =
            primerItem.requisito_nombre ||
            `Requerimiento ${requisitoId}`;

        const descripcion = document.createElement("p");
        descripcion.textContent =
            primerItem.requisito_descripcion || "";

        informacion.appendChild(titulo);

        if (descripcion.textContent) {
            informacion.appendChild(descripcion);
        }

        encabezado.appendChild(informacion);

        const lista = document.createElement("div");
        lista.className = "generated-checklist-items";

        itemsGrupo
            .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
            .forEach(item => {
                const itemId = Number(item.id);

                const fila = document.createElement("div");
                fila.className =
                    "generated-checklist-item technician-checklist-item";

                // Información del ítem
                const contenido = document.createElement("div");
                contenido.className = "generated-checklist-item-content";

                const nombre = document.createElement("strong");
                nombre.textContent = item.titulo || "Ítem sin título";

                const detalle = document.createElement("p");
                detalle.textContent = item.descripcion || "Sin descripción";

                contenido.append(nombre, detalle);

                if (item.obligatorio) {
                    const obligatorio = document.createElement("span");

                    obligatorio.className =
                        "generated-checklist-item-required";

                    obligatorio.textContent = "Evidencia obligatoria";

                    contenido.appendChild(obligatorio);
                }

                // Acciones y estado
                const acciones = document.createElement("div");

                acciones.className =
                    "generated-checklist-item-actions technician-evidence-actions";

                const estado = document.createElement("span");
                estado.id = `estado-item-${itemId}`;

                const datosEstado = obtenerDatosEstado(
                    obtenerEstadoRequisito(obtenerEvidenciasItem(itemId))
                );

                estado.className =
                    `technician-item-status ${datosEstado.clase}`;

                estado.textContent = datosEstado.texto;

                acciones.appendChild(estado);

                // Botón consultar evidencias
                const botonConsultar = document.createElement("button");

                botonConsultar.type = "button";
                botonConsultar.className =
                    "checklist-item-action technician-evidence-action";

                botonConsultar.title = "Consultar evidencias";
                botonConsultar.setAttribute(
                    "aria-label",
                    "Consultar evidencias"
                );

                botonConsultar.setAttribute("aria-expanded", "false");
                botonConsultar.setAttribute(
                    "aria-controls",
                    `evidencias-item-${itemId}`
                );

                botonConsultar.dataset.itemId = itemId;

                const iconoConsultar = document.createElement("i");
                iconoConsultar.className = "bi bi-eye";

                botonConsultar.appendChild(iconoConsultar);

                acciones.appendChild(botonConsultar);

                fila.append(contenido, acciones);

                // Lista desplegable de fotografías
                const listaEvidencias = document.createElement("div");

                listaEvidencias.id = `evidencias-item-${itemId}`;
                listaEvidencias.className = "technician-evidence-list";
                listaEvidencias.hidden = true;

                const contenedorItem = document.createElement("div");
                contenedorItem.className =
                    "technician-checklist-item-wrapper";

                contenedorItem.append(fila, listaEvidencias);
                lista.appendChild(contenedorItem);
            });

        grupo.append(encabezado, lista);
        checklistContainer.appendChild(grupo);
    });

    checklistContainer.setAttribute("aria-busy", "false");

    actualizarProgresoChecklist();
}


/* =========================================
   EVENTO DEL BOTÓN OJITO
   ========================================= */

checklistContainer.addEventListener("click", async function (event) {
    const boton = event.target.closest(
        "button[data-item-id]"
    );

    if (!boton) return;

    const itemId = Number(boton.dataset.itemId);

    const lista = document.getElementById(
        `evidencias-item-${itemId}`
    );

    if (!lista) return;

    const mostrar = lista.hidden;

    lista.hidden = !mostrar;

    boton.setAttribute("aria-expanded", String(mostrar));

    const icono = boton.querySelector("i");

    if (icono) {
        icono.className = mostrar
            ? "bi bi-eye-slash"
            : "bi bi-eye";
    }

    if (mostrar) {
        await renderizarEvidenciasItem(itemId);
    }
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

        const assignmentDataResponse =
            await assignmentResponse.json().catch(() => ({}));

        if (!assignmentResponse.ok) {
            throw new Error(
                assignmentDataResponse.detail ||
                "No se pudo consultar la asignación."
            );
        }

        if (!evidenceResponse.ok) {
            const error = await evidenceResponse.json().catch(() => ({}));

            throw new Error(
                error.detail || "No se pudieron consultar las evidencias."
            );
        }

        asignacionData = assignmentDataResponse;

        const evidencias = await evidenceResponse.json();

        evidenciasData = Array.isArray(evidencias)
            ? evidencias
            : [];

        renderizarAsignacion(asignacionData);

        if (!checklistResponse.ok) {
            checklistContent.hidden = true;
            checklistEmpty.hidden = false;

            mostrarTexto(
                "generatedChecklistStatus",
                "Sin checklist publicado"
            );

            return;
        }

        const checklist = await checklistResponse.json();

        if (
            !checklist ||
            String(checklist.estado).toLowerCase() !== "publicado"
        ) {
            checklistContent.hidden = true;
            checklistEmpty.hidden = false;

            mostrarTexto(
                "generatedChecklistStatus",
                "Sin checklist publicado"
            );

            return;
        }

        renderizarChecklist(checklist.items || []);

        checklistEmpty.hidden = false;
        checklistContent.hidden = false;

        checklistEmpty.hidden = true;

        mostrarTexto("generatedChecklistStatus", "Publicado");

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
