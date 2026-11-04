const API_URL = "http://127.0.0.1:8000";

// Elementos del formulario
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

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

    } catch (error) {
        console.error("No se pudo comprobar la sesión:", error);
    }
}

// Iniciar sesión
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const correo = document.getElementById("correo").value.trim();
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
            mostrarMensaje("El servidor no devolvió los datos del usuario.");
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
        restaurarBoton();
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
