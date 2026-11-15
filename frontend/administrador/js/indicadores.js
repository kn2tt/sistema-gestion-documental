(function () {
    "use strict";

    const API_URL = "http://127.0.0.1:8000";

    const ESTADOS = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        pendiente_documentacion: "Pendiente de documentación",
        en_documentacion: "En documentación",
        en_revision: "En revisión",
        observado: "Observado",
        completado: "Completado",
        en_revision_documental: "En revisión documental"
    };

    const ESTADOS_DOCUMENTO = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        en_revision: "En revisión",
        aprobado: "Aprobado",
        observado: "Observado",
        completado: "Completado"
    };

    const COLORES_ESTADOS = [
        "#d99a35",
        "#4380c7",
        "#e2b04c",
        "#8067c9",
        "#2e9b76",
        "#d45c5c",
        "#23945d"
    ];

    const COLORES_DOCUMENTOS = [
        "#4380c7",
        "#d99a35",
        "#8067c9",
        "#23945d",
        "#d45c5c",
        "#2e9b76"
    ];

    const elementos = {
        dateFrom: document.getElementById("dateFrom"),
        dateTo: document.getElementById("dateTo"),
        clientFilter: document.getElementById("clientFilter"),
        projectFilter: document.getElementById("projectFilter"),
        resetFilters: document.getElementById("resetFilters"),
        refresh: document.getElementById("refreshIndicators"),
        message: document.getElementById("indicatorsMessage"),
        lastUpdate: document.getElementById("lastUpdate"),

        totalAssignments: document.getElementById("totalAssignments"),
        activeAssignments: document.getElementById("activeAssignments"),
        completedAssignments: document.getElementById("completedAssignments"),
        overdueAssignments: document.getElementById("overdueAssignments"),
        uploadedDocuments: document.getElementById("uploadedDocuments"),
        missingDocuments: document.getElementById("missingDocuments"),

        assignmentsLegend: document.getElementById("assignmentsLegend"),
        documentsLegend: document.getElementById("documentsLegend"),

        documentsTotal: document.getElementById("documentsTotal"),
        documentsByType: document.getElementById("documentsByType"),

        evidencePercentage: document.getElementById("evidencePercentage"),
        evidenceTotal: document.getElementById("evidenceTotal"),
        evidenceProgressFill: document.getElementById("evidenceProgressFill"),
        evidenceCompleted: document.getElementById("evidenceCompleted"),
        evidencePending: document.getElementById("evidencePending"),

        responsiblesTable: document.getElementById("responsiblesTable"),
        alertsCount: document.getElementById("alertsCount"),
        alertsList: document.getElementById("alertsList")
    };

    const charts = {
        assignments: null,
        documents: null,
        clients: null,
        projects: null
    };

    let cargando = false;


    /* =====================================================
       UTILIDADES
       ===================================================== */

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


    function obtenerNumero(valor) {
        const numero = Number(valor ?? 0);

        return Number.isFinite(numero) ? numero : 0;
    }


    function formatearNumero(valor) {
        return obtenerNumero(valor).toLocaleString("es-PE");
    }


    function formatearPorcentaje(valor) {
        return obtenerNumero(valor).toLocaleString("es-PE", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
    }


    function obtenerIniciales(nombre) {
        const partes = String(nombre ?? "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!partes.length) {
            return "—";
        }

        if (partes.length === 1) {
            return partes[0].substring(0, 2).toUpperCase();
        }

        return (
            partes[0].charAt(0) +
            partes[partes.length - 1].charAt(0)
        ).toUpperCase();
    }


    function formatearFecha(valor) {
        if (!valor) {
            return "Sin fecha";
        }

        const partes = String(valor).substring(0, 10).split("-");

        if (partes.length !== 3) {
            return valor;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }


    function formatearFechaHora(valor) {
        if (!valor) {
            return "Sin información";
        }

        const fecha = new Date(valor);

        if (Number.isNaN(fecha.getTime())) {
            return "Sin información";
        }

        return fecha.toLocaleString("es-PE", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }


    function mostrarMensaje(mensaje, tipo = "error") {
        elementos.message.textContent = mensaje;
        elementos.message.className = "indicators-message";

        if (tipo === "loading") {
            elementos.message.classList.add("loading");
        }

        elementos.message.hidden = false;
    }


    function ocultarMensaje() {
        elementos.message.hidden = true;
        elementos.message.textContent = "";
    }


    function actualizarBotonCarga(estado) {
        cargando = estado;

        elementos.refresh.disabled = estado;

        elementos.refresh.innerHTML = estado
            ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Actualizando'
            : '<i class="bi bi-arrow-clockwise"></i> Actualizar';
    }


    /* =====================================================
       USUARIO
       ===================================================== */

    function actualizarUsuario(usuario) {
        const nombre = `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();
        const correo = usuario?.correo ?? "";

        const iniciales = obtenerIniciales(nombre);

        const etiquetaRol = {
            administrador: "Administrador del sistema",
            tecnico: "Técnico",
            documentador: "Documentador"
        };

        const valores = [
            {
                selector: ".sidebar-user .user-info strong",
                valor: nombre
            },
            {
                selector: ".sidebar-user .user-info span",
                valor: correo
            },
            {
                selector: ".topbar-user-info strong",
                valor: nombre
            },
            {
                selector: ".topbar-user-info span",
                valor: etiquetaRol[String(usuario?.rol ?? "").toLowerCase()] ?? "Usuario"
            },
            {
                selector: ".sidebar-user .user-avatar",
                valor: iniciales
            },
            {
                selector: ".topbar-user .topbar-avatar",
                valor: iniciales
            }
        ];

        valores.forEach(item => {
            const nodo = document.querySelector(item.selector);

            if (nodo) {
                nodo.textContent = item.valor || "—";
            }
        });
    }


    async function cargarUsuario() {
        try {
            const respuesta = await fetch(`${API_URL}/auth/me`, {
                credentials: "include"
            });

            if (!respuesta.ok) {
                return;
            }

            const usuario = await respuesta.json();

            actualizarUsuario(usuario);

        } catch (error) {
            console.error("No se pudo cargar el usuario:", error);
        }
    }


    /* =====================================================
       FILTROS
       ===================================================== */

    function obtenerParametrosFiltros() {
        const parametros = new URLSearchParams();

        if (elementos.dateFrom.value) {
            parametros.set("fecha_desde", elementos.dateFrom.value);
        }

        if (elementos.dateTo.value) {
            parametros.set("fecha_hasta", elementos.dateTo.value);
        }

        if (elementos.clientFilter.value) {
            parametros.set("cliente_id", elementos.clientFilter.value);
        }

        if (elementos.projectFilter.value) {
            parametros.set("proyecto_id", elementos.projectFilter.value);
        }

        return parametros;
    }


    function actualizarProyectos(proyectos) {
        const seleccionActual = elementos.projectFilter.value;

        const clienteSeleccionado = elementos.clientFilter.value;

        const proyectosFiltrados = (proyectos ?? []).filter(proyecto => {
            return !clienteSeleccionado ||
                String(proyecto.cliente_id) === String(clienteSeleccionado);
        });

        elementos.projectFilter.innerHTML = `
            <option value="">Todos los proyectos</option>
            ${proyectosFiltrados.map(proyecto => `
                <option value="${escaparHTML(proyecto.id)}">
                    ${escaparHTML(proyecto.nombre)}
                </option>
            `).join("")}
        `;

        const existeSeleccion = proyectosFiltrados.some(proyecto =>
            String(proyecto.id) === String(seleccionActual)
        );

        if (existeSeleccion) {
            elementos.projectFilter.value = seleccionActual;
        }
    }


    function actualizarClientes(clientes) {
        const seleccionActual = elementos.clientFilter.value;

        elementos.clientFilter.innerHTML = `
            <option value="">Todos los clientes</option>
            ${(clientes ?? []).map(cliente => `
                <option value="${escaparHTML(cliente.id)}">
                    ${escaparHTML(cliente.nombre)}
                </option>
            `).join("")}
        `;

        const existeSeleccion = (clientes ?? []).some(cliente =>
            String(cliente.id) === String(seleccionActual)
        );

        if (existeSeleccion) {
            elementos.clientFilter.value = seleccionActual;
        }
    }


    function actualizarFiltros(datos) {
        actualizarClientes(datos.filtros?.clientes ?? []);
        actualizarProyectos(datos.filtros?.proyectos ?? []);
    }


    /* =====================================================
       TARJETAS PRINCIPALES
       ===================================================== */

    function actualizarResumen(resumen) {
        elementos.totalAssignments.textContent =
            formatearNumero(resumen.total_asignaciones);

        elementos.activeAssignments.textContent =
            formatearNumero(resumen.asignaciones_activas);

        elementos.completedAssignments.textContent =
            formatearNumero(resumen.asignaciones_completadas);

        elementos.overdueAssignments.textContent =
            formatearNumero(resumen.asignaciones_vencidas);

        elementos.uploadedDocuments.textContent =
            formatearNumero(resumen.documentos_cargados);

        elementos.missingDocuments.textContent =
            formatearNumero(resumen.asignaciones_sin_documento);
    }


    /* =====================================================
       GRÁFICOS
       ===================================================== */

    function destruirGrafico(nombre) {
        if (charts[nombre]) {
            charts[nombre].destroy();
            charts[nombre] = null;
        }
    }


    function obtenerEtiquetaEstado(estado, catalogo) {
        return catalogo[estado] ?? String(estado ?? "Sin estado")
            .replaceAll("_", " ")
            .replace(/\b\w/g, letra => letra.toUpperCase());
    }


    function renderizarLeyenda(contenedor, etiquetas, valores, colores) {
        if (!etiquetas.length) {
            contenedor.innerHTML = `
                <div class="empty-state compact">
                    No hay información disponible.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = etiquetas.map((etiqueta, indice) => `
            <div class="legend-item">
                <span
                    class="legend-color"
                    style="background:${colores[indice % colores.length]}"
                ></span>

                <span>${escaparHTML(etiqueta)}</span>

                <strong>${formatearNumero(valores[indice])}</strong>
            </div>
        `).join("");
    }


    function crearGraficoDona(canvasId, datos, catalogo, colores, nombreChart, idLeyenda) {
        destruirGrafico(nombreChart);

        const canvas = document.getElementById(canvasId);
        const leyenda = document.getElementById(idLeyenda);

        const registros = (datos ?? []).filter(item =>
            obtenerNumero(item.cantidad) > 0
        );

        const etiquetas = registros.map(item =>
            obtenerEtiquetaEstado(item.estado, catalogo)
        );

        const valores = registros.map(item =>
            obtenerNumero(item.cantidad)
        );

        if (!registros.length) {
            leyenda.innerHTML = `
                <div class="empty-state compact">
                    No hay registros para mostrar.
                </div>
            `;
        } else {
            renderizarLeyenda(
                leyenda,
                etiquetas,
                valores,
                colores
            );
        }

        if (typeof Chart === "undefined") {
            return;
        }

        charts[nombreChart] = new Chart(canvas, {
            type: "doughnut",

            data: {
                labels: etiquetas,
                datasets: [{
                    data: valores,
                    backgroundColor: colores,
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverOffset: 5
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "67%",

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: contexto => {
                                return ` ${contexto.label}: ${formatearNumero(contexto.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }


    function crearGraficoBarras(canvasId, registros, nombreChart, campoNombre) {
        destruirGrafico(nombreChart);

        const canvas = document.getElementById(canvasId);

        const datos = (registros ?? []).filter(item =>
            obtenerNumero(item.cantidad) > 0
        );

        const etiquetas = datos.map(item =>
            item[campoNombre] ?? "Sin nombre"
        );

        const valores = datos.map(item =>
            obtenerNumero(item.cantidad)
        );

        if (typeof Chart === "undefined") {
            return;
        }

        charts[nombreChart] = new Chart(canvas, {
            type: "bar",

            data: {
                labels: etiquetas,

                datasets: [{
                    label: "Asignaciones",
                    data: valores,
                    backgroundColor: "#4380c7",
                    hoverBackgroundColor: "#286bc1",
                    borderRadius: 6,
                    maxBarThickness: 42
                }]
            },

            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: contexto => {
                                return ` ${formatearNumero(contexto.raw)} asignaciones`;
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: "#8993a3",
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: "#edf0f4"
                        },
                        border: {
                            display: false
                        }
                    },

                    y: {
                        ticks: {
                            color: "#687488",
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });
    }


    function actualizarGraficos(datos) {
        crearGraficoDona(
            "assignmentsChart",
            datos.asignaciones_por_estado,
            ESTADOS,
            COLORES_ESTADOS,
            "assignments",
            "assignmentsLegend"
        );

        crearGraficoDona(
            "documentsChart",
            datos.documentos?.por_estado,
            ESTADOS_DOCUMENTO,
            COLORES_DOCUMENTOS,
            "documents",
            "documentsLegend"
        );

        crearGraficoBarras(
            "clientsChart",
            datos.asignaciones_por_cliente,
            "clients",
            "nombre"
        );

        crearGraficoBarras(
            "projectsChart",
            datos.asignaciones_por_proyecto,
            "projects",
            "nombre"
        );
    }


    /* =====================================================
       DOCUMENTOS
       ===================================================== */

    function actualizarDocumentos(documentos) {
        elementos.documentsTotal.textContent =
            formatearNumero(documentos?.total);

        const tipos = documentos?.por_tipo ?? [];

        if (!tipos.length) {
            elementos.documentsByType.innerHTML = `
                <div class="empty-state compact">
                    No hay documentos registrados.
                </div>
            `;

            return;
        }

        elementos.documentsByType.innerHTML = tipos.map(tipo => `
            <div class="document-type-row">

                <div class="document-type-name">
                    <i class="bi bi-file-earmark-text"></i>
                    <span>${escaparHTML(tipo.nombre)}</span>
                </div>

                <strong class="document-type-count">
                    ${formatearNumero(tipo.cantidad)}
                </strong>

            </div>
        `).join("");
    }


    /* =====================================================
       EVIDENCIAS
       ===================================================== */

    function actualizarEvidencias(evidencias) {
        const porcentaje = Math.min(
            100,
            Math.max(0, obtenerNumero(evidencias?.porcentaje_cumplimiento))
        );

        elementos.evidencePercentage.textContent =
            `${formatearPorcentaje(porcentaje)}%`;

        elementos.evidenceTotal.textContent =
            `${formatearNumero(evidencias?.items_obligatorios)} ítems obligatorios`;

        elementos.evidenceCompleted.textContent =
            formatearNumero(evidencias?.items_completados);

        elementos.evidencePending.textContent =
            formatearNumero(evidencias?.items_pendientes);

        elementos.evidenceProgressFill.style.width =
            `${porcentaje}%`;
    }


    /* =====================================================
       RESPONSABLES
       ===================================================== */

    function actualizarResponsables(responsables) {
        const tabla = elementos.responsiblesTable;

        if (!responsables?.length) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="4" class="table-empty">
                        No hay responsables con asignaciones activas.
                    </td>
                </tr>
            `;

            return;
        }

        const maximo = Math.max(
            ...responsables.map(item =>
                obtenerNumero(item.asignaciones_activas)
            ),
            1
        );

        tabla.innerHTML = responsables.map(responsable => {
            const nombre = responsable.nombre ?? "Sin nombre";
            const cantidad = obtenerNumero(responsable.asignaciones_activas);

            const porcentaje = (cantidad / maximo) * 100;

            return `
                <tr>

                    <td>
                        <div class="responsible-name">

                            <div class="responsible-avatar">
                                ${escaparHTML(obtenerIniciales(nombre))}
                            </div>

                            <span>${escaparHTML(nombre)}</span>

                        </div>
                    </td>

                    <td>
                        <span class="role-badge">
                            ${escaparHTML(responsable.rol ?? "Usuario")}
                        </span>
                    </td>

                    <td class="text-end">
                        <span class="workload-number">
                            ${formatearNumero(cantidad)}
                        </span>
                    </td>

                    <td>
                        <div class="workload-bar">
                            <span style="width:${porcentaje}%"></span>
                        </div>
                    </td>

                </tr>
            `;
        }).join("");
    }


    /* =====================================================
       ALERTAS
       ===================================================== */

    function obtenerDatosAlerta(alerta) {
        const tipos = {
            vencida: {
                titulo: "Asignación vencida",
                icono: "bi-calendar-x"
            },

            documento: {
                titulo: "Documento pendiente",
                icono: "bi-file-earmark-excel"
            },

            evidencia: {
                titulo: "Evidencias incompletas",
                icono: "bi-camera"
            }
        };

        return tipos[alerta.tipo] ?? {
            titulo: "Situación pendiente",
            icono: "bi-exclamation-circle"
        };
    }


    function actualizarAlertas(alertas) {
        const lista = alertas ?? [];

        elementos.alertsCount.textContent =
            `${lista.length} ${lista.length === 1 ? "alerta" : "alertas"}`;

        if (!lista.length) {
            elementos.alertsList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-check-circle me-1"></i>
                    No hay alertas para los filtros seleccionados.
                </div>
            `;

            return;
        }

        elementos.alertsList.innerHTML = lista.map(alerta => {
            const datos = obtenerDatosAlerta(alerta);

            const prioridad = String(alerta.prioridad ?? "media").toLowerCase();

            const clasePrioridad = prioridad === "alta"
                ? "high"
                : "medium";

            const etiquetaPrioridad = prioridad === "alta"
                ? "Alta"
                : "Media";

            return `
                <article class="alert-item">

                    <div class="alert-icon ${clasePrioridad}">
                        <i class="bi ${datos.icono}"></i>
                    </div>

                    <div class="alert-content">

                        <strong>
                            ${escaparHTML(datos.titulo)}
                            · Asignación #${escaparHTML(alerta.asignacion_id)}
                        </strong>

                        <span>
                            ${escaparHTML(alerta.mensaje ?? "Requiere atención.")}
                        </span>

                        <span class="alert-context">
                            ${escaparHTML(alerta.contexto ?? "Sin contexto disponible")}
                        </span>

                    </div>

                    <span class="alert-priority ${clasePrioridad}">
                        Prioridad ${etiquetaPrioridad}
                    </span>

                    <time class="alert-date">
                        ${alerta.fecha ? formatearFecha(alerta.fecha) : ""}
                    </time>

                </article>
            `;
        }).join("");
    }


    /* =====================================================
       ACTUALIZACIÓN GENERAL
       ===================================================== */

    function actualizarFechaGeneracion(fecha) {
        elementos.lastUpdate.innerHTML = `
            <i class="bi bi-clock"></i>
            Actualizado: ${escaparHTML(formatearFechaHora(fecha))}
        `;
    }


    function actualizarInterfaz(datos) {
        actualizarFiltros(datos);

        actualizarResumen(datos.resumen ?? {});

        actualizarGraficos(datos);

        actualizarDocumentos(datos.documentos ?? {});

        actualizarEvidencias(datos.evidencias ?? {});

        actualizarResponsables(datos.responsables ?? []);

        actualizarAlertas(datos.alertas ?? []);

        actualizarFechaGeneracion(datos.generado_en);
    }


    /* =====================================================
       CONSUMO DE API
       ===================================================== */

    async function cargarIndicadores() {
        if (cargando) {
            return;
        }

        actualizarBotonCarga(true);

        mostrarMensaje(
            "Consultando los indicadores de gestión...",
            "loading"
        );

        try {
            const parametros = obtenerParametrosFiltros();

            const query = parametros.toString();

            const ruta = query
                ? `/indicadores/gestion?${query}`
                : "/indicadores/gestion";

            const respuesta = await fetch(`${API_URL}${ruta}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!respuesta.ok) {
                let detalle = `Error HTTP ${respuesta.status}`;

                try {
                    const error = await respuesta.json();

                    if (error.detail) {
                        detalle = error.detail;
                    }
                } catch (_) {
                    // Se conserva el mensaje HTTP.
                }

                throw new Error(detalle);
            }

            const datos = await respuesta.json();

            if (!datos || !datos.resumen) {
                throw new Error(
                    "La respuesta del servidor no contiene los indicadores esperados."
                );
            }

            actualizarInterfaz(datos);

            ocultarMensaje();

        } catch (error) {
            console.error(
                "No se pudieron cargar los indicadores:",
                error
            );

            mostrarMensaje(
                error.message || "No fue posible obtener los indicadores."
            );

        } finally {
            actualizarBotonCarga(false);
        }
    }


    /* =====================================================
       EVENTOS DE FILTROS
       ===================================================== */

    elementos.dateFrom.addEventListener("change", cargarIndicadores);

    elementos.dateTo.addEventListener("change", cargarIndicadores);


    elementos.clientFilter.addEventListener("change", function () {
        elementos.projectFilter.value = "";
        cargarIndicadores();
    });


    elementos.projectFilter.addEventListener("change", cargarIndicadores);


    elementos.refresh.addEventListener("click", cargarIndicadores);


    elementos.resetFilters.addEventListener("click", function () {
        elementos.dateFrom.value = "";
        elementos.dateTo.value = "";
        elementos.clientFilter.value = "";
        elementos.projectFilter.value = "";

        cargarIndicadores();
    });


    /* =====================================================
       SIDEBAR MOBILE
       ===================================================== */

    const sidebar = document.getElementById("sidebar");

    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");


    function abrirSidebar() {
        sidebar.classList.add("show");
        sidebarOverlay.classList.add("show");
    }


    function cerrarSidebar() {
        sidebar.classList.remove("show");
        sidebarOverlay.classList.remove("show");
    }


    mobileMenuButton.addEventListener("click", abrirSidebar);

    sidebarOverlay.addEventListener("click", cerrarSidebar);


    document
        .querySelectorAll(".sidebar .nav-item")
        .forEach(item => {
            item.addEventListener("click", cerrarSidebar);
        });


    /* =====================================================
       INICIALIZACIÓN
       ===================================================== */

    cargarUsuario();

    cargarIndicadores();

})();