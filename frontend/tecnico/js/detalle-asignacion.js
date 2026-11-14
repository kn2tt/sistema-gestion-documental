/* =========================================
   CONFIGURACIÓN
   ========================================= */

const API_URL = "http://127.0.0.1:8000";

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");

let edicionEvidenciasHabilitada = false;
let enviandoChecklist = false;


/* =========================================
   API
   ========================================= */

function apiFetch(url, opciones = {}) {
    return fetch(url, {
        ...opciones,
        credentials: "include"
    });
}


function actualizarEstadoEdicionEvidencias() {
    const botonEnviar = document.getElementById(
        "btnEnviarChecklist"
    );

    const estado = document.getElementById(
        "checklistEditingStatus"
    );

    const mensaje = document.getElementById(
        "checklistEditingMessage"
    );

    if (botonEnviar) {
        botonEnviar.hidden = !edicionEvidenciasHabilitada;
        botonEnviar.disabled = enviandoChecklist;
    }

    if (estado) {
        estado.textContent = edicionEvidenciasHabilitada
            ? "Edición habilitada"
            : "Edición deshabilitada";
    }

    if (mensaje) {
        mensaje.textContent = edicionEvidenciasHabilitada
            ? "Cuando termines de registrar las evidencias, envía el checklist."
            : "El checklist fue enviado. Puedes consultar las fotografías, pero no modificarlas.";
    }

    document.querySelectorAll(
        ".technician-evidence-upload"
    ).forEach(boton => {
        boton.disabled = !edicionEvidenciasHabilitada;
    });
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

function finalizarSkeletonDetalle() {
    const selectores = [
        ".page-header .skeleton-line-text",
        ".info-grid .skeleton-line-text",
        ".date-list .skeleton-line-text",
        "#alcanceAsignacion .skeleton-block",
        "#tecnicosAsignacion .skeleton-circle",
        "#tecnicosAsignacion .skeleton-block"
    ];

    document.querySelectorAll(selectores.join(",")).forEach(elemento => {
        elemento.classList.remove(
            "skeleton-line-text",
            "skeleton-block",
            "skeleton-circle"
        );
    });

    document.querySelectorAll(".detail-skeleton-person").forEach(elemento => {
        elemento.remove();
    });
}

function finalizarSkeletonChecklist() {
    const skeleton = document.getElementById("checklistSkeleton");

    if (skeleton) {
        skeleton.hidden = true;
        skeleton.setAttribute("aria-busy", "false");
    }

    document.querySelectorAll(
        "#checklistPanel .skeleton-line-text"
    ).forEach(elemento => {
        elemento.classList.remove("skeleton-line-text");
    });
}

function obtenerIniciales(nombre, apellido = "") {
    return `${nombre || ""} ${apellido || ""}`
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(palabra => palabra.charAt(0).toUpperCase())
        .join("") || "T";
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
   ESTADOS
   ========================================= */

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

function actualizarEstado(estado) {
    const badge = document.getElementById("estadoAsignacion");

    const configuracion = estadosAsignacion[estado] || {
        texto: estado || "Sin estado",
        clase: "status-pending"
    };

    if (badge) {
        badge.className = `status-badge ${configuracion.clase}`;
        badge.replaceChildren();

        const indicador = document.createElement("span");

        badge.append(
            indicador,
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

        marcador.innerHTML = `<i class="bi ${icono}"></i>`;
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
        `Detalle de la asignación #ASG-${String(asignacion.id).padStart(4, "0")}`
    );

    document.title =
        `ASG-${String(asignacion.id).padStart(4, "0")} | Gestión Documental`;

    actualizarEstado(asignacion.estado);
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

    if (!contenedor) return;

    if (alcances.length === 0) {
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

    if (!contenedor) return;

    const tecnicos = Array.isArray(asignacion.tecnicos)
        ? asignacion.tecnicos
        : [];

    if (tecnicos.length === 0) {
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
                    ${escaparHTML(obtenerIniciales(tecnico.nombre, tecnico.apellido))}
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

    if (!elementoDias) return;

    if (!asignacion.fecha_limite) {
        elementoDias.textContent = "Sin fecha límite";
        return;
    }

    const fechaLimite = new Date(
        `${String(asignacion.fecha_limite).substring(0, 10)}T00:00:00`
    );

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diferencia = Math.ceil(
        (fechaLimite - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diferencia < 0) {
        elementoDias.textContent = `Vencida hace ${Math.abs(diferencia)} días`;
    } else if (diferencia === 0) {
        elementoDias.textContent = "Vence hoy";
    } else {
        elementoDias.textContent = `${diferencia} días`;
    }
}


/* =========================================
   CARGAR CHECKLIST PUBLICADO
   ========================================= */

async function cargarChecklistPublicado() {
    const contenedor = document.getElementById("checklistItems");
    const contenido = document.getElementById("checklistContent");
    const vacio = document.getElementById("checklistEmptyState");
    const estado = document.getElementById("generatedChecklistStatus");

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/tecnico/${encodeURIComponent(assignmentId)}/checklist`
        );

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = "../index.html";
            return;
        }

        if (respuesta.status === 404) {
            contenido.hidden = true;
            vacio.hidden = false;
            return;
        }

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            const detalle = datos.detail || datos.message || "Sin detalle del servidor";

            throw new Error(
                `No se pudo consultar el checklist (HTTP ${respuesta.status}): ${detalle}`
            );
        }

        const checklist = datos;

        if (String(checklist.estado).toLowerCase() !== "publicado") {
            contenido.hidden = true;
            vacio.hidden = false;
            return;
        }

        if (estado) {
            estado.textContent = "Publicado";
            estado.classList.add("is-published");
        }

        renderizarChecklist(checklist.items || []);

        vacio.hidden = true;
        contenido.hidden = false;

    } catch (error) {
        console.error("Error al cargar el checklist:", error);

        mostrarNotificacion(
            error.message || "No se pudo cargar el checklist.",
            "error"
        );
    } finally {
        finalizarSkeletonChecklist();
    }
}


/* =========================================
   EVIDENCIAS DEL CHECKLIST
   ========================================= */

const evidenciasPorItem = new Map();
let totalItemsChecklist = 0;

function actualizarProgresoChecklist() {
    const porcentaje = document.getElementById(
        "checklistProgressPercentage"
    );

    const barra = document.getElementById(
        "checklistProgressBar"
    );

    const contenedorBarra = document.getElementById(
        "checklistProgressBarContainer"
    );

    const completadosElemento = document.getElementById(
        "checklistCompletedCount"
    );

    const pendientesElemento = document.getElementById(
        "checklistPendingCount"
    );

    if (
        !porcentaje ||
        !barra ||
        !contenedorBarra ||
        !completadosElemento ||
        !pendientesElemento
    ) {
        return;
    }

    const completados = Array.from(
        evidenciasPorItem.values()
    ).filter(evidencias => evidencias.length > 0).length;

    const pendientes = Math.max(
        totalItemsChecklist - completados,
        0
    );

    const progreso = totalItemsChecklist > 0
        ? Math.round((completados / totalItemsChecklist) * 100)
        : 0;

    porcentaje.textContent = `${progreso}%`;

    barra.style.width = `${progreso}%`;

    contenedorBarra.setAttribute(
        "aria-valuenow",
        progreso
    );

    completadosElemento.textContent =
        `${completados} de ${totalItemsChecklist} ${
            totalItemsChecklist === 1 ? "ítem completado" : "ítems completados"
        }`;

    pendientesElemento.textContent =
        `${pendientes} ${
            pendientes === 1 ? "pendiente" : "pendientes"
        }`;
}

function actualizarEstadoItem(itemId, evidencias, error = false) {
    const estado = document.getElementById(`estado-item-${itemId}`);

    if (!estado) return;

    if (error) {
        estado.className = "technician-item-status unavailable";
        estado.textContent = "No disponible";
        return;
    }

    const completado = evidencias.length > 0;

    estado.className = `technician-item-status ${
        completado ? "completed" : "pending"
    }`;

    estado.textContent = completado ? "Completado" : "Pendiente";
}

async function cargarEvidenciasItem(itemId) {
    const lista = document.getElementById(`evidencias-item-${itemId}`);

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/tecnico/asignaciones/${assignmentId}/items/${itemId}`
        );

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = "../index.html";
            return null;
        }

        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(
                datos.detail || `Error HTTP ${respuesta.status}`
            );
        }

        if (!Array.isArray(datos)) {
            throw new Error("El servidor no devolvió una lista de evidencias válida.");
        }

        evidenciasPorItem.set(Number(itemId), datos);

        actualizarEstadoItem(itemId, datos);
        renderizarEvidenciasItem(itemId, datos);
        actualizarProgresoChecklist();

        return datos;

    } catch (error) {
        console.error(`Error al consultar evidencias del ítem ${itemId}:`, error);

        actualizarEstadoItem(itemId, [], true);

        evidenciasPorItem.set(Number(itemId), []);
        actualizarProgresoChecklist();

        if (lista) {
            lista.replaceChildren();

            const mensaje = document.createElement("p");
            mensaje.className = "technician-evidence-empty";
            mensaje.textContent = "No se pudieron consultar las fotografías.";

            lista.appendChild(mensaje);
        }

        return null;
    }
}


function renderizarEvidenciasItem(itemId, evidencias) {
    const lista = document.getElementById(`evidencias-item-${itemId}`);

    if (!lista) return;

    lista.replaceChildren();

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

    evidencias.forEach(evidencia => {
        const contenedor = document.createElement("div");
        contenedor.className = "technician-evidence-preview";

        if (evidencia.archivo_url) {
            const enlace = document.createElement("a");
            enlace.className = "technician-evidence-image-link";
            enlace.href = evidencia.archivo_url;
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";
            enlace.title = "Ver fotografía en tamaño completo";

            const imagen = document.createElement("img");
            imagen.src = evidencia.archivo_url;
            imagen.alt = "Fotografía de evidencia";
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

        if (
            edicionEvidenciasHabilitada &&
            evidencia.estado_almacenamiento === "pendiente"
        ) {
            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "technician-evidence-preview-delete";
            botonEliminar.title = "Eliminar fotografía";
            botonEliminar.setAttribute(
                "aria-label",
                "Eliminar fotografía"
            );

            const iconoEliminar = document.createElement("i");
            iconoEliminar.className = "bi bi-trash3";

            botonEliminar.appendChild(iconoEliminar);

            botonEliminar.addEventListener("click", () => {
                solicitarEliminarEvidencia(itemId, evidencia.id);
            });

            contenedor.appendChild(botonEliminar);
        }

        galeria.appendChild(contenedor);
    });

    lista.appendChild(galeria);
}


/* =========================================
   SUBIR FOTOGRAFÍA
   ========================================= */

async function subirEvidenciaItem(itemId, archivo, boton) {
    if (!archivo) return;

    const extensionesPermitidas = /\.(jpg|jpeg|png|webp)$/i;

    if (!extensionesPermitidas.test(archivo.name)) {
        mostrarNotificacion(
            "Solo se permiten imágenes JPG, JPEG, PNG y WEBP.",
            "warning"
        );
        return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
        mostrarNotificacion(
            "La fotografía supera el tamaño máximo de 10 MB.",
            "warning"
        );
        return;
    }

    const contenidoOriginal = boton.innerHTML;
    const estadoDeshabilitadoOriginal = boton.disabled;

    const formulario = new FormData();
    formulario.append("archivo", archivo);

    boton.disabled = true;
    boton.setAttribute("aria-busy", "true");

    boton.innerHTML = `
        <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
        ></span>
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/tecnico/asignaciones/${assignmentId}/items/${itemId}`,
            {
                method: "POST",
                body: formulario
            }
        );

        const datos = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401) {
            window.location.href = "../index.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.detail || `No se pudo cargar la fotografía (HTTP ${respuesta.status}).`
            );
        }

        mostrarNotificacion(
            "La fotografía se cargó correctamente.",
            "success"
        );

        const lista = document.getElementById(`evidencias-item-${itemId}`);

        if (lista) lista.hidden = false;

        await cargarEvidenciasItem(itemId);

    } catch (error) {
        console.error("Error al subir la fotografía:", error);

        mostrarNotificacion(
            error.message || "No se pudo cargar la fotografía.",
            "error"
        );

    } finally {
        boton.innerHTML = contenidoOriginal;
        boton.disabled = estadoDeshabilitadoOriginal;
        boton.removeAttribute("aria-busy");
    }
}


