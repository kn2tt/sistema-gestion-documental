
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


async function confirmarEliminacionFotografia() {
    let modalElement = document.getElementById(
        "confirmacionEliminarFotografiaModal"
    );

    if (!modalElement) {
        const contenedor = document.createElement("div");

        contenedor.innerHTML = `
            <div
                class="modal fade"
                id="confirmacionEliminarFotografiaModal"
                tabindex="-1"
                aria-labelledby="confirmacionEliminarFotografiaTitulo"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5
                                class="modal-title"
                                id="confirmacionEliminarFotografiaTitulo"
                            >
                                Eliminar fotografía
                            </h5>
                            <button
                                type="button"
                                class="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Cerrar"
                            ></button>
                        </div>
                        <div class="modal-body">
                            ¿Deseas eliminar esta fotografía? El técnico tendrá que volver a cargarla.
                        </div>
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-light"
                                data-bs-dismiss="modal"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                class="btn btn-danger"
                                id="confirmarEliminarFotografiaBtn"
                            >
                                <i class="bi bi-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(contenedor.firstElementChild);

        modalElement = document.getElementById(
            "confirmacionEliminarFotografiaModal"
        );
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const botonConfirmar = document.getElementById(
        "confirmarEliminarFotografiaBtn"
    );

    return new Promise(resolve => {
        let finalizado = false;

        function finalizar(resultado) {
            if (finalizado) return;

            finalizado = true;
            modalElement.removeEventListener("hidden.bs.modal", alCerrar);
            botonConfirmar.removeEventListener("click", alConfirmar);
            resolve(resultado);
        }

        function alCerrar() {
            finalizar(false);
        }

        function alConfirmar() {
            finalizar(true);
            modal.hide();
        }

        modalElement.addEventListener("hidden.bs.modal", alCerrar);
        botonConfirmar.addEventListener("click", alConfirmar);

        modal.show();
    });
}

/* =========================================
   EXPORTAR Y ARCHIVAR EVIDENCIAS
   ========================================= */

function actualizarBotonExportacion() {
    const boton = document.getElementById(
        "btnDescargarEvidencias"
    );

    if (!boton) return;

    const pendientes = evidenciasData.filter(
        evidencia =>
            evidencia.estado_almacenamiento === "pendiente"
    ).length;

    const exportadas = evidenciasData.filter(
        evidencia =>
            evidencia.estado_almacenamiento === "exportada"
    ).length;

    const disponibles = pendientes + exportadas;

    boton.disabled = disponibles === 0;

    boton.innerHTML = exportadas > 0
        ? `
            <i class="bi bi-arrow-repeat"></i>
            Volver a descargar ZIP pendiente
        `
        : `
            <i class="bi bi-file-earmark-zip"></i>
            Descargar evidencias nuevas
        `;
}


async function descargarZipEvidencias() {
    const boton = document.getElementById(
        "btnDescargarEvidencias"
    );

    if (!boton) return;

    // Evita varios clics mientras se genera el ZIP.
    boton.disabled = true;
    boton.setAttribute("aria-busy", "true");

    boton.innerHTML = `
        <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
        ></span>
        Generando ZIP...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/asignacion/${assignmentId}/exportar`,
            {
                method: "POST"
            }
        );

        if (!respuesta.ok) {
            const datos = await respuesta.json().catch(() => ({}));

            throw new Error(
                datos.detail ||
                "No se pudo generar el archivo ZIP."
            );
        }

        const archivo = await respuesta.blob();

        if (!archivo.size) {
            throw new Error(
                "El archivo ZIP generado está vacío."
            );
        }

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download =
            `evidencias_asignacion_${assignmentId}.zip`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        await cargarDetalleEvidencias();

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById("modalArchivarEvidencias")
            )
            .show();

    } catch (error) {
        mostrarNotificacion(error.message, "error");

    } finally {
        boton.setAttribute("aria-busy", "false");
        actualizarBotonExportacion();
    }
}


async function confirmarArchivadoEvidencias() {
    const boton = document.getElementById(
        "btnConfirmarArchivado"
    );

    const campoEnlace = document.getElementById(
        "enlaceDriveEvidencias"
    );

    const enlace = campoEnlace.value.trim();

    if (!enlace) {
        mostrarNotificacion(
            "Ingresa el enlace de Google Drive.",
            "warning"
        );
        campoEnlace.focus();
        return;
    }

    const contenidoOriginal = boton.innerHTML;
    const estadoDeshabilitadoOriginal = boton.disabled;

    boton.disabled = true;
    boton.setAttribute("aria-busy", "true");

    boton.innerHTML = `
        <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
        ></span>
        Archivando en Google Drive...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/asignacion/${assignmentId}/archivar`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    drive_web_view_link: enlace
                })
            }
        );

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(
                datos.detail ||
                "No se pudo confirmar el archivado."
            );
        }

        await cargarDetalleEvidencias();

        if (datos.fallidas > 0) {
            mostrarNotificacion(
                `Se archivaron ${datos.archivadas} fotografías, pero ${datos.fallidas} no pudieron eliminarse de Backblaze. Puedes volver a confirmar el archivado para reintentar.`,
                "warning"
            );
        } else {
            mostrarNotificacion(
                `Se archivaron correctamente ${datos.archivadas} fotografías.`,
                "success"
            );

            bootstrap.Modal
                .getOrCreateInstance(
                    document.getElementById("modalArchivarEvidencias")
                )
                .hide();

            campoEnlace.value = "";
        }

    } catch (error) {
        mostrarNotificacion(error.message, "error");

    } finally {
        boton.innerHTML = contenidoOriginal;
        boton.disabled = estadoDeshabilitadoOriginal;
        boton.removeAttribute("aria-busy");
    }
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
    return evidencias.length ? "completed" : "pending";
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

    const listaTecnicos = document.getElementById("infoTecnicos");

    if (listaTecnicos) {
        if (tecnicos.length === 0) {
            listaTecnicos.innerHTML = `
                <span class="scope-empty">
                    No hay técnicos asociados
                </span>
            `;
        } else {
            listaTecnicos.innerHTML = tecnicos.map((nombre, indice) => `
                <div class="scope-item">
                    <span class="scope-number">${indice + 1}</span>

                    <div class="scope-text">
                        <strong>${escaparHTML(nombre)}</strong>
                    </div>
                </div>
            `).join("");
        }
    }

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

    itemsChecklistData.forEach(item => {
        const evidencias = obtenerEvidenciasItem(item.id);
        const estado = obtenerEstadoRequisito(evidencias);

        if (estado === "completed") completados++;
        if (estado === "pending") pendientes++;
    });

    const progreso = total > 0
        ? Math.round(completados / total * 100)
        : 0;

    // Mini dashboard
    mostrarTexto("totalRequisitos", total);
    mostrarTexto("totalPendientes", pendientes);
    mostrarTexto("totalCompletados", completados);

    // Barra de progreso
    mostrarTexto("checklistProgressPercentage", `${progreso}%`);

    mostrarTexto(
        "checklistCompletedCount",
        `${completados} de ${total} ${
            total === 1 ? "ítem con evidencia" : "ítems con evidencia"
        }`
    );

    mostrarTexto(
        "checklistPendingCount",
        `${pendientes} pendientes`
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


async function eliminarFotografiaAdmin(
    evidenciaId,
    itemId,
    boton
) {
    const confirmar = await confirmarEliminacionFotografia();

    if (!confirmar) return;

    const contenidoOriginal = boton.innerHTML;
    const estadoDeshabilitadoOriginal = boton.disabled;

    boton.disabled = true;
    boton.setAttribute("aria-busy", "true");

    boton.innerHTML = `
        <span
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
        ></span>
        Eliminando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/${evidenciaId}`,
            {
                method: "DELETE"
            }
        );

        if (!respuesta.ok) {
            const datos = await respuesta.json().catch(() => ({}));

            throw new Error(
                datos.detail || "No se pudo eliminar la fotografía."
            );
        }

        evidenciasData = evidenciasData.filter(
            evidencia => Number(evidencia.id) !== Number(evidenciaId)
        );

        urlsEvidenciaCache.delete(Number(evidenciaId));

        actualizarProgresoChecklist();

        await renderizarEvidenciasItem(itemId);

        mostrarNotificacion(
            "La fotografía se eliminó correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al eliminar fotografía:", error);
        mostrarNotificacion(error.message, "error");

    } finally {
        boton.innerHTML = contenidoOriginal;
        boton.disabled = estadoDeshabilitadoOriginal;
        boton.removeAttribute("aria-busy");
    }
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

        if (evidencia.estado_almacenamiento === "archivada") {

            const archivada = document.createElement("div");

            archivada.className = "technician-evidence-no-preview";

            const icono = document.createElement("i");
            icono.className = "bi bi-cloud-check";

            const texto = document.createElement("span");
            texto.textContent = "Archivada en Google Drive";

            archivada.append(icono, texto);
            contenedor.appendChild(archivada);

        } else if (url) {

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

        if (evidencia.estado_almacenamiento === "pendiente") {

            const botonEliminar = document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.className = "admin-evidence-delete";
            botonEliminar.innerHTML = `
                <i class="bi bi-trash"></i>
                Eliminar fotografía
            `;

            botonEliminar.dataset.evidenceId = evidencia.id;
            botonEliminar.dataset.itemId = itemId;

            contenedor.appendChild(botonEliminar);
        }
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

    const botonEliminar = event.target.closest(
        "button[data-evidence-id]"
    );

    if (botonEliminar) {
        await eliminarFotografiaAdmin(
            Number(botonEliminar.dataset.evidenceId),
            Number(botonEliminar.dataset.itemId),
            botonEliminar
        );

        return;
    }

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

        actualizarBotonExportacion();

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

    document.getElementById(
        "btnDescargarEvidencias"
    )?.addEventListener("click", descargarZipEvidencias);

    document.getElementById(
        "btnConfirmarArchivado"
    )?.addEventListener("click", confirmarArchivadoEvidencias);

    cargarDetalleEvidencias();
});
