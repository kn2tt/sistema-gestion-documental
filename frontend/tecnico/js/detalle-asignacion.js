/* =========================================
   CONFIGURACIÓN
   ========================================= */

const API_URL = "http://127.0.0.1:8000";

const params = new URLSearchParams(window.location.search);
const assignmentId = params.get("id");


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
    }
}


function renderizarChecklist(items) {
    const contenedor = document.getElementById("checklistItems");

    if (!contenedor) return;

    contenedor.replaceChildren();

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

                // Acciones de evidencias
                const acciones = document.createElement("div");
                acciones.className =
                    "generated-checklist-item-actions technician-evidence-actions";

                const accionesEvidencia = [
                    {
                        icono: "bi-cloud-arrow-up",
                        titulo: "Cargar evidencia",
                        clase: ""
                    },
                    {
                        icono: "bi-eye",
                        titulo: "Consultar evidencia",
                        clase: ""
                    },
                    {
                        icono: "bi-trash3",
                        titulo: "Eliminar evidencia",
                        clase: "delete"
                    },
                    {
                        icono: "bi-camera",
                        titulo: "Disponible próximamente: integración con la APK Android",
                        clase: "camera"
                    }
                ];

                accionesEvidencia.forEach(accion => {
                    const boton = document.createElement("button");

                    boton.type = "button";
                    boton.className =
                        `checklist-item-action technician-evidence-action ${accion.clase}`;

                    boton.disabled = true;
                    boton.title = accion.titulo;
                    boton.setAttribute("aria-label", accion.titulo);

                    const icono = document.createElement("i");
                    icono.className = `bi ${accion.icono}`;

                    boton.appendChild(icono);
                    acciones.appendChild(boton);
                });

                fila.append(contenido, acciones);
                lista.appendChild(fila);
            });

        grupo.append(encabezado, lista);
        contenedor.appendChild(grupo);
    });
}



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

        await cargarChecklistPublicado();

    } catch (error) {
        console.error("Error al cargar el detalle:", error);

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
