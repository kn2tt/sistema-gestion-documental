
/* =========================================
   SKELETON LOADING - SISTEMA COMPARTIDO
   ========================================= */

(function (window) {
    "use strict";

    /**
     * Muestra filas skeleton dentro de un tbody.
     */
    function mostrarTabla(tbody, opciones = {}) {
        if (!tbody) return;

        const filas = opciones.filas ?? 4;
        const columnas = opciones.columnas ?? 7;

        tbody.setAttribute("aria-busy", "true");

        tbody.innerHTML = Array.from(
            { length: filas },
            () => `
                <tr class="skeleton-row">
                    ${Array.from(
                        { length: columnas },
                        () => `
                            <td>
                                <div class="skeleton-cell"></div>
                            </td>
                        `
                    ).join("")}
                </tr>
            `
        ).join("");
    }

    /**
     * Actualiza el estado de carga de un elemento.
     */
    function establecerCarga(elemento, cargando) {
        if (!elemento) return;

        elemento.setAttribute(
            "aria-busy",
            cargando ? "true" : "false"
        );
    }

    /**
     * Retira el estado de carga de un tbody.
     * El contenido real debe renderizarse previamente.
     */
    function finalizarTabla(tbody) {
        establecerCarga(tbody, false);
    }

    window.SkeletonUI = {
        mostrarTabla,
        establecerCarga,
        finalizarTabla
    };

})(window);
