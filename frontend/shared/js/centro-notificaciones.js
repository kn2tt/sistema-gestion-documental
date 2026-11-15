(function () {
    "use strict";

    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    const API_URL = (
        logoutButton.dataset.apiUrl || "http://127.0.0.1:8000"
    ).replace(/\/$/, "");

    const rutaActual = window.location.pathname;

    const rol = rutaActual.includes("/administrador/")
        ? "administrador"
        : rutaActual.includes("/documentador/")
            ? "documentador"
            : "tecnico";

    // =========================================
    // CARGAR ESTILOS
    // =========================================

    const enlaceCSS = document.createElement("link");
    enlaceCSS.rel = "stylesheet";
    enlaceCSS.href = "../shared/css/centro-notificaciones.css";

    document.head.appendChild(enlaceCSS);

    // =========================================
    // BOTÓN DE NOTIFICACIONES
    // =========================================

    const topbarRight = document.querySelector(".topbar-right");

    // Si la página no tiene barra superior, no continuar.
    if (!topbarRight) return;

    // Buscar si ya existe el botón.
    let botonNotificaciones = topbarRight.querySelector(
        ".notification-button"
    );

    // Crear la campana si todavía no existe.
    if (!botonNotificaciones) {
        botonNotificaciones = document.createElement("button");

        botonNotificaciones.type = "button";
        botonNotificaciones.className = (
            "topbar-button notification-button"
        );

        botonNotificaciones.title = "Notificaciones";
        botonNotificaciones.setAttribute(
            "aria-label",
            "Notificaciones"
        );

        botonNotificaciones.innerHTML = `
            <i class="bi bi-bell"></i>
            <span class="notification-dot"></span>
        `;

        const divisor = topbarRight.querySelector(
            ".topbar-divider"
        );

        topbarRight.insertBefore(
            botonNotificaciones,
            divisor || topbarRight.firstChild
        );
    }

    // =========================================
    // CONTENEDOR DEL CENTRO DE NOTIFICACIONES
    // =========================================

    // Comprobar si la campana ya está dentro de un contenedor.
    let notificationWrapper = botonNotificaciones.closest(
        ".notification-center-wrapper"
    );

    // Si todavía no existe, crearlo.
    if (!notificationWrapper) {
        notificationWrapper = document.createElement("div");

        notificationWrapper.className = "notification-center-wrapper";

        // Utilizar el padre real de la campana.
        const padreBoton = botonNotificaciones.parentNode;

        padreBoton.insertBefore(
            notificationWrapper,
            botonNotificaciones
        );

        notificationWrapper.appendChild(botonNotificaciones);
    }

    const puntoRojo = botonNotificaciones.querySelector(
        ".notification-dot"
    );

    botonNotificaciones.setAttribute(
        "aria-expanded",
        "false"
    );

    // =========================================
    // PANEL
    // =========================================

    const panel = document.createElement("section");

    panel.className = "notification-center-panel";
    panel.hidden = true;

    panel.setAttribute("aria-label", "Centro de notificaciones");

    panel.innerHTML = `
        <div class="notification-center-header">
            <div>
                <strong>Notificaciones</strong>
                <span>Actividad reciente del sistema</span>
            </div>

            <button
                type="button"
                class="notification-center-read-all"
                id="notificationReadAll"
            >
                Marcar todas como leídas
            </button>
        </div>

        <div
            class="notification-center-list"
            id="notificationList"
        ></div>

        <div
            class="notification-center-empty"
            id="notificationEmpty"
            hidden
        >
            <i class="bi bi-bell-slash"></i>
            <strong>No tienes notificaciones</strong>
            <span>Cuando ocurra una actividad importante aparecerá aquí.</span>
        </div>
    `;

    notificationWrapper.appendChild(panel);

    const lista = panel.querySelector("#notificationList");
    const vacio = panel.querySelector("#notificationEmpty");
    const botonMarcarTodas = panel.querySelector(
        "#notificationReadAll"
    );

    let notificacionesActuales = [];

    // =========================================
    // UTILIDADES
    // =========================================

    function actualizarIndicador(cantidad) {
        const hayNoLeidas = Number(cantidad) > 0;

        botonNotificaciones.classList.toggle(
            "has-unread",
            hayNoLeidas
        );

        if (puntoRojo) {
            puntoRojo.hidden = !hayNoLeidas;
        }

        botonNotificaciones.setAttribute(
            "aria-label",
            hayNoLeidas
                ? `Notificaciones, ${cantidad} sin leer`
                : "Notificaciones"
        );
    }

    function formatearFecha(fecha) {
        if (!fecha) return "";

        const valor = new Date(fecha);

        if (Number.isNaN(valor.getTime())) {
            return "";
        }

        return valor.toLocaleString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function obtenerDestino(notificacion) {
        const id = notificacion.entidad_id;

        if (!id || notificacion.entidad_tipo !== "asignacion") {
            if (rol === "administrador") {
                return "dashboard.html";
            }

            return "asignaciones.html";
        }

        const parametro = `?id=${encodeURIComponent(id)}`;

        if (
            rol === "administrador" &&
            notificacion.tipo === "checklist_enviado"
        ) {
            return `detalle-evidencias.html${parametro}`;
        }

        if (
            rol === "administrador" &&
            notificacion.tipo === "documento_cargado"
        ) {
            return `detalle-documentos.html${parametro}`;
        }

        return `detalle-asignacion.html${parametro}`;
    }

    async function solicitar(url, opciones = {}) {
        const respuesta = await fetch(
            `${API_URL}${url}`,
            {
                ...opciones,
                credentials: "include",
                cache: "no-store",
                headers: {
                    ...(opciones.headers || {})
                }
            }
        );

        if (respuesta.status === 401) {
            return null;
        }

        const data = await respuesta.json().catch(
            () => ({})
        );

        if (!respuesta.ok) {
            throw new Error(
                data.detail || "No se pudo completar la operación."
            );
        }

        return data;
    }

    // =========================================
    // RENDERIZAR NOTIFICACIONES
    // =========================================

    function crearElementoNotificacion(item) {
        const boton = document.createElement("button");

        boton.type = "button";

        boton.className = (
            "notification-center-item" +
            (item.leida ? "" : " unread")
        );

        const icono = document.createElement("span");
        icono.className = "notification-center-icon";

        const iconoInterno = document.createElement("i");
        iconoInterno.className = "bi bi-bell";

        icono.appendChild(iconoInterno);

        const contenido = document.createElement("span");
        contenido.className = "notification-center-content";

        const titulo = document.createElement("strong");
        titulo.textContent = item.titulo || "Notificación";

        const mensaje = document.createElement("span");
        mensaje.textContent = item.mensaje || "";

        const fecha = document.createElement("small");
        fecha.textContent = formatearFecha(
            item.fecha_creacion
        );

        contenido.append(titulo, mensaje, fecha);

        const indicador = document.createElement("span");
        indicador.className = "notification-center-unread-dot";

        boton.append(
            icono,
            contenido,
            indicador
        );

        boton.addEventListener("click", async function () {
            try {
                if (!item.leida) {
                    await solicitar(
                        `/notificaciones/${item.id}/leida`,
                        {
                            method: "PATCH"
                        }
                    );
                }
            } catch (error) {
                console.error(
                    "No se pudo marcar la notificación como leída:",
                    error
                );
            }

            window.location.href = obtenerDestino(item);
        });

        return boton;
    }

    function renderizarNotificaciones(items) {
        lista.replaceChildren();

        vacio.hidden = items.length > 0;
        lista.hidden = items.length === 0;

        botonMarcarTodas.hidden = !items.some(
            item => !item.leida
        );

        items.forEach(item => {
            lista.appendChild(
                crearElementoNotificacion(item)
            );
        });
    }

    // =========================================
    // CONSULTAR NOTIFICACIONES
    // =========================================

    async function cargarNotificaciones() {
        try {
            const resultado = await solicitar(
                "/notificaciones/?limite=15"
            );

            if (!resultado) {
                actualizarIndicador(0);
                return;
            }

            notificacionesActuales = Array.isArray(
                resultado.items
            )
                ? resultado.items
                : [];

            actualizarIndicador(
                resultado.no_leidas || 0
            );

            if (!panel.hidden) {
                renderizarNotificaciones(
                    notificacionesActuales
                );
            }

        } catch (error) {
            console.error(
                "Error al consultar notificaciones:",
                error
            );
        }
    }

    // =========================================
    // MARCAR TODAS COMO LEÍDAS
    // =========================================

    botonMarcarTodas.addEventListener(
        "click",
        async function () {
            botonMarcarTodas.disabled = true;

            try {
                await solicitar(
                    "/notificaciones/leidas",
                    {
                        method: "PATCH"
                    }
                );

                await cargarNotificaciones();

            } catch (error) {
                console.error(
                    "No se pudieron marcar las notificaciones:",
                    error
                );

            } finally {
                botonMarcarTodas.disabled = false;
            }
        }
    );

    // =========================================
    // ABRIR Y CERRAR PANEL
    // =========================================

    function cerrarPanel() {
        panel.hidden = true;

        botonNotificaciones.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    botonNotificaciones.addEventListener(
        "click",
        async function (evento) {
            evento.stopPropagation();

            const abrir = panel.hidden;

            panel.hidden = !abrir;

            botonNotificaciones.setAttribute(
                "aria-expanded",
                String(abrir)
            );

            if (abrir) {
                await cargarNotificaciones();

                renderizarNotificaciones(
                    notificacionesActuales
                );
            }
        }
    );

    document.addEventListener("click", function (evento) {
        if (!notificationWrapper.contains(evento.target)) {
            cerrarPanel();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            cerrarPanel();
        }
    });

    // =========================================
    // ACTUALIZACIÓN AUTOMÁTICA
    // =========================================

    cargarNotificaciones();

    window.setInterval(function () {
        if (!document.hidden) {
            cargarNotificaciones();
        }
    }, 45000);

    document.addEventListener(
        "visibilitychange",
        function () {
            if (!document.hidden) {
                cargarNotificaciones();
            }
        }
    );

})();