/* =========================================
   CONFIRMAR ELIMINACIÓN DE EVIDENCIA
   ========================================= */

let evidenciaEliminando = null;

const eliminarEvidenciaModal = new bootstrap.Modal(
    document.getElementById("eliminarEvidenciaModal")
);


function solicitarEliminarEvidencia(itemId, evidenciaId) {
    evidenciaEliminando = {
        itemId,
        evidenciaId
    };

    eliminarEvidenciaModal.show();
}


document.getElementById(
    "btnConfirmarEliminarEvidencia"
)?.addEventListener("click", async function () {

    if (!evidenciaEliminando) {
        mostrarNotificacion(
            "No se pudo identificar la fotografía.",
            "error"
        );
        return;
    }

    const boton = this;
    const contenidoOriginal = boton.innerHTML;

    const { itemId, evidenciaId } = evidenciaEliminando;

    boton.disabled = true;
    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Eliminando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/tecnico/asignaciones/${assignmentId}/items/${itemId}/${evidenciaId}`,
            {
                method: "DELETE"
            }
        );

        const datos = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401) {
            window.location.href = "../index.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.detail || "No se pudo eliminar la fotografía."
            );
        }

        eliminarEvidenciaModal.hide();

        evidenciaEliminando = null;

        await cargarEvidenciasItem(itemId);

        mostrarNotificacion(
            datos.mensaje ||
            "La fotografía se eliminó correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al eliminar la fotografía:", error);

        mostrarNotificacion(
            error.message ||
            "No se pudo conectar con el servidor.",
            "error"
        );

    } finally {
        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;
    }
});


document.getElementById("eliminarEvidenciaModal")
    ?.addEventListener("hidden.bs.modal", () => {
        evidenciaEliminando = null;
    });


function renderizarChecklist(items) {
    const contenedor = document.getElementById("checklistItems");

    if (!contenedor) return;

    contenedor.replaceChildren();
    evidenciasPorItem.clear();

    totalItemsChecklist = items.length;

    actualizarProgresoChecklist();

    if (!items.length) {
        contenedor.innerHTML = `
            <div class="checklist-template-empty">
                El checklist publicado no contiene ítems.
            </div>
        `;
        return;
    }

    const grupos = new Map();

    items.forEach(item => {
        const requisitoId = Number(item.requisito_fotografico_id);

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

                const estado = document.createElement("span");
                estado.id = `estado-item-${itemId}`;
                estado.className = "technician-item-status loading";
                estado.textContent = "Consultando...";

                contenido.append(nombre, detalle);

                if (item.obligatorio) {
                    const obligatorio = document.createElement("span");
                    obligatorio.className =
                        "generated-checklist-item-required";
                    obligatorio.textContent = "Evidencia obligatoria";

                    contenido.appendChild(obligatorio);
                }

                // Acciones
                const acciones = document.createElement("div");
                acciones.className =
                    "generated-checklist-item-actions technician-evidence-actions";

                acciones.appendChild(estado);

                // Botón cargar
                const botonSubir = document.createElement("button");
                botonSubir.type = "button";
                botonSubir.className =
                    "checklist-item-action technician-evidence-action";
                botonSubir.classList.add(
                    "technician-evidence-upload"
                );

                botonSubir.disabled = !edicionEvidenciasHabilitada;
                botonSubir.title = "Cargar evidencia";
                botonSubir.setAttribute("aria-label", "Cargar evidencia");

                const iconoSubir = document.createElement("i");
                iconoSubir.className = "bi bi-cloud-arrow-up";

                botonSubir.appendChild(iconoSubir);

                // Selector de archivos
                const inputArchivo = document.createElement("input");
                inputArchivo.type = "file";
                inputArchivo.accept = ".jpg,.jpeg,.png,.webp";
                inputArchivo.hidden = true;

                inputArchivo.addEventListener("change", async () => {
                    const archivo = inputArchivo.files[0];

                    if (archivo) {
                        await subirEvidenciaItem(
                            itemId,
                            archivo,
                            botonSubir
                        );
                    }

                    inputArchivo.value = "";
                });

                botonSubir.addEventListener("click", () => {
                    inputArchivo.click();
                });

                // Botón consultar
                const botonConsultar = document.createElement("button");
                botonConsultar.type = "button";
                botonConsultar.className =
                    "checklist-item-action technician-evidence-action";
                botonConsultar.title = "Consultar evidencias";
                botonConsultar.setAttribute("aria-label", "Consultar evidencias");

                const iconoConsultar = document.createElement("i");
                iconoConsultar.className = "bi bi-eye";

                botonConsultar.appendChild(iconoConsultar);

                // Lista de fotografías
                const listaEvidencias = document.createElement("div");
                listaEvidencias.id = `evidencias-item-${itemId}`;
                listaEvidencias.className = "technician-evidence-list";
                listaEvidencias.hidden = true;

                botonConsultar.addEventListener("click", async () => {
                    listaEvidencias.hidden = !listaEvidencias.hidden;

                    if (!listaEvidencias.hidden) {
                        const contenidoOriginal = botonConsultar.innerHTML;

                        botonConsultar.disabled = true;
                        botonConsultar.setAttribute("aria-busy", "true");

                        botonConsultar.innerHTML = `
                            <span
                                class="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                            ></span>
                        `;

                        try {
                            await cargarEvidenciasItem(itemId);
                        } finally {
                            botonConsultar.innerHTML = contenidoOriginal;
                            botonConsultar.disabled = false;
                            botonConsultar.removeAttribute("aria-busy");
                        }
                    }
                });

                // Cámara: se conserva como función futura
                const botonCamara = document.createElement("button");
                botonCamara.type = "button";
                botonCamara.className =
                    "checklist-item-action technician-evidence-action camera";
                botonCamara.disabled = true;
                botonCamara.title =
                    "Disponible próximamente: integración con la APK Android";
                botonCamara.setAttribute(
                    "aria-label",
                    "Disponible próximamente: integración con la APK Android"
                );

                const iconoCamara = document.createElement("i");
                iconoCamara.className = "bi bi-camera";

                botonCamara.appendChild(iconoCamara);

                acciones.append(
                    botonSubir,
                    botonConsultar,
                    botonCamara,
                    inputArchivo
                );

                fila.append(contenido, acciones);

                const contenedorItem = document.createElement("div");
                contenedorItem.className = "technician-checklist-item-wrapper";

                contenedorItem.append(fila, listaEvidencias);
                lista.appendChild(contenedorItem);

                // Consultar el estado real de las evidencias
                cargarEvidenciasItem(itemId);
            });

        grupo.append(encabezado, lista);
        contenedor.appendChild(grupo);
    });
}


/* =========================================
   ENVIAR CHECKLIST
   ========================================= */

const confirmarEnvioChecklistModal = new bootstrap.Modal(
    document.getElementById("confirmarEnvioChecklistModal")
);

async function enviarChecklistTecnico() {
    if (!edicionEvidenciasHabilitada || enviandoChecklist) {
        return;
    }

    const boton = document.getElementById(
        "btnConfirmarEnvioChecklist"
    );

    const contenidoOriginal = boton.innerHTML;

    enviandoChecklist = true;
    actualizarEstadoEdicionEvidencias();

    boton.disabled = true;

    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        Enviando...
    `;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/evidencias/tecnico/asignaciones/${assignmentId}/enviar`,
            {
                method: "POST"
            }
        );

        const datos = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401) {
            window.location.href = "../index.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.detail || "No se pudo enviar el checklist."
            );
        }

        confirmarEnvioChecklistModal.hide();

        edicionEvidenciasHabilitada = false;

        actualizarEstadoEdicionEvidencias();

        mostrarNotificacion(
            datos.mensaje || "El checklist fue enviado correctamente.",
            "success"
        );

        if (datos.estado) {
            const asignacionesRespuesta = await apiFetch(
                `${API_URL}/asignaciones/tecnico/mis-asignaciones`
            );

            if (asignacionesRespuesta.ok) {
                const asignaciones = await asignacionesRespuesta.json();

                const asignacionActual = asignaciones.find(
                    item => Number(item.id) === Number(assignmentId)
                );

                if (asignacionActual) {
                    actualizarEncabezado(asignacionActual);
                }
            }
        }

        for (const itemId of evidenciasPorItem.keys()) {
            const lista = document.getElementById(
                `evidencias-item-${itemId}`
            );

            if (lista && !lista.hidden) {
                await cargarEvidenciasItem(itemId);
            }
        }

    } catch (error) {
        console.error("Error al enviar el checklist:", error);

        confirmarEnvioChecklistModal.hide();

        mostrarNotificacion(
            error.message || "No se pudo enviar el checklist.",
            "error"
        );

    } finally {
        enviandoChecklist = false;

        boton.disabled = false;
        boton.innerHTML = contenidoOriginal;

        actualizarEstadoEdicionEvidencias();
    }
}

document.getElementById(
    "btnEnviarChecklist"
)?.addEventListener("click", function () {
    if (!edicionEvidenciasHabilitada || enviandoChecklist) {
        return;
    }

    confirmarEnvioChecklistModal.show();
});

document.getElementById(
    "btnConfirmarEnvioChecklist"
)?.addEventListener(
    "click",
    enviarChecklistTecnico
);


/* =========================================
   CARGAR ASIGNACIÓN
   ========================================= */

async function cargarAsignacion() {
    if (!assignmentId || !/^\d+$/.test(assignmentId)) {
        mostrarNotificacion(
            "No se indicó un identificador válido. Regresa a tus asignaciones y selecciona un registro.",
            "error"
        );
        return;
    }

    try {
        const respuesta = await apiFetch(
            `${API_URL}/asignaciones/tecnico/mis-asignaciones`
        );

        if (respuesta.status === 401 || respuesta.status === 403) {
            window.location.href = "../index.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(
                `No se pudieron consultar tus asignaciones (HTTP ${respuesta.status}).`
            );
        }

        const asignaciones = await respuesta.json();

        if (!Array.isArray(asignaciones)) {
            throw new Error(
                "El servidor no devolvió una lista válida de asignaciones."
            );
        }

        const asignacion = asignaciones.find(
            item => Number(item.id) === Number(assignmentId)
        );

        edicionEvidenciasHabilitada = Boolean(
            asignacion.edicion_evidencias_habilitada
        );

        if (!asignacion) {
            mostrarNotificacion(
                "La asignación no existe o no pertenece a tu usuario.",
                "error"
            );
        }

        actualizarEncabezado(asignacion);
        actualizarInformacionGeneral(asignacion);
        actualizarTecnicos(asignacion);
        actualizarFechas(asignacion);

        finalizarSkeletonDetalle();

        actualizarEstadoEdicionEvidencias();

        await cargarChecklistPublicado();

    } catch (error) {
        console.error("Error al cargar el detalle:", error);

        finalizarSkeletonDetalle();
        finalizarSkeletonChecklist();

        mostrarNotificacion(
            error.message ||
            "No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose.",
            "error"
        );
    }
}


/* =========================================
   INICIALIZACIÓN
   ========================================= */

document.addEventListener("DOMContentLoaded", cargarAsignacion);
