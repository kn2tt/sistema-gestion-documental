
const API_URL = "http://127.0.0.1:8000";

// Elementos del formulario
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const correoInput = document.getElementById("correo");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

let temporizadorBloqueo = null;
let bloqueoActivo = false;

// Mostrar / ocultar contraseña
togglePassword.addEventListener("click", function () {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    this.innerHTML = isPassword
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';
});

// Mostrar mensajes
function mostrarMensaje(mensaje, tipo = "error") {
    loginMessage.className = "login-message";
    loginMessage.textContent = mensaje;
    loginMessage.classList.add(tipo);
}

// Restaurar botón
function restaurarBoton() {
    loginButton.disabled = false;

    loginButton.innerHTML = `
        <span>Ingresar al sistema</span>
        <i class="bi bi-arrow-right"></i>
    `;
}

// Habilitar o deshabilitar formulario
function cambiarEstadoFormulario(deshabilitado) {
    correoInput.disabled = deshabilitado;
    passwordInput.disabled = deshabilitado;
    togglePassword.disabled = deshabilitado;
    loginButton.disabled = deshabilitado;
}

// Formatear tiempo restante
function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    if (horas > 0) {
        return `${horas}h ${minutos}m ${segundosRestantes}s`;
    }

    if (minutos > 0) {
        return `${minutos}m ${segundosRestantes}s`;
    }

    return `${segundosRestantes}s`;
}

// Iniciar contador de bloqueo
function iniciarBloqueo(segundos) {
    if (temporizadorBloqueo) {
        clearInterval(temporizadorBloqueo);
    }

    const duracion = Math.max(1, Number(segundos) || 1);
    const fechaDesbloqueo = Date.now() + duracion * 1000;

    bloqueoActivo = true;

    cambiarEstadoFormulario(true);

    loginButton.innerHTML = `
        <span>Acceso bloqueado</span>
        <i class="bi bi-lock"></i>
    `;

    function actualizarContador() {
        const restante = Math.max(
            0,
            Math.ceil((fechaDesbloqueo - Date.now()) / 1000)
        );

        if (restante <= 0) {
            clearInterval(temporizadorBloqueo);
            temporizadorBloqueo = null;
            bloqueoActivo = false;

            cambiarEstadoFormulario(false);
            restaurarBoton();

            loginMessage.className = "login-message";
            loginMessage.textContent = "";

            return;
        }

        mostrarMensaje(
            `Por seguridad, el acceso está temporalmente bloqueado. Podrás intentarlo nuevamente en ${formatearTiempo(restante)}.`,
            "error"
        );
    }

    actualizarContador();

    temporizadorBloqueo = setInterval(
        actualizarContador,
        1000
    );
}

// Comprobar si ya existe una sesión
async function comprobarSesion() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const rol = data.rol?.toLowerCase();

        if (rol === "administrador") {
            window.location.href = "administrador/dashboard.html";
            return;
        }

        if (rol === "tecnico") {
            window.location.href = "tecnico/asignaciones.html";
            return;
        }

        if (rol === "documentador") {
            window.location.href = "documentador/asignaciones.html";
            return;
        }

    } catch (error) {
        console.error("No se pudo comprobar la sesión:", error);
    }
}

// Iniciar sesión
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (bloqueoActivo) {
        return;
    }

    const correo = correoInput.value.trim();
    const passwordValue = passwordInput.value;

    loginMessage.className = "login-message";

    if (!correo || !passwordValue) {
        mostrarMensaje("Completa todos los campos.");
        return;
    }

    loginButton.disabled = true;

    loginButton.innerHTML = `
        <span>Verificando...</span>
        <i class="bi bi-arrow-repeat spin"></i>
    `;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                correo: correo,
                password: passwordValue
            })
        });

        const data = await response.json();

        if (response.status === 429) {
            const retryAfter = Number(
                data.detail?.retry_after
            );

            if (Number.isFinite(retryAfter) && retryAfter > 0) {
                iniciarBloqueo(retryAfter);
            } else {
                mostrarMensaje(
                    "Tu acceso está temporalmente bloqueado. Inténtalo nuevamente más tarde."
                );
            }

            return;
        }

        if (!response.ok) {
            mostrarMensaje(
                typeof data.detail === "string"
                    ? data.detail
                    : "No se pudo iniciar sesión. Verifica tus credenciales."
            );

            return;
        }

        const usuario = data.usuario;

        if (!usuario) {
            mostrarMensaje(
                "El servidor no devolvió los datos del usuario."
            );
            return;
        }

        const rol = usuario.rol?.toLowerCase();

        if (rol === "administrador") {
            window.location.href = "administrador/dashboard.html";
            return;
        }

        if (rol === "tecnico") {
            window.location.href = "tecnico/asignaciones.html";
            return;
        }

        if (rol === "documentador") {
            window.location.href = "documentador/asignaciones.html";
            return;
        }

        mostrarMensaje(
            "Tu rol todavía no tiene un panel habilitado.",
            "error"
        );

    } catch (error) {
        console.error("Error de autenticación:", error);

        mostrarMensaje(
            "No se pudo conectar con el servidor. Comprueba que el backend esté funcionando."
        );

    } finally {
        if (!bloqueoActivo) {
            restaurarBoton();
        }
    }
});

// Recuperación de contraseña
document
    .getElementById("forgotPassword")
    .addEventListener("click", function (event) {
        event.preventDefault();

        mostrarMensaje(
            "La recuperación de contraseña estará disponible próximamente.",
            "success"
        );
    });

// Comprobar sesión al cargar el login
comprobarSesion();
