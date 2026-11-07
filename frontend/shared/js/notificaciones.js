(function () {
    "use strict";

    function mostrarNotificacion(mensaje, tipo = "info", titulo = "") {
        let contenedor = document.querySelector(".notification-container");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.className = "notification-container";
            contenedor.id = "notificationContainer";
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

        const opciones = configuracion[tipo] || configuracion.info;

        const elemento = document.createElement("div");
        elemento.className = `system-notification ${tipo}`;

        const icono = document.createElement("i");
        icono.className = `bi ${opciones.icono} notification-icon`;

        const contenido = document.createElement("div");
        contenido.className = "notification-content";

        const tituloElemento = document.createElement("div");
        tituloElemento.className = "notification-title";
        tituloElemento.textContent = titulo || opciones.titulo;

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

        elemento.append(icono, contenido, botonCerrar);
        contenedor.appendChild(elemento);

        let temporizador;

        function cerrarNotificacion() {
            if (!elemento.isConnected) return;

            clearTimeout(temporizador);

            elemento.classList.add("notification-exit");

            elemento.addEventListener("animationend", function () {
                elemento.remove();

                if (contenedor.isConnected && !contenedor.children.length) {
                    contenedor.remove();
                }
            }, { once: true });

            window.setTimeout(function () {
                elemento.remove();

                if (contenedor.isConnected && !contenedor.children.length) {
                    contenedor.remove();
                }
            }, 300);
        }

        botonCerrar.addEventListener("click", cerrarNotificacion);

        temporizador = window.setTimeout(cerrarNotificacion, 2500);
    }

    window.mostrarNotificacion = mostrarNotificacion;
})();