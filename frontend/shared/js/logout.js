
(function () {
    "use strict";

    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    const API_URL = (
        logoutButton.dataset.apiUrl || "http://127.0.0.1:8000"
    ).replace(/\/$/, "");

    const LOGIN_URL = logoutButton.dataset.loginUrl || "../index.html";

    // =========================================
    // CREAR MODAL AUTOMÁTICAMENTE
    // =========================================

    const modalHTML = `
        <div
            class="modal fade"
            id="logoutConfirmModal"
            tabindex="-1"
            aria-labelledby="logoutConfirmModalLabel"
            aria-hidden="true"
        >
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-header">
                        <h5
                            class="modal-title"
                            id="logoutConfirmModalLabel"
                        >
                            Cerrar sesión
                        </h5>

                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Cerrar"
                            id="logoutCloseButton"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div class="text-center">

                            <div class="mb-3">
                                <i
                                    class="bi bi-box-arrow-right"
                                    style="font-size: 32px; color: #dc2626;"
                                ></i>
                            </div>

                            <p
                                class="mb-2"
                                style="font-size: 14px; font-weight: 600;"
                            >
                                ¿Deseas cerrar tu sesión?
                            </p>

                            <p
                                class="text-muted mb-0"
                                style="font-size: 13px;"
                            >
                                Tendrás que volver a iniciar sesión para acceder al sistema.
                            </p>

                        </div>
                    </div>

                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-light"
                            data-bs-dismiss="modal"
                            id="logoutCancelButton"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            class="btn btn-danger"
                            id="confirmLogoutButton"
                        >
                            <i class="bi bi-box-arrow-right"></i>
                            Cerrar sesión
                        </button>

                    </div>

                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // =========================================
    // ELEMENTOS DEL MODAL
    // =========================================

    const modalElement = document.getElementById("logoutConfirmModal");

    const confirmButton = document.getElementById("confirmLogoutButton");
    const closeButton = document.getElementById("logoutCloseButton");
    const cancelButton = document.getElementById("logoutCancelButton");

    const logoutModal = bootstrap.Modal.getOrCreateInstance(modalElement);

    let cerrandoSesion = false;

    // =========================================
    // ABRIR MODAL
    // =========================================

    logoutButton.addEventListener("click", function () {
        if (cerrandoSesion) return;

        logoutModal.show();
    });

    // =========================================
    // CONFIRMAR CIERRE DE SESIÓN
    // =========================================

    confirmButton.addEventListener("click", async function () {
        if (cerrandoSesion) return;

        const textoOriginal = confirmButton.innerHTML;

        try {
            cerrandoSesion = true;

            confirmButton.disabled = true;
            confirmButton.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                ></span>
                Cerrando sesión...
            `;

            closeButton.disabled = true;
            cancelButton.disabled = true;

            // Obtener token CSRF
            const csrfResponse = await fetch(`${API_URL}/auth/csrf`, {
                method: "GET",
                credentials: "include"
            });

            if (!csrfResponse.ok) {
                throw new Error(
                    "No se pudo validar la solicitud de cierre de sesión."
                );
            }

            const csrfData = await csrfResponse.json();

            if (!csrfData.csrf_token) {
                throw new Error(
                    "No se pudo obtener el token de seguridad."
                );
            }

            // Ejecutar cierre de sesión
            const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CSRF-Token": csrfData.csrf_token
                }
            });

            if (!logoutResponse.ok) {
                throw new Error("No se pudo cerrar la sesión.");
            }

            window.location.replace(LOGIN_URL);

        } catch (error) {
            console.error("Error al cerrar sesión:", error);

            cerrandoSesion = false;

            confirmButton.disabled = false;
            confirmButton.innerHTML = textoOriginal;

            closeButton.disabled = false;
            cancelButton.disabled = false;

            window.mostrarNotificacion(
                error.message,
                "error",
                "No se pudo cerrar sesión"
            );
        }
    });

    // Limpiar errores al cerrar el modal
    modalElement.addEventListener("hidden.bs.modal", function () {
        const mensajeError = modalElement.querySelector(
            ".logout-error-message"
        );

        if (mensajeError) {
            mensajeError.remove();
        }
    });

})();
