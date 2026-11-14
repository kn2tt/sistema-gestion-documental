(function () {
    "use strict";

    const API_URL = "http://127.0.0.1:8000";

    const ESTADOS_EN_PROCESO = [
        "en_proceso",
        "en_documentacion",
        "en_revision"
    ];

    const ESTADOS_PENDIENTES = [
        "pendiente",
        "pendiente_documentacion"
    ];

    const ESTADOS_COMPLETADOS = [
        "completado"
    ];

    const tablaAsignaciones = document.getElementById(
        "dashboardAssignments"
    );

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => {
            const entidades = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entidades[caracter];
        });
    }

    function obtenerNombreCompleto(usuario) {
        return `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();
    }

    function obtenerIniciales(nombre) {
        const partes = String(nombre ?? "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!partes.length) return "—";

        if (partes.length === 1) {
            return partes[0].substring(0, 2).toUpperCase();
        }

        return (
            partes[0].charAt(0) +
            partes[partes.length - 1].charAt(0)
        ).toUpperCase();
    }

    function obtenerEtiquetaRol(rol) {
        const roles = {
            administrador: "Administrador del sistema",
            tecnico: "Técnico",
            documentador: "Documentador"
        };

        return roles[String(rol ?? "").toLowerCase()] ?? "Usuario";
    }

    function actualizarUsuario(usuario) {
        const nombre = obtenerNombreCompleto(usuario);
        const correo = usuario?.correo ?? "";
        const iniciales = obtenerIniciales(nombre);

        const elementos = [
            {
                nombre: ".sidebar-user .user-info strong",
                valor: nombre
            },
            {
                nombre: ".sidebar-user .user-info span",
                valor: correo
            },
            {
                nombre: ".topbar-user-info strong",
                valor: nombre
            },
            {
                nombre: ".topbar-user-info span",
                valor: obtenerEtiquetaRol(usuario?.rol)
            },
            {
                nombre: ".sidebar-user .user-avatar",
                valor: iniciales
            },
            {
                nombre: ".topbar-user .topbar-avatar",
                valor: iniciales
            }
        ];

        elementos.forEach(elemento => {
            const nodo = document.querySelector(elemento.nombre);

            if (nodo) {
                nodo.textContent = elemento.valor || "—";
            }
        });
    }

    function actualizarEstadisticas(asignaciones) {
        const total = asignaciones.length;

        const enProceso = asignaciones.filter(asignacion =>
            ESTADOS_EN_PROCESO.includes(asignacion.estado)
        ).length;

        const completadas = asignaciones.filter(asignacion =>
            ESTADOS_COMPLETADOS.includes(asignacion.estado)
        ).length;

        const pendientes = asignaciones.filter(asignacion =>
            ESTADOS_PENDIENTES.includes(asignacion.estado)
        ).length;

        const valores = {
            summaryTotal: total,
            summaryProcess: enProceso,
            summaryComplete: completadas,
            summaryPending: pendientes
        };

        Object.entries(valores).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);

            if (elemento) {
                elemento.textContent = valor;
            }
        });
    }

    function obtenerFechaOrden(valor) {
        if (!valor) return 0;

        const fecha = new Date(`${String(valor).substring(0, 10)}T00:00:00`);

        return Number.isNaN(fecha.getTime())
            ? 0
            : fecha.getTime();
    }

    function formatearEstado(estado) {
        const etiquetas = {
            pendiente: "Pendiente",
            en_proceso: "En proceso",
            pendiente_documentacion: "Pendiente de documentación",
            en_documentacion: "En documentación",
            en_revision: "En revisión",
            observado: "Observado",
            completado: "Completado"
        };

        return etiquetas[estado] ?? "Sin estado";
    }

    function obtenerClaseEstado(estado) {
        if (estado === "completado") {
            return "completed";
        }

        if (ESTADOS_EN_PROCESO.includes(estado)) {
            return "in-progress";
        }

        return "pending";
    }

    function obtenerResponsables(asignacion) {
        const tecnicos = Array.isArray(asignacion.tecnicos)
            ? asignacion.tecnicos
            : [];

        const documentador = asignacion.documentador_nombre;

        const responsables = [];

        tecnicos.forEach(tecnico => {
            const nombre = `${tecnico.nombre ?? ""} ${tecnico.apellido ?? ""}`.trim();

            if (nombre) {
                responsables.push({
                    nombre,
                    clase: "technician"
                });
            }
        });

        if (documentador) {
            responsables.push({
                nombre: documentador,
                clase: "documenter"
            });
        }

        if (!responsables.length) {
            return `
                <div class="responsible-cell">
                    <span>Sin responsables</span>
                </div>
            `;
        }

        const visibles = responsables.slice(0, 3);
        const adicionales = responsables.length - visibles.length;

        return `
            <div class="responsible-cell">
                ${visibles.map(responsable => `
                    <div
                        class="mini-avatar ${responsable.clase}"
                        title="${escaparHTML(responsable.nombre)}"
                    >
                        ${escaparHTML(obtenerIniciales(responsable.nombre))}
                    </div>
                `).join("")}

                <span>
                    ${adicionales > 0
                        ? `+${adicionales} responsables`
                        : `${responsables.length} responsable${responsables.length === 1 ? "" : "s"}`}
                </span>
            </div>
        `;
    }

    function renderizarAsignaciones(asignaciones) {
        if (!tablaAsignaciones) return;

        const recientes = [...asignaciones]
            .sort((a, b) =>
                obtenerFechaOrden(b.fecha_asignacion) -
                obtenerFechaOrden(a.fecha_asignacion)
            )
            .slice(0, 5);

        if (!recientes.length) {
            tablaAsignaciones.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        No hay asignaciones registradas.
                    </td>
                </tr>
            `;

            return;
        }

        tablaAsignaciones.innerHTML = recientes.map(asignacion => `
            <tr>
                <td>
                    <div class="project-cell">
                        <div class="project-icon">
                            <i class="bi bi-diagram-3"></i>
                        </div>

                        <div>
                            <strong>
                                ${escaparHTML(asignacion.proyecto_nombre || "Sin proyecto")}
                            </strong>

                            <span>
                                ${escaparHTML(asignacion.cliente_nombre || "Sin cliente")}
                            </span>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="site-name">
                        ${escaparHTML(asignacion.site_nombre || "Sin site")}
                    </span>
                </td>

                <td>
                    <div class="document-cell">
                        <i class="bi bi-file-earmark-text"></i>

                        <span>
                            ${escaparHTML(asignacion.tipo_documento_nombre || "Sin documento")}
                        </span>
                    </div>
                </td>

                <td>
                    ${obtenerResponsables(asignacion)}
                </td>

                <td>
                    <span class="status-badge ${obtenerClaseEstado(asignacion.estado)}">
                        <span></span>
                        ${escaparHTML(formatearEstado(asignacion.estado))}
                    </span>
                </td>
            </tr>
        `).join("");
    }

    async function obtenerJSON(ruta) {
        const respuesta = await fetch(`${API_URL}${ruta}`, {
            credentials: "include"
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        return respuesta.json();
    }

    async function cargarUsuario() {
        try {
            const usuario = await obtenerJSON("/auth/me");
            actualizarUsuario(usuario);
        } catch (error) {
            console.error(
                "No se pudo cargar el usuario del dashboard:",
                error
            );
        }
    }

    async function cargarAsignaciones() {
        try {
            const asignaciones = await obtenerJSON("/asignaciones/");

            if (!Array.isArray(asignaciones)) {
                throw new Error("La respuesta de asignaciones no es válida.");
            }

            actualizarEstadisticas(asignaciones);
            renderizarAsignaciones(asignaciones);

        } catch (error) {
            console.error(
                "No se pudieron cargar las asignaciones del dashboard:",
                error
            );

            const idsEstadisticas = [
                "summaryTotal",
                "summaryProcess",
                "summaryComplete",
                "summaryPending"
            ];

            idsEstadisticas.forEach(id => {
                const elemento = document.getElementById(id);

                if (elemento) {
                    elemento.textContent = "—";
                }
            });

            if (tablaAsignaciones) {
                tablaAsignaciones.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            No se pudieron cargar las asignaciones.
                        </td>
                    </tr>
                `;
            }
        }
    }

    cargarUsuario();
    cargarAsignaciones();

})();