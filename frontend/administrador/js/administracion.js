/* =========================================================
   SISTEMA DE GESTIÓN DOCUMENTAL
   ADMINISTRACIÓN
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN GENERAL
   ========================================================= */

const API_URL = "http://127.0.0.1:8000";

// Realizar peticiones al backend enviando la cookie de sesión.
async function apiFetch(url, opciones = {}) {

    return window.fetch(url, {
        ...opciones,
        credentials: "include"
    });

}

/* =========================================================
   2. VARIABLES GLOBALES
   ========================================================= */

let usuarioEditandoId = null;
let usuarioEliminandoId = null;

let clientesActuales = [];
let clienteEliminandoId = null;

let tipoDocumentoEditandoId = null;
let tipoDocumentoEliminandoId = null;

let subproyectoEditandoId = null;
let subproyectoEliminandoId = null;

let alcanceEditandoId = null;
let alcanceEliminandoId = null;

let requisitoEditandoId = null;
let requisitoEliminandoId = null;

/* =========================================================
   3. SIDEBAR
   ========================================================= */

const sidebar =
    document.getElementById("sidebar");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");


function openSidebar() {

    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
}


function closeSidebar() {

    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
}


mobileMenuButton?.addEventListener(
    "click",
    openSidebar
);


sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);


document.querySelectorAll(
    ".sidebar .nav-item"
).forEach(function (item) {

    item.addEventListener(
        "click",
        closeSidebar
    );

});


/* =========================================================
   4. TABS
   ========================================================= */

const tabs =
    document.querySelectorAll(
        ".configuration-tab"
    );

const panels =
    document.querySelectorAll(
        ".configuration-panel"
    );


tabs.forEach(function (tab) {

    tab.addEventListener(
        "click",
        function () {

            const target =
                tab.dataset.tab;


            tabs.forEach(function (item) {

                item.classList.remove(
                    "active"
                );

            });


            panels.forEach(function (panel) {

                panel.classList.remove(
                    "active"
                );

            });


            tab.classList.add(
                "active"
            );


            const selectedPanel =
                document.getElementById(
                    "panel-" + target
                );


            if (selectedPanel) {

                selectedPanel.classList.add(
                    "active"
                );

            }

        }
    );

});


/* =========================================================
   5. NOTIFICACIONES DEL SISTEMA
   ========================================================= */

function mostrarMensajeAdministracionChecklist(
    mensaje,
    tipo = "info",
    formulario = false
) {
    mostrarNotificacion(
        mensaje,
        tipo === "danger" ? "error" : tipo
    );
}

/* =========================================================
   6. MODALES
   ========================================================= */

const nuevoUsuarioModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoUsuarioModal"
        )
    );


const editarUsuarioModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarUsuarioModal"
        )
    );


const eliminarUsuarioModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarUsuarioModal"
        )
    );


const nuevoClienteModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoClienteModal"
        )
    );


const verClienteModal =
    new bootstrap.Modal(
        document.getElementById(
            "verClienteModal"
        )
    );


const editarClienteModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarClienteModal"
        )
    );


const eliminarClienteModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarClienteModal"
        )
    );


const nuevoProyectoModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoProyectoModal"
        )
    );


const editarProyectoModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarProyectoModal"
        )
    );


const eliminarProyectoModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarProyectoModal"
        )
    );


const nuevoSiteModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoSiteModal"
        )
    );

const editarSiteModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarSiteModal"
        )
    );


const eliminarSiteModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarSiteModal"
        )
    );


const nuevoSubproyectoModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoSubproyectoModal"
        )
    );


const editarSubproyectoModal = 
    new bootstrap.Modal(
        document.getElementById(
            "editarSubproyectoModal"
        )
    );

const eliminarSubproyectoModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarSubproyectoModal"
        )
    );


const nuevoTipoDocumentoModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoTipoDocumentoModal"
        )
    );

const editarTipoDocumentoModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarTipoDocumentoModal"
        )
    );

const eliminarTipoDocumentoModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarTipoDocumentoModal"
        )
    );

const nuevaPlantillaModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevaPlantillaModal"
        )
    );


const nuevoAlcanceModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoAlcanceModal"
        )
    );


const verAlcanceModal =
    new bootstrap.Modal(
        document.getElementById(
            "verAlcanceModal"
        )
    );

const editarAlcanceModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarAlcanceModal"
        )
    );


const eliminarAlcanceModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarAlcanceModal"
        )
    );


const nuevoRequisitoModal =
    new bootstrap.Modal(
        document.getElementById(
            "nuevoRequisitoModal"
        )
    );


const editarRequisitoModal =
    new bootstrap.Modal(
        document.getElementById(
            "editarRequisitoModal"
        )
    );

const eliminarRequisitoModal =
    new bootstrap.Modal(
        document.getElementById(
            "eliminarRequisitoModal"
        )
    );


/* =========================================================
   7. UTILIDADES
   ========================================================= */

/*
 * Activa el indicador de carga de un botón
 * y conserva su contenido y estado originales.
 */
function iniciarCargaBoton(boton, texto = "Procesando...") {

    if (!boton) {
        return null;
    }

    const estadoOriginal = {
        contenido: boton.innerHTML,
        deshabilitado: boton.disabled
    };

    boton.disabled = true;
    boton.setAttribute("aria-busy", "true");

    boton.innerHTML = `
        <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
        ></span>
        ${texto}
    `;

    return estadoOriginal;
}


/*
 * Restaura el contenido y estado original del botón.
 */
function finalizarCargaBoton(boton, estadoOriginal) {

    if (!boton || !estadoOriginal) {
        return;
    }

    boton.innerHTML = estadoOriginal.contenido;
    boton.disabled = estadoOriginal.deshabilitado;
    boton.removeAttribute("aria-busy");

}

/*
 * Convierte la respuesta de FastAPI en un mensaje
 * entendible para las notificaciones.
 */

async function obtenerMensajeError(
    respuesta,
    mensajePorDefecto
) {

    try {

        const resultado =
            await respuesta.json();

        const detalle =
            resultado.detail;


        if (Array.isArray(detalle)) {

            return detalle
                .map(function (error) {

                    if (
                        error.loc &&
                        error.loc.includes("correo")
                    ) {

                        return (
                            "Ingresa un correo electrónico válido."
                        );

                    }

                    return (
                        error.msg ||
                        mensajePorDefecto
                    );

                })
                .join("\n");
        }


        return (
            detalle ||
            mensajePorDefecto
        );

    } catch (error) {

        return mensajePorDefecto;

    }

}


/*
 * Limpia un conjunto de campos.
 */

function limpiarCampos(ids) {

    ids.forEach(function (id) {

        const elemento =
            document.getElementById(id);


        if (!elemento) {
            return;
        }


        if (
            elemento.type === "checkbox"
        ) {

            elemento.checked = false;

        } else {

            elemento.value = "";

        }

    });

}


/* =========================================================
   8. USUARIOS
   ========================================================= */


/* FORMATEAR FECHA DEL ÚLTIMO ACCESO */

function formatearUltimoAcceso(valor) {

    if (!valor) {
        return "—";
    }

    // Las fechas del backend se almacenan en UTC.
    const fecha = new Date(
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(valor)
            ? valor
            : `${valor}Z`
    );

    if (isNaN(fecha.getTime())) {
        return "—";
    }

    const opcionesFecha = {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    };

    const partesFecha = new Intl.DateTimeFormat(
        "en-CA",
        opcionesFecha
    ).formatToParts(fecha);

    const partes = Object.fromEntries(
        partesFecha.map(parte => [parte.type, parte.value])
    );

    const fechaAcceso =
        `${partes.year}-${partes.month}-${partes.day}`;

    const hoyPartes = new Intl.DateTimeFormat(
        "en-CA",
        opcionesFecha
    ).formatToParts(new Date());

    const hoyValores = Object.fromEntries(
        hoyPartes.map(parte => [parte.type, parte.value])
    );

    const hoy =
        `${hoyValores.year}-${hoyValores.month}-${hoyValores.day}`;

    // Si la conexión fue hoy, mostrar únicamente la hora.
    if (fechaAcceso === hoy) {

        return new Intl.DateTimeFormat("es-PE", {
            timeZone: "America/Lima",
            hour: "2-digit",
            minute: "2-digit"
        }).format(fecha);

    }

    // Si fue otro día, mostrar fecha y hora.
    return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}


/* MOSTRAR ESTADO DE CONEXIÓN */

function renderizarAccesoUsuario(celda, usuario) {
    celda.innerHTML = "";

    if (usuario.online) {
        const etiqueta = document.createElement("span");
        etiqueta.className = "connection-badge online";

        const indicador = document.createElement("span");
        indicador.className = "connection-dot";

        etiqueta.appendChild(indicador);
        etiqueta.appendChild(document.createTextNode("Conectado"));

        celda.appendChild(etiqueta);
    } else {
        const ultimoAcceso = document.createElement("span");
        ultimoAcceso.className = "connection-time";
        ultimoAcceso.textContent = formatearUltimoAcceso(
            usuario.ultimo_acceso
        );

        celda.appendChild(ultimoAcceso);
    }
}


/* ACTUALIZAR ESTADOS SIN RECARGAR LA TABLA */

async function actualizarEstadosConexion() {

    const tabla = document.getElementById("usuariosTablaBody");

    if (!tabla) {
        return;
    }

    try {

        const respuesta = await apiFetch(
            `${API_URL}/usuarios/`
        );

        if (!respuesta.ok) {
            return;
        }

        const usuarios = await respuesta.json();

        usuarios.forEach(function (usuario) {

            const celda = tabla.querySelector(
                `.user-last-access[data-user-id="${usuario.id}"]`
            );

            if (celda) {
                renderizarAccesoUsuario(celda, usuario);
            }

        });

    } catch (error) {
        // La actualización periódica no debe interrumpir el módulo.
    }
}


/* CARGAR USUARIOS */

async function cargarUsuarios() {

    const tabla =
        document.getElementById(
            "usuariosTablaBody"
        );


    if (!tabla) {
        return;
    }


    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/usuarios/`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron obtener los usuarios."
            );

        }


        const usuarios =
            await respuesta.json();

        const totalUsuarios = document.getElementById("totalUsuarios");

        if (totalUsuarios) {
            totalUsuarios.textContent = usuarios.length;
        }

        tabla.innerHTML = "";


        usuarios.forEach(
            function (usuario) {

                const iniciales =
                    (
                        usuario.nombre.charAt(0) +
                        usuario.apellido.charAt(0)
                    ).toUpperCase();


                const nombreCompleto =
                    usuario.nombre +
                    " " +
                    usuario.apellido;


                const roles = {

                    administrador: {
                        texto: "Administrador",
                        clase: "admin"
                    },

                    tecnico: {
                        texto: "Técnico",
                        clase: "technician"
                    },

                    documentador: {
                        texto: "Documentador",
                        clase: "documenter"
                    }

                };


                const rol =
                    roles[usuario.rol] ||
                    {
                        texto: usuario.rol,
                        clase: ""
                    };


                const estadoTexto =
                    usuario.activo
                        ? "Activo"
                        : "Inactivo";


                const estadoClase =
                    usuario.activo
                        ? "success"
                        : "danger";


                const fila =
                    document.createElement("tr");


                /*
                 * USUARIO
                 */

                const celdaUsuario =
                    document.createElement("td");


                const contenedorUsuario =
                    document.createElement("div");


                contenedorUsuario.className =
                    "table-user";


                const avatar =
                    document.createElement("div");


                avatar.className =
                    "table-avatar";


                avatar.textContent =
                    iniciales;


                const datosUsuario =
                    document.createElement("div");


                const nombre =
                    document.createElement("strong");


                nombre.textContent =
                    nombreCompleto;


                const identificador =
                    document.createElement("span");


                identificador.textContent =
                    "ID: " +
                    String(usuario.id).padStart(
                        3,
                        "0"
                    );


                datosUsuario.append(
                    nombre,
                    identificador
                );


                contenedorUsuario.append(
                    avatar,
                    datosUsuario
                );


                celdaUsuario.appendChild(
                    contenedorUsuario
                );


                /*
                 * CORREO
                 */

                const celdaCorreo =
                    document.createElement("td");


                celdaCorreo.textContent =
                    usuario.correo;


                /*
                 * ROL
                 */

                const celdaRol =
                    document.createElement("td");


                const etiquetaRol =
                    document.createElement("span");


                etiquetaRol.className =
                    "role-badge " +
                    rol.clase;


                etiquetaRol.textContent =
                    rol.texto;


                celdaRol.appendChild(
                    etiquetaRol
                );


                /*
                 * ESTADO
                 */

                const celdaEstado =
                    document.createElement("td");


                const etiquetaEstado =
                    document.createElement("span");


                etiquetaEstado.className =
                    "status-badge " +
                    estadoClase;


                etiquetaEstado.textContent =
                    estadoTexto;


                celdaEstado.appendChild(
                    etiquetaEstado
                );


                /*
                 * ACCESO
                 */

                const celdaAcceso =
                    document.createElement("td");

                celdaAcceso.className = "user-last-access";

                celdaAcceso.dataset.userId = usuario.id;

                renderizarAccesoUsuario(
                    celdaAcceso,
                    usuario
                );


                /*
                 * ACCIONES
                 */

                const celdaAcciones =
                    document.createElement("td");


                /*
                 * EDITAR
                 */

                const botonEditar =
                    document.createElement("button");


                botonEditar.type =
                    "button";


                botonEditar.className =
                    "table-action";


                botonEditar.title =
                    "Editar";


                botonEditar.setAttribute(
                    "aria-label",
                    "Editar usuario"
                );


                const iconoEditar =
                    document.createElement("i");


                iconoEditar.className =
                    "bi bi-pencil";


                botonEditar.appendChild(
                    iconoEditar
                );


                botonEditar.addEventListener(
                    "click",
                    function () {

                        usuarioEditandoId =
                            usuario.id;


                        document.getElementById(
                            "editarUsuarioNombre"
                        ).value =
                            usuario.nombre;


                        document.getElementById(
                            "editarUsuarioApellido"
                        ).value =
                            usuario.apellido;


                        document.getElementById(
                            "editarUsuarioCorreo"
                        ).value =
                            usuario.correo;


                        document.getElementById(
                            "editarUsuarioRol"
                        ).value =
                            usuario.rol;


                        document.getElementById(
                            "editarUsuarioEstado"
                        ).value =
                            String(
                                usuario.activo
                            );


                        document.getElementById(
                            "editarUsuarioPassword"
                        ).value = "";


                        editarUsuarioModal.show();

                    }
                );


                celdaAcciones.appendChild(
                    botonEditar
                );


                /*
                 * ELIMINAR
                 */

                const botonEliminar =
                    document.createElement("button");


                botonEliminar.type =
                    "button";


                botonEliminar.className =
                    "table-action";


                botonEliminar.title =
                    "Eliminar";


                botonEliminar.setAttribute(
                    "aria-label",
                    "Eliminar usuario"
                );


                const iconoEliminar =
                    document.createElement("i");


                iconoEliminar.className =
                    "bi bi-trash";


                botonEliminar.appendChild(
                    iconoEliminar
                );


                botonEliminar.addEventListener(
                    "click",
                    function () {

                        usuarioEliminandoId =
                            usuario.id;


                        document.getElementById(
                            "eliminarUsuarioNombre"
                        ).textContent =
                            usuario.nombre +
                            " " +
                            usuario.apellido;


                        eliminarUsuarioModal.show();

                    }
                );


                celdaAcciones.appendChild(
                    botonEliminar
                );


                fila.append(
                    celdaUsuario,
                    celdaCorreo,
                    celdaRol,
                    celdaEstado,
                    celdaAcceso,
                    celdaAcciones
                );


                tabla.appendChild(
                    fila
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar usuarios:",
            error
        );


        mostrarNotificacion(
            "No se pudo cargar la lista de usuarios.",
            "error"
        );

    }

}


/* GUARDAR USUARIO */

document.getElementById(
    "guardarUsuario"
)?.addEventListener(
    "click",
    async function () {

        const nombre =
            document.getElementById(
                "usuarioNombre"
            ).value.trim();


        const apellido =
            document.getElementById(
                "usuarioApellido"
            ).value.trim();


        const correo =
            document.getElementById(
                "usuarioCorreo"
            ).value.trim();


        const rol =
            document.getElementById(
                "usuarioRol"
            ).value;


        const password =
            document.getElementById(
                "usuarioPassword"
            ).value;


        if (
            !nombre ||
            !apellido ||
            !correo ||
            !rol ||
            !password
        ) {

            mostrarNotificacion(
                "Completa todos los campos antes de guardar.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Guardando..."
            );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/usuarios/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            nombre: nombre,
                            apellido: apellido,
                            correo: correo,
                            rol: rol,
                            password: password
                        })
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo registrar el usuario."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarUsuarios();


            limpiarCampos([
                "usuarioNombre",
                "usuarioApellido",
                "usuarioCorreo",
                "usuarioRol",
                "usuarioPassword"
            ]);


            nuevoUsuarioModal.hide();


            mostrarNotificacion(
                "El usuario se registró correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al registrar usuario:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* ACTUALIZAR USUARIO */

document.getElementById(
    "actualizarUsuario"
)?.addEventListener(
    "click",
    async function () {

        if (!usuarioEditandoId) {

            mostrarNotificacion(
                "No se pudo identificar el usuario seleccionado.",
                "error"
            );

            return;
        }


        const nombre =
            document.getElementById(
                "editarUsuarioNombre"
            ).value.trim();


        const apellido =
            document.getElementById(
                "editarUsuarioApellido"
            ).value.trim();


        const correo =
            document.getElementById(
                "editarUsuarioCorreo"
            ).value.trim();


        const rol =
            document.getElementById(
                "editarUsuarioRol"
            ).value;


        const activo =
            document.getElementById(
                "editarUsuarioEstado"
            ).value === "true";


        const password =
            document.getElementById(
                "editarUsuarioPassword"
            ).value;


        if (
            !nombre ||
            !apellido ||
            !correo ||
            !rol
        ) {

            mostrarNotificacion(
                "Completa todos los campos antes de guardar.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Actualizando..."
            );


        try {

            const datos = {

                nombre: nombre,
                apellido: apellido,
                correo: correo,
                rol: rol,
                activo: activo

            };


            if (password.trim()) {

                datos.password =
                    password;

            }


            const respuesta =
                await apiFetch(
                    `${API_URL}/usuarios/${usuarioEditandoId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                datos
                            )
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudieron guardar los cambios."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarUsuarios();


            editarUsuarioModal.hide();


            mostrarNotificacion(
                "Los cambios del usuario se guardaron correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al actualizar usuario:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* ELIMINAR USUARIO */

document.getElementById(
    "confirmarEliminarUsuario"
)?.addEventListener(
    "click",
    async function () {

        if (!usuarioEliminandoId) {

            mostrarNotificacion(
                "No se pudo identificar el usuario seleccionado.",
                "error"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Eliminando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/usuarios/${usuarioEliminandoId}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo eliminar el usuario."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarUsuarios();


            eliminarUsuarioModal.hide();


            usuarioEliminandoId =
                null;


            mostrarNotificacion(
                "El usuario se eliminó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al eliminar usuario:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* =========================================================
   9. CLIENTES
   ========================================================= */

/* CARGAR CLIENTES */

async function cargarClientes() {

    const contenedor =
        document.getElementById(
            "clientesGrid"
        );


    if (!contenedor) {
        return;
    }

    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/clientes/`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los clientes."
            );

        }


        const clientes =
            await respuesta.json();

        const totalClientes = document.getElementById("totalClientes");

        if (totalClientes) {
            totalClientes.textContent = clientes.length;
        }

        clientesActuales =
            clientes;


        contenedor.innerHTML = "";


        if (clientes.length === 0) {

            const mensaje =
                document.createElement("div");


            mensaje.className =
                "text-muted";


            mensaje.textContent =
                "No hay clientes registrados.";


            contenedor.appendChild(
                mensaje
            );


            return;
        }


        clientes.forEach(
            function (cliente) {

                const tarjeta =
                    document.createElement("div");


                tarjeta.className =
                    "entity-card";


                /*
                 * ICONO
                 */

                const icono =
                    document.createElement("div");


                icono.className =
                    "entity-card-icon";


                icono.innerHTML =
                    '<i class="bi bi-building"></i>';


                /*
                 * CONTENIDO
                 */

                const contenido =
                    document.createElement("div");


                contenido.className =
                    "entity-card-content";


                const nombre =
                    document.createElement("strong");


                nombre.textContent =
                    cliente.nombre;


                const ruc =
                    document.createElement("span");


                ruc.textContent =
                    cliente.ruc
                        ? "RUC: " +
                          cliente.ruc
                        : "RUC no registrado";


                const estado =
                    document.createElement("small");


                estado.textContent =
                    cliente.activo
                        ? "Activo"
                        : "Inactivo";


                contenido.append(
                    nombre,
                    ruc,
                    estado
                );


                /*
                 * ACCIONES
                 */

                const acciones =
                    document.createElement("div");


                acciones.className =
                    "client-actions";


                const boton =
                    document.createElement("button");


                boton.type =
                    "button";


                boton.className =
                    "table-action";


                boton.title =
                    "Opciones";


                boton.setAttribute(
                    "aria-label",
                    "Opciones de " +
                    cliente.nombre
                );


                boton.dataset.clienteId =
                    cliente.id;


                boton.innerHTML =
                    '<i class="bi bi-three-dots"></i>';


                const menu =
                    document.createElement("div");


                menu.className =
                    "client-actions-menu";


                const opcionVer =
                    document.createElement("button");


                opcionVer.type =
                    "button";


                opcionVer.className =
                    "client-menu-item";


                opcionVer.innerHTML =
                    '<i class="bi bi-eye"></i> Ver cliente';


                const opcionEditar =
                    document.createElement("button");


                opcionEditar.type =
                    "button";


                opcionEditar.className =
                    "client-menu-item";


                opcionEditar.innerHTML =
                    '<i class="bi bi-pencil"></i> Editar cliente';


                const opcionEliminar =
                    document.createElement("button");


                opcionEliminar.type =
                    "button";


                opcionEliminar.className =
                    "client-menu-item";


                opcionEliminar.innerHTML =
                    '<i class="bi bi-trash"></i> Eliminar cliente';


                menu.append(
                    opcionVer,
                    opcionEditar,
                    opcionEliminar
                );


                acciones.append(
                    boton,
                    menu
                );


                tarjeta.append(
                    icono,
                    contenido,
                    acciones
                );


                contenedor.appendChild(
                    tarjeta
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar clientes:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los clientes.",
            "error"
        );

    }

}


/* VALIDAR RUC */

document.getElementById(
    "clienteRuc"
)?.addEventListener(
    "input",
    function () {

        this.value =
            this.value
                .replace(/\D/g, "")
                .slice(0, 10);

    }
);


/* VALIDAR TELÉFONO */

document.getElementById(
    "clienteTelefono"
)?.addEventListener(
    "input",
    function () {

        this.value =
            this.value
                .replace(/\D/g, "");

    }
);


/* GUARDAR CLIENTE */

document.getElementById(
    "btnGuardarCliente"
)?.addEventListener(
    "click",
    async function () {

        const nombre =
            document.getElementById(
                "clienteNombre"
            ).value.trim();


        const ruc =
            document.getElementById(
                "clienteRuc"
            ).value.trim();


        const contacto =
            document.getElementById(
                "clienteContacto"
            ).value.trim();


        const telefono =
            document.getElementById(
                "clienteTelefono"
            ).value.trim();


        const correo =
            document.getElementById(
                "clienteCorreo"
            ).value.trim();


        const estado =
            document.getElementById(
                "clienteEstado"
            ).value;


        if (!nombre) {

            mostrarNotificacion(
                "Ingresa el nombre del cliente.",
                "warning"
            );

            return;
        }


        if (
            ruc &&
            ruc.length !== 10
        ) {

            mostrarNotificacion(
                "El RUC debe tener exactamente 10 dígitos.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Guardando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/clientes/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            nombre: nombre,

                            ruc:
                                ruc ||
                                null,

                            contacto:
                                contacto ||
                                null,

                            telefono:
                                telefono ||
                                null,

                            correo:
                                correo ||
                                null,

                            activo:
                                estado ===
                                "activo"

                        })
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo registrar el cliente."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarClientes();


            limpiarCampos([
                "clienteNombre",
                "clienteRuc",
                "clienteContacto",
                "clienteTelefono",
                "clienteCorreo"
            ]);


            document.getElementById(
                "clienteEstado"
            ).value =
                "activo";


            nuevoClienteModal.hide();


            mostrarNotificacion(
                "El cliente se registró correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al registrar cliente:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* ACTUALIZAR CLIENTE */

document.getElementById(
    "btnActualizarCliente"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "editarClienteModal"
            );


        const clienteId =
            modal.dataset.clienteId;


        const nombre =
            document.getElementById(
                "editarClienteNombre"
            ).value.trim();


        const ruc =
            document.getElementById(
                "editarClienteRuc"
            ).value.trim();


        const contacto =
            document.getElementById(
                "editarClienteContacto"
            ).value.trim();


        const telefono =
            document.getElementById(
                "editarClienteTelefono"
            ).value.trim();


        const correo =
            document.getElementById(
                "editarClienteCorreo"
            ).value.trim();


        const estado =
            document.getElementById(
                "editarClienteEstado"
            ).value;


        if (!clienteId) {

            mostrarNotificacion(
                "No se pudo identificar el cliente.",
                "error"
            );

            return;
        }


        if (!nombre) {

            mostrarNotificacion(
                "Ingresa el nombre del cliente.",
                "warning"
            );

            return;
        }


        if (
            ruc &&
            ruc.length !== 10
        ) {

            mostrarNotificacion(
                "El RUC debe tener exactamente 10 dígitos.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Actualizando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/clientes/${clienteId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            nombre: nombre,

                            ruc:
                                ruc ||
                                null,

                            contacto:
                                contacto ||
                                null,

                            telefono:
                                telefono ||
                                null,

                            correo:
                                correo ||
                                null,

                            activo:
                                estado ===
                                "activo"

                        })
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo actualizar el cliente."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarClientes();


            editarClienteModal.hide();


            mostrarNotificacion(
                "El cliente se actualizó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al actualizar cliente:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* VALIDAR RUC DE EDICIÓN */

document.getElementById(
    "editarClienteRuc"
)?.addEventListener(
    "input",
    function () {

        this.value =
            this.value
                .replace(/\D/g, "")
                .slice(0, 10);

    }
);


/* VALIDAR TELÉFONO DE EDICIÓN */

document.getElementById(
    "editarClienteTelefono"
)?.addEventListener(
    "input",
    function () {

        this.value =
            this.value
                .replace(/\D/g, "");

    }
);


/* MENÚ DE ACCIONES DE CLIENTES */

document.getElementById(
    "clientesGrid"
)?.addEventListener(
    "click",
    function (evento) {

        /*
         * BOTÓN DE TRES PUNTOS
         */

        const boton =
            evento.target.closest(
                ".table-action"
            );


        if (boton) {

            evento.stopPropagation();


            const acciones =
                boton.closest(
                    ".client-actions"
                );


            if (!acciones) {
                return;
            }


            const menu =
                acciones.querySelector(
                    ".client-actions-menu"
                );


            if (!menu) {
                return;
            }


            /*
             * CERRAR OTROS MENÚS
             */

            document
                .querySelectorAll(
                    ".client-actions-menu.show"
                )
                .forEach(
                    function (otroMenu) {

                        if (
                            otroMenu !==
                            menu
                        ) {

                            otroMenu.classList.remove(
                                "show"
                            );


                            otroMenu.classList.remove(
                                "open-up"
                            );


                            const otraTarjeta =
                                otroMenu.closest(
                                    ".entity-card"
                                );


                            if (otraTarjeta) {

                                otraTarjeta.classList.remove(
                                    "menu-abierto"
                                );

                            }

                        }

                    }
                );


            /*
             * COMPROBAR SI YA ESTABA ABIERTO
             */

            const estabaAbierto =
                menu.classList.contains(
                    "show"
                );


            if (estabaAbierto) {

                menu.classList.remove(
                    "show"
                );


                menu.classList.remove(
                    "open-up"
                );


                const tarjeta =
                    menu.closest(
                        ".entity-card"
                    );


                if (tarjeta) {

                    tarjeta.classList.remove(
                        "menu-abierto"
                    );

                }


                return;
            }


            /*
             * MOSTRAR MENÚ
             */

            menu.classList.add(
                "show"
            );


            const tarjeta =
                menu.closest(
                    ".entity-card"
                );


            if (tarjeta) {

                tarjeta.classList.add(
                    "menu-abierto"
                );

            }


            /*
             * DETECTAR DIRECCIÓN
             */

            const rectBoton =
                boton.getBoundingClientRect();


            const alturaMenu =
                menu.offsetHeight;


            const anchoMenu =
                menu.offsetWidth;


            const espacioAbajo =
                window.innerHeight -
                rectBoton.bottom;


            const espacioArriba =
                rectBoton.top;


            const separacion =
                6;


            let abrirArriba =
                false;


            if (
                espacioAbajo <
                    alturaMenu +
                    separacion &&
                espacioArriba >
                    espacioAbajo
            ) {

                abrirArriba =
                    true;

            }


            /*
             * POSICIÓN VERTICAL
             */

            let posicionTop;


            if (abrirArriba) {

                posicionTop =
                    rectBoton.top -
                    alturaMenu -
                    separacion;

            } else {

                posicionTop =
                    rectBoton.bottom +
                    separacion;

            }


            /*
             * POSICIÓN HORIZONTAL
             */

            let posicionLeft =
                rectBoton.right -
                anchoMenu;


            if (
                posicionLeft +
                    anchoMenu >
                window.innerWidth -
                    10
            ) {

                posicionLeft =
                    window.innerWidth -
                    anchoMenu -
                    10;

            }


            if (
                posicionLeft <
                10
            ) {

                posicionLeft =
                    10;

            }


            menu.style.top =
                posicionTop +
                "px";


            menu.style.left =
                posicionLeft +
                "px";


            return;
        }


        /*
         * OPCIONES DEL MENÚ
         */

        const opcion =
            evento.target.closest(
                ".client-menu-item"
            );


        if (!opcion) {
            return;
        }


        evento.stopPropagation();


        const menu =
            opcion.closest(
                ".client-actions-menu"
            );


        if (menu) {

            menu.classList.remove(
                "show"
            );


            menu.classList.remove(
                "open-up"
            );


            const tarjeta =
                menu.closest(
                    ".entity-card"
                );


            if (tarjeta) {

                tarjeta.classList.remove(
                    "menu-abierto"
                );

            }

        }


        const acciones =
            opcion.closest(
                ".client-actions"
            );


        if (!acciones) {
            return;
        }


        const botonPrincipal =
            acciones.querySelector(
                ".table-action"
            );


        if (!botonPrincipal) {
            return;
        }


        const clienteId =
            botonPrincipal.dataset.clienteId;


        if (!clienteId) {
            return;
        }


        const cliente =
            clientesActuales.find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(clienteId)
                    );

                }
            );


        if (!cliente) {

            mostrarNotificacion(
                "No se pudo encontrar la información del cliente.",
                "error"
            );

            return;
        }


        /*
         * VER CLIENTE
         */

        if (
            opcion ===
            opcion.parentElement?.querySelector(
                ".client-menu-item:first-child"
            )
        ) {

            document.getElementById(
                "verClienteNombre"
            ).textContent =
                cliente.nombre ||
                "Nombre no registrado";


            document.getElementById(
                "verClienteRuc"
            ).textContent =
                cliente.ruc ||
                "RUC no registrado";


            document.getElementById(
                "verClienteContacto"
            ).textContent =
                cliente.contacto ||
                "Contacto no registrado";


            document.getElementById(
                "verClienteTelefono"
            ).textContent =
                cliente.telefono ||
                "Teléfono no registrado";


            document.getElementById(
                "verClienteCorreo"
            ).textContent =
                cliente.correo ||
                "Correo no registrado";


            document.getElementById(
                "verClienteEstado"
            ).textContent =
                cliente.activo
                    ? "Activo"
                    : "Inactivo";


            verClienteModal.show();

        }


        /*
         * EDITAR CLIENTE
         */

        if (
            opcion ===
            opcion.parentElement?.querySelector(
                ".client-menu-item:nth-child(2)"
            )
        ) {

            document.getElementById(
                "editarClienteNombre"
            ).value =
                cliente.nombre ||
                "";


            document.getElementById(
                "editarClienteRuc"
            ).value =
                cliente.ruc ||
                "";


            document.getElementById(
                "editarClienteContacto"
            ).value =
                cliente.contacto ||
                "";


            document.getElementById(
                "editarClienteTelefono"
            ).value =
                cliente.telefono ||
                "";


            document.getElementById(
                "editarClienteCorreo"
            ).value =
                cliente.correo ||
                "";


            document.getElementById(
                "editarClienteEstado"
            ).value =
                cliente.activo
                    ? "activo"
                    : "inactivo";


            document.getElementById(
                "editarClienteModal"
            ).dataset.clienteId =
                cliente.id;


            editarClienteModal.show();

        }


        /*
         * ELIMINAR CLIENTE
         */

        if (
            opcion ===
            opcion.parentElement?.querySelector(
                ".client-menu-item:nth-child(3)"
            )
        ) {

            clienteEliminandoId =
                cliente.id;


            document.getElementById(
                "eliminarClienteMensaje"
            ).textContent =
                'Se eliminará el cliente "' +
                cliente.nombre +
                '". Esta acción no se puede deshacer.';


            eliminarClienteModal.show();

        }

    }
);


/* CONFIRMAR ELIMINACIÓN DE CLIENTE */

document.getElementById(
    "btnConfirmarEliminarCliente"
)?.addEventListener(
    "click",
    async function () {

        if (!clienteEliminandoId) {

            mostrarNotificacion(
                "No se pudo identificar el cliente.",
                "error"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Eliminando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/clientes/${clienteEliminandoId}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo eliminar el cliente."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarClientes();


            eliminarClienteModal.hide();


            clienteEliminandoId =
                null;


            mostrarNotificacion(
                "El cliente se eliminó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al eliminar cliente:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* CERRAR MENÚ AL HACER CLICK FUERA */

document.addEventListener(
    "click",
    function (evento) {

        if (
            !evento.target.closest(
                ".client-actions"
            )
        ) {

            document
                .querySelectorAll(
                    ".client-actions-menu.show"
                )
                .forEach(
                    function (menu) {

                        menu.classList.remove(
                            "show"
                        );


                        menu.classList.remove(
                            "open-up"
                        );


                        const tarjeta =
                            menu.closest(
                                ".entity-card"
                            );


                        if (tarjeta) {

                            tarjeta.classList.remove(
                                "menu-abierto"
                            );

                        }

                    }
                );

        }

    }
);


/* =========================================================
   10. LIMPIEZA DE MODALES
   ========================================================= */

/* NUEVO USUARIO */

document.getElementById(
    "btnNuevoUsuario"
)?.addEventListener(
    "click",
    function () {

        nuevoUsuarioModal.show();

    }
);


document.getElementById(
    "nuevoUsuarioModal"
)?.addEventListener(
    "hidden.bs.modal",
    function () {

        limpiarCampos([
            "usuarioNombre",
            "usuarioApellido",
            "usuarioCorreo",
            "usuarioRol",
            "usuarioPassword"
        ]);

    }
);


/* NUEVO CLIENTE */

document.getElementById(
    "btnNuevoCliente"
)?.addEventListener(
    "click",
    function () {

        limpiarCampos([
            "clienteNombre",
            "clienteRuc",
            "clienteContacto",
            "clienteTelefono",
            "clienteCorreo"
        ]);


        document.getElementById(
            "clienteEstado"
        ).value =
            "activo";


        nuevoClienteModal.show();

    }
);

/* =========================================================
   PROYECTOS - SITES - SUBPROYECTOS
   ========================================================= */
    /* =========================================================
   FLECHAS DESPLEGABLES
   PROYECTOS, SITES Y SUBPROYECTOS
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        /*
         * =============================================
         * FLECHA DE PROYECTO
         * =============================================
         */

        const botonProyecto =
            event.target.closest(
                ".project-toggle"
            );

        if (botonProyecto) {

            const proyecto =
                botonProyecto.closest(
                    ".project-item"
                );

            if (!proyecto) {
                return;
            }

            const sites =
                proyecto.querySelector(
                    ".project-sites"
                );

            const icono =
                botonProyecto.querySelector(
                    "i"
                );

            if (!sites) {
                return;
            }

            const estaOculto =
                sites.style.display === "none";

            if (estaOculto) {

                sites.style.display =
                    "";

                botonProyecto.title =
                    "Ocultar sites";

                botonProyecto.setAttribute(
                    "aria-label",
                    "Ocultar sites"
                );

                botonProyecto.setAttribute(
                    "aria-expanded",
                    "true"
                );

                if (icono) {
                    icono.className =
                        "bi bi-chevron-up";
                }

            } else {

                sites.style.display =
                    "none";

                botonProyecto.title =
                    "Mostrar sites";

                botonProyecto.setAttribute(
                    "aria-label",
                    "Mostrar sites"
                );

                botonProyecto.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (icono) {
                    icono.className =
                        "bi bi-chevron-down";
                }

            }

            return;
        }


        /*
         * =============================================
         * FLECHA DE SITE
         * =============================================
         */

        const botonSite =
            event.target.closest(
                ".site-toggle"
            );

        if (botonSite) {

            const site =
                botonSite.closest(
                    ".site-item"
                );

            if (!site) {
                return;
            }

            const subproyectos =
                site.querySelector(
                    ".subproject-list"
                );

            const icono =
                botonSite.querySelector(
                    "i"
                );

            if (!subproyectos) {
                return;
            }

            const estaOculto =
                subproyectos.style.display === "none";

            if (estaOculto) {

                subproyectos.style.display =
                    "";

                botonSite.title =
                    "Ocultar subproyectos";

                botonSite.setAttribute(
                    "aria-label",
                    "Ocultar subproyectos"
                );

                botonSite.setAttribute(
                    "aria-expanded",
                    "true"
                );

                if (icono) {
                    icono.className =
                        "bi bi-chevron-up";
                }

            } else {

                subproyectos.style.display =
                    "none";

                botonSite.title =
                    "Mostrar subproyectos";

                botonSite.setAttribute(
                    "aria-label",
                    "Mostrar subproyectos"
                );

                botonSite.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (icono) {
                    icono.className =
                        "bi bi-chevron-down";
                }

            }

            return;
        }


        /*
         * =============================================
         * FLECHA DE CLIENTE
         * =============================================
         *
         * La dejamos funcionando también porque
         * actualmente ya existe en la interfaz.
         */

        const botonCliente =
            event.target.closest(
                ".client-toggle"
            );

        if (botonCliente) {

            const tarjetaCliente =
                botonCliente.closest(
                    ".client-project-card"
                );

            if (!tarjetaCliente) {
                return;
            }

            const proyectos =
                tarjetaCliente.querySelector(
                    ".client-project-body"
                );

            const icono =
                botonCliente.querySelector(
                    "i"
                );

            if (!proyectos) {
                return;
            }

            const estaOculto =
                proyectos.style.display === "none";

            if (estaOculto) {

                proyectos.style.display =
                    "";

                botonCliente.title =
                    "Ocultar proyectos";

                botonCliente.setAttribute(
                    "aria-label",
                    "Ocultar proyectos"
                );

                botonCliente.setAttribute(
                    "aria-expanded",
                    "true"
                );

                if (icono) {
                    icono.className =
                        "bi bi-chevron-up";
                }

            } else {

                proyectos.style.display =
                    "none";

                botonCliente.title =
                    "Mostrar proyectos";

                botonCliente.setAttribute(
                    "aria-label",
                    "Mostrar proyectos"
                );

                botonCliente.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (icono) {
                    icono.className =
                        "bi bi-chevron-down";
                }

            }

        }

    }
);

/* =========================================================
   11. PROYECTOS
   ========================================================= */

/* CARGAR CLIENTES EN SELECT DE PROYECTO */

async function cargarClientesEnSelectProyecto() {

    const select =
        document.getElementById(
            "proyectoCliente"
        );


    if (!select) {
        return;
    }


    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/clientes/activos`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los clientes."
            );

        }


        const clientes =
            await respuesta.json();


        select.innerHTML = "";


        const opcionInicial =
            document.createElement("option");


        opcionInicial.value =
            "";


        opcionInicial.textContent =
            "Seleccionar cliente";


        opcionInicial.disabled =
            true;


        opcionInicial.selected =
            true;


        select.appendChild(
            opcionInicial
        );


        clientes.forEach(
            function (cliente) {

                const opcion =
                    document.createElement("option");


                opcion.value =
                    cliente.id;


                opcion.textContent =
                    cliente.nombre;


                select.appendChild(
                    opcion
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar clientes:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los clientes.",
            "error"
        );

    }

}


/* NUEVO PROYECTO */

document.getElementById(
    "btnNuevoProyecto"
)?.addEventListener(
    "click",
    async function () {

        await cargarClientesEnSelectProyecto();


        document.getElementById(
            "proyectoCliente"
        ).value =
            "";


        document.getElementById(
            "proyectoNombre"
        ).value =
            "";


        document.getElementById(
            "proyectoDescripcion"
        ).value =
            "";


        document.getElementById(
            "proyectoEstado"
        ).value =
            "activo";


        nuevoProyectoModal.show();

    }
);


/* NUEVO PROYECTO DESDE CLIENTE */

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                ".btnNuevoProyectoCliente"
            );


        if (!button) {
            return;
        }


        await cargarClientesEnSelectProyecto();


        const clienteId =
            button.dataset.clientId ||
            "";


        const clienteSelect =
            document.getElementById(
                "proyectoCliente"
            );


        clienteSelect.value =
            clienteId;


        document.getElementById(
            "proyectoNombre"
        ).value =
            "";


        document.getElementById(
            "proyectoDescripcion"
        ).value =
            "";


        document.getElementById(
            "proyectoEstado"
        ).value =
            "activo";


        nuevoProyectoModal.show();

    }
);


/* GUARDAR PROYECTO */

document.getElementById(
    "guardarProyecto"
)?.addEventListener(
    "click",
    async function () {

        const clienteId =
            document.getElementById(
                "proyectoCliente"
            ).value;


        const nombre =
            document.getElementById(
                "proyectoNombre"
            ).value.trim();


        const descripcion =
            document.getElementById(
                "proyectoDescripcion"
            ).value.trim();


        const estado =
            document.getElementById(
                "proyectoEstado"
            ).value;


        if (!clienteId) {

            mostrarNotificacion(
                "Selecciona un cliente para el proyecto.",
                "warning"
            );

            return;
        }


        if (!nombre) {

            mostrarNotificacion(
                "Ingresa el nombre del proyecto.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Guardando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/proyectos/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            cliente_id:
                                Number(
                                    clienteId
                                ),

                            nombre:
                                nombre,

                            descripcion:
                                descripcion ||
                                null,

                            /*
                             * Las fechas se mantienen
                             * únicamente en edición.
                             */

                            fecha_inicio:
                                null,

                            fecha_fin:
                                null,

                            estado:
                                estado

                        })
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo registrar el proyecto."
                    );


                throw new Error(
                    mensaje
                );

            }


            await cargarProyectos();


            limpiarCampos([
                "proyectoNombre",
                "proyectoDescripcion"
            ]);


            document.getElementById(
                "proyectoCliente"
            ).value =
                "";


            document.getElementById(
                "proyectoEstado"
            ).value =
                "activo";


            nuevoProyectoModal.hide();


            mostrarNotificacion(
                "El proyecto se registró correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al registrar proyecto:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo conectar con el servidor.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* CARGAR CLIENTES PARA EDITAR PROYECTO */

async function cargarClientesEnSelectEditarProyecto() {

    const select =
        document.getElementById(
            "editarProyectoCliente"
        );


    if (!select) {
        return;
    }


    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/clientes/`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los clientes."
            );

        }


        const clientes =
            await respuesta.json();


        select.innerHTML = "";


        const opcionInicial =
            document.createElement("option");


        opcionInicial.value =
            "";


        opcionInicial.textContent =
            "Seleccionar cliente";


        opcionInicial.disabled =
            true;


        select.appendChild(
            opcionInicial
        );


        clientes.forEach(
            function (cliente) {

                const opcion =
                    document.createElement("option");


                opcion.value =
                    cliente.id;


                opcion.textContent =
                    cliente.nombre;


                select.appendChild(
                    opcion
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar clientes para editar proyecto:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los clientes.",
            "error"
        );

    }

}


/* EDITAR PROYECTO */

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                ".btnEditarProyecto"
            );


        if (!button) {
            return;
        }


        const proyectoId =
            button.dataset.projectId;


        if (!proyectoId) {

            mostrarNotificacion(
                "No se identificó el proyecto.",
                "error"
            );

            return;
        }


        try {

            await cargarClientesEnSelectEditarProyecto();


            const respuesta =
                await apiFetch(
                    `${API_URL}/proyectos/${proyectoId}`
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo cargar el proyecto."
                    );


                throw new Error(
                    mensaje
                );

            }


            const proyecto =
                await respuesta.json();


            /*
             * CARGAR DATOS
             */

            document.getElementById(
                "editarProyectoCliente"
            ).value =
                proyecto.cliente_id;


            document.getElementById(
                "editarProyectoNombre"
            ).value =
                proyecto.nombre ||
                "";


            document.getElementById(
                "editarProyectoDescripcion"
            ).value =
                proyecto.descripcion ||
                "";


            document.getElementById(
                "editarProyectoFechaInicio"
            ).value =
                proyecto.fecha_inicio ||
                "";


            document.getElementById(
                "editarProyectoFechaFin"
            ).value =
                proyecto.fecha_fin ||
                "";


            document.getElementById(
                "editarProyectoEstado"
            ).value =
                proyecto.estado ||
                "activo";


            /*
             * GUARDAR ID
             */

            const modal =
                document.getElementById(
                    "editarProyectoModal"
                );


            modal.dataset.projectId =
                proyecto.id;


            editarProyectoModal.show();

        } catch (error) {

            console.error(
                "Error al cargar proyecto para editar:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo cargar la información del proyecto.",
                "error"
            );

        }

    }
);


/* ACTUALIZAR PROYECTO */

document.getElementById(
    "actualizarProyecto"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "editarProyectoModal"
            );


        const proyectoId =
            modal.dataset.projectId;


        const clienteId =
            document.getElementById(
                "editarProyectoCliente"
            ).value;


        const nombre =
            document.getElementById(
                "editarProyectoNombre"
            ).value.trim();


        const descripcion =
            document.getElementById(
                "editarProyectoDescripcion"
            ).value.trim();


        const fechaInicio =
            document.getElementById(
                "editarProyectoFechaInicio"
            ).value;


        const fechaFin =
            document.getElementById(
                "editarProyectoFechaFin"
            ).value;


        const estado =
            document.getElementById(
                "editarProyectoEstado"
            ).value;


        if (!proyectoId) {

            mostrarNotificacion(
                "No se identificó el proyecto.",
                "error"
            );

            return;
        }


        if (!clienteId) {

            mostrarNotificacion(
                "Selecciona un cliente.",
                "warning"
            );

            return;
        }


        if (!nombre) {

            mostrarNotificacion(
                "Ingresa el nombre del proyecto.",
                "warning"
            );

            return;
        }


        if (
            fechaInicio &&
            fechaFin &&
            fechaFin < fechaInicio
        ) {

            mostrarNotificacion(
                "La fecha de fin no puede ser anterior a la fecha de inicio.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Actualizando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/proyectos/${proyectoId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            cliente_id:
                                Number(
                                    clienteId
                                ),

                            nombre:
                                nombre,

                            descripcion:
                                descripcion ||
                                null,

                            fecha_inicio:
                                fechaInicio ||
                                null,

                            fecha_fin:
                                fechaFin ||
                                null,

                            estado:
                                estado

                        })
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo actualizar el proyecto."
                    );


                throw new Error(
                    mensaje
                );

            }


            editarProyectoModal.hide();


            await cargarProyectos();


            mostrarNotificacion(
                "El proyecto se actualizó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al actualizar proyecto:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo actualizar el proyecto.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* =========================================================
   12. PROYECTOS Y SITES
   ========================================================= */

/*
 * Carga la estructura:
 *
 * Cliente
 *   └── Proyecto
 *        └── Site
 *
 * Se mantiene la estructura visual existente.
 */

async function cargarProyectos() {

    const contenedor =
        document.querySelector(
            "#panel-proyectos .client-project-list"
        );


    if (!contenedor) {
        return;
    }

    /*
     * GUARDAR ESTADO DE LAS FLECHAS ABIERTAS
     */

    const clientesAbiertos =
        new Set();

    const proyectosAbiertos =
        new Set();

    const sitesAbiertos =
        new Set();

    contenedor.querySelectorAll(
        ".client-toggle[aria-expanded='true']"
    ).forEach(
        function (boton) {

            const tarjeta =
                boton.closest(
                    ".client-project-card"
                );

            if (tarjeta?.dataset.clientId) {

                clientesAbiertos.add(
                    tarjeta.dataset.clientId
                );

            }

        }
    );


    contenedor.querySelectorAll(
        ".project-toggle[aria-expanded='true']"
    ).forEach(
        function (boton) {

            const proyecto =
                boton.closest(
                    ".project-item"
                );

            if (proyecto?.dataset.projectId) {

                proyectosAbiertos.add(
                    proyecto.dataset.projectId
                );

            }

        }
    );


    contenedor.querySelectorAll(
        ".site-toggle[aria-expanded='true']"
    ).forEach(
        function (boton) {

            const site =
                boton.closest(
                    ".site-item"
                );

            if (site?.dataset.siteId) {

                sitesAbiertos.add(
                    site.dataset.siteId
                );

            }

        }
    );

    try {

        /*
         * CARGAR CLIENTES, PROYECTOS Y SITES
         */

        const [
            respuestaClientes,
            respuestaProyectos,
            respuestaSites,
            respuestaSubproyectos
        ] = await Promise.all([

            apiFetch(
                `${API_URL}/clientes/`
            ),

            apiFetch(
                `${API_URL}/proyectos/`
            ),

            apiFetch(
                `${API_URL}/sites/`
            ),

            apiFetch(
                `${API_URL}/subproyectos/`
            )

        ]);


        /*
         * VALIDAR RESPUESTAS
         */

        if (!respuestaClientes.ok) {

            throw new Error(
                "No se pudieron cargar los clientes."
            );

        }


        if (!respuestaProyectos.ok) {

            throw new Error(
                "No se pudieron cargar los proyectos."
            );

        }


        if (!respuestaSites.ok) {

            throw new Error(
                "No se pudieron cargar los sites."
            );

        }

        if (!respuestaSubproyectos.ok) {

            throw new Error(
                "No se pudieron cargar los subproyectos."
            );

        }


        /*
         * OBTENER DATOS
         */

        const clientes =
            await respuestaClientes.json();


        const proyectos =
            await respuestaProyectos.json();


        const sites =
            await respuestaSites.json();


        const subproyectos =
            await respuestaSubproyectos.json();


        /*
         * LIMPIAR CONTENEDOR
         */

        contenedor.innerHTML =
            "";


        /*
         * SI NO HAY PROYECTOS
         */

        if (
            proyectos.length === 0
        ) {

            const mensaje =
                document.createElement("div");


            mensaje.className =
                "text-muted";


            mensaje.textContent =
                "No hay proyectos registrados.";


            contenedor.appendChild(
                mensaje
            );


            return;
        }


        /*
         * AGRUPAR PROYECTOS POR CLIENTE
         */

        const proyectosPorCliente =
            {};


        proyectos.forEach(
            function (proyecto) {

                if (
                    !proyectosPorCliente[
                        proyecto.cliente_id
                    ]
                ) {

                    proyectosPorCliente[
                        proyecto.cliente_id
                    ] = [];

                }


                proyectosPorCliente[
                    proyecto.cliente_id
                ].push(
                    proyecto
                );

            }
        );


        /*
         * AGRUPAR SITES POR PROYECTO
         */

        const sitesPorProyecto =
            {};


        sites.forEach(
            function (site) {

                if (
                    !sitesPorProyecto[
                        site.proyecto_id
                    ]
                ) {

                    sitesPorProyecto[
                        site.proyecto_id
                    ] = [];

                }


                sitesPorProyecto[
                    site.proyecto_id
                ].push(
                    site
                );

            }
        );


        /*
         * AGRUPAR SUBPROYECTOS POR SITE
         */

        const subproyectosPorSite = {};

        subproyectos.forEach(function (subproyecto) {

            if (!subproyectosPorSite[subproyecto.site_id]) {
                subproyectosPorSite[subproyecto.site_id] = [];
            }

            subproyectosPorSite[subproyecto.site_id].push(
                subproyecto
            );

        });


        /*
         * MOSTRAR CLIENTES
         */

        clientes.forEach(
            function (cliente) {

                const proyectosCliente =
                    proyectosPorCliente[
                        cliente.id
                    ] || [];


                /*
                 * SOLO CLIENTES CON PROYECTOS
                 */

                if (
                    proyectosCliente.length === 0
                ) {

                    return;

                }


                /*
                 * =====================================
                 * CLIENTE
                 * =====================================
                 */

                const tarjetaCliente =
                    document.createElement(
                        "article"
                    );


                tarjetaCliente.className =
                    "client-project-card";

                tarjetaCliente.dataset.clientId =
                    cliente.id;


                /*
                 * CABECERA CLIENTE
                 */

                const cabecera =
                    document.createElement(
                        "div"
                    );


                cabecera.className =
                    "client-project-header";


                const principal =
                    document.createElement(
                        "div"
                    );


                principal.className =
                    "client-project-main";


                const icono =
                    document.createElement(
                        "div"
                    );


                icono.className =
                    "client-project-icon";


                icono.innerHTML =
                    '<i class="bi bi-building"></i>';


                const informacion =
                    document.createElement(
                        "div"
                    );


                const nombreCliente =
                    document.createElement(
                        "strong"
                    );


                nombreCliente.textContent =
                    cliente.nombre;


                /*
                 * CONTAR SITES
                 */

                let cantidadSitesCliente =
                    0;


                proyectosCliente.forEach(
                    function (proyecto) {

                        cantidadSitesCliente +=
                            (
                                sitesPorProyecto[
                                    proyecto.id
                                ] || []
                            ).length;

                    }
                );


                const resumenCliente =
                    document.createElement(
                        "span"
                    );


                resumenCliente.textContent =
                    proyectosCliente.length +
                    (
                        proyectosCliente.length === 1
                            ? " proyecto"
                            : " proyectos"
                    ) +
                    " · " +
                    cantidadSitesCliente +
                    (
                        cantidadSitesCliente === 1
                            ? " site"
                            : " sites"
                    );


                informacion.append(
                    nombreCliente,
                    resumenCliente
                );


                principal.append(
                    icono,
                    informacion
                );


                /*
                 * ACCIONES CLIENTE
                 */

                const accionesCliente =
                    document.createElement(
                        "div"
                    );


                accionesCliente.className =
                    "client-project-actions";


                const estadoCliente =
                    document.createElement(
                        "span"
                    );


                estadoCliente.className =
                    cliente.activo
                        ? "status-badge success"
                        : "status-badge neutral";


                estadoCliente.textContent =
                    cliente.activo
                        ? "Activo"
                        : "Inactivo";


                const botonNuevoProyecto =
                    document.createElement(
                        "button"
                    );


                botonNuevoProyecto.type =
                    "button";


                botonNuevoProyecto.className =
                    "btn btn-outline-primary btn-sm btnNuevoProyectoCliente";


                botonNuevoProyecto.dataset.clientId =
                    cliente.id;


                botonNuevoProyecto.dataset.client =
                    cliente.nombre;


                botonNuevoProyecto.innerHTML =
                    '<i class="bi bi-plus-lg"></i> Proyecto';


                const botonToggleCliente =
                    document.createElement(
                        "button"
                    );


                botonToggleCliente.type =
                    "button";


                botonToggleCliente.className =
                    "btn-icon client-toggle";


                botonToggleCliente.title =
                    "Mostrar proyectos";


                botonToggleCliente.setAttribute(
                    "aria-label",
                    "Mostrar proyectos"
                );

                botonToggleCliente.setAttribute(
                    "aria-expanded",
                    "false"
                );

                botonToggleCliente.innerHTML =
                    '<i class="bi bi-chevron-down"></i>';


                accionesCliente.append(
                    estadoCliente,
                    botonNuevoProyecto,
                    botonToggleCliente
                );


                cabecera.append(
                    principal,
                    accionesCliente
                );


                /*
                 * CUERPO CLIENTE
                 */

                const cuerpo =
                    document.createElement(
                        "div"
                    );


                cuerpo.className =
                    "client-project-body";

                cuerpo.style.display =
                    "none";


                /*
                 * =====================================
                 * PROYECTOS
                 * =====================================
                 */

                proyectosCliente.forEach(
                    function (proyecto) {

                        const sitesProyecto =
                            sitesPorProyecto[
                                proyecto.id
                            ] || [];


                        const proyectoElemento =
                            document.createElement(
                                "article"
                            );


                        proyectoElemento.className =
                            "project-item";

                        proyectoElemento.dataset.projectId =
                            proyecto.id;


                        /*
                         * CABECERA PROYECTO
                         */

                        const cabeceraProyecto =
                            document.createElement(
                                "div"
                            );


                        cabeceraProyecto.className =
                            "project-item-header";


                        const principalProyecto =
                            document.createElement(
                                "div"
                            );


                        principalProyecto.className =
                            "project-item-main";


                        const iconoProyecto =
                            document.createElement(
                                "div"
                            );


                        iconoProyecto.className =
                            "project-item-icon";


                        iconoProyecto.innerHTML =
                            '<i class="bi bi-folder2"></i>';


                        const informacionProyecto =
                            document.createElement(
                                "div"
                            );


                        const nombreProyecto =
                            document.createElement(
                                "strong"
                            );


                        nombreProyecto.textContent =
                            proyecto.nombre;


                        const resumenProyecto =
                            document.createElement(
                                "span"
                            );


                        resumenProyecto.textContent =
                            sitesProyecto.length +
                            (
                                sitesProyecto.length === 1
                                    ? " site"
                                    : " sites"
                            );


                        informacionProyecto.append(
                            nombreProyecto,
                            resumenProyecto
                        );


                        principalProyecto.append(
                            iconoProyecto,
                            informacionProyecto
                        );


                        /*
                         * ACCIONES PROYECTO
                         */

                        const accionesProyecto =
                            document.createElement(
                                "div"
                            );


                        accionesProyecto.className =
                            "project-item-actions";


                        const estadoProyecto =
                            document.createElement(
                                "span"
                            );


                        if (
                            proyecto.estado ===
                            "activo"
                        ) {

                            estadoProyecto.className =
                                "status-badge success";


                            estadoProyecto.textContent =
                                "Activo";

                        } else {

                            estadoProyecto.className =
                                "status-badge neutral";


                            estadoProyecto.textContent =
                                "Cerrado";

                        }


                        /*
                         * NUEVO SITE
                         */

                        const botonNuevoSite =
                            document.createElement(
                                "button"
                            );


                        botonNuevoSite.type =
                            "button";


                        botonNuevoSite.className =
                            "btn btn-outline-primary btn-sm btnNuevoSite";


                        botonNuevoSite.dataset.clientId =
                            cliente.id;


                        botonNuevoSite.dataset.client =
                            cliente.nombre;


                        botonNuevoSite.dataset.projectId =
                            proyecto.id;


                        botonNuevoSite.dataset.project =
                            proyecto.nombre;


                        botonNuevoSite.innerHTML =
                            '<i class="bi bi-plus-lg"></i> Site';


                        /*
                         * EDITAR PROYECTO
                         */

                        const botonEditar =
                            document.createElement(
                                "button"
                            );


                        botonEditar.type =
                            "button";


                        botonEditar.className =
                            "btn-icon btnEditarProyecto";


                        botonEditar.title =
                            "Editar proyecto";


                        botonEditar.setAttribute(
                            "aria-label",
                            "Editar proyecto"
                        );


                        botonEditar.dataset.projectId =
                            proyecto.id;


                        botonEditar.innerHTML =
                            '<i class="bi bi-pencil"></i>';


                        /*
                         * ELIMINAR PROYECTO
                         */

                        const botonEliminar =
                            document.createElement(
                                "button"
                            );


                        botonEliminar.type =
                            "button";


                        botonEliminar.className =
                            "btn-icon btnEliminarProyecto";


                        botonEliminar.title =
                            "Eliminar proyecto";


                        botonEliminar.setAttribute(
                            "aria-label",
                            "Eliminar proyecto"
                        );


                        botonEliminar.dataset.projectId =
                            proyecto.id;


                        botonEliminar.innerHTML =
                            '<i class="bi bi-trash"></i>';


                        /*
                         * TOGGLE PROYECTO
                         */

                        const botonToggleProyecto =
                            document.createElement("button");

                        botonToggleProyecto.type =
                            "button";

                        botonToggleProyecto.className =
                            "btn-icon project-toggle";

                        botonToggleProyecto.title =
                            "Mostrar sites";

                        botonToggleProyecto.setAttribute(
                            "aria-label",
                            "Mostrar sites"
                        );

                        botonToggleProyecto.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                        botonToggleProyecto.innerHTML =
                            '<i class="bi bi-chevron-down"></i>';


                        accionesProyecto.append(
                            estadoProyecto,
                            botonNuevoSite,
                            botonEditar,
                            botonEliminar,
                            botonToggleProyecto
                        );


                        cabeceraProyecto.append(
                            principalProyecto,
                            accionesProyecto
                        );


                        /*
                         * CONTENEDOR DE SITES
                         */

                        const sitesContenedor =
                            document.createElement(
                                "div"
                            );


                        sitesContenedor.className =
                            "project-sites";

                        sitesContenedor.style.display =
                            "none";


                        /*
                         * SIN SITES
                         */

                        if (
                            sitesProyecto.length === 0
                        ) {

                            const mensajeSites =
                                document.createElement(
                                    "div"
                                );


                            mensajeSites.className =
                                "text-muted";


                            mensajeSites.style.padding =
                                "12px 0";


                            mensajeSites.textContent =
                                "No hay sites registrados en este proyecto.";


                            sitesContenedor.appendChild(
                                mensajeSites
                            );

                        } else {

                            /*
                             * SITES
                             */

                            sitesProyecto.forEach(
                                function (site) {

                                    const siteElemento =
                                        document.createElement(
                                            "div"
                                        );


                                    siteElemento.className =
                                        "site-item";

                                    siteElemento.dataset.siteId =
                                        site.id;


                                    /*
                                     * CABECERA SITE
                                     */

                                    const siteHeader =
                                        document.createElement(
                                            "div"
                                        );


                                    siteHeader.className =
                                        "site-header";


                                    /*
                                     * INFORMACIÓN SITE
                                     */

                                    const siteMainInfo =
                                        document.createElement(
                                            "div"
                                        );


                                    siteMainInfo.className =
                                        "site-main-info";


                                    const siteIcon =
                                        document.createElement(
                                            "div"
                                        );


                                    siteIcon.className =
                                        "site-icon";


                                    siteIcon.innerHTML =
                                        '<i class="bi bi-geo-alt"></i>';


                                    const informacionSite =
                                        document.createElement(
                                            "div"
                                        );


                                    const nombreSite =
                                        document.createElement(
                                            "strong"
                                        );


                                    nombreSite.textContent =
                                        site.nombre;


                                    /*
                                     * UBICACIÓN
                                     */

                                    const ubicacionSite =
                                        document.createElement(
                                            "span"
                                        );


                                    const partesUbicacion =
                                        [];


                                    if (
                                        site.departamento
                                    ) {

                                        partesUbicacion.push(
                                            site.departamento
                                        );

                                    }


                                    if (
                                        site.distrito
                                    ) {

                                        partesUbicacion.push(
                                            site.distrito
                                        );

                                    }


                                    if (
                                        partesUbicacion.length >
                                        0
                                    ) {

                                        ubicacionSite.textContent =
                                            partesUbicacion.join(
                                                " · "
                                            );

                                    } else if (
                                        site.direccion
                                    ) {

                                        ubicacionSite.textContent =
                                            site.direccion;

                                    } else {

                                        ubicacionSite.textContent =
                                            "Ubicación no registrada";

                                    }


                                    informacionSite.append(
                                        nombreSite,
                                        ubicacionSite
                                    );


                                    siteMainInfo.append(
                                        siteIcon,
                                        informacionSite
                                    );


                                    /*
                                     * ACCIONES SITE
                                     */

                                    const siteActions =
                                        document.createElement(
                                            "div"
                                        );


                                    siteActions.className =
                                        "site-actions";


                                    /*
                                     * CONTADOR SUBPROYECTOS
                                     */

                                    const siteCounter =
                                        document.createElement(
                                            "span"
                                        );


                                    siteCounter.className =
                                        "site-counter";


                                    siteCounter.textContent =
                                        "0 subproyectos";

                                    /*
                                     * ESTADO SITE
                                     */

                                    const estadoSite =
                                        document.createElement("span");

                                    estadoSite.className =
                                        site.estado
                                            ? "status-badge success"
                                            : "status-badge neutral";

                                    estadoSite.textContent =
                                        site.estado
                                            ? "Activo"
                                            : "Inactivo";


                                    /*
                                     * EDITAR SITE
                                     *
                                     * El botón se conserva.
                                     * Su flujo se conectará cuando
                                     * implementemos el modal de edición.
                                     */

                                    const botonEditarSite =
                                        document.createElement(
                                            "button"
                                        );


                                    botonEditarSite.type =
                                        "button";


                                    botonEditarSite.className =
                                        "btn-icon btnEditarSite";


                                    botonEditarSite.title =
                                        "Editar site";


                                    botonEditarSite.setAttribute(
                                        "aria-label",
                                        "Editar site"
                                    );


                                    botonEditarSite.dataset.siteId =
                                        site.id;


                                    botonEditarSite.dataset.client =
                                        cliente.nombre;


                                    botonEditarSite.dataset.project =
                                        proyecto.nombre;


                                    botonEditarSite.dataset.site =
                                        site.nombre;


                                    botonEditarSite.dataset.location =
                                        partesUbicacion.join(
                                            " · "
                                        );


                                    botonEditarSite.innerHTML =
                                        '<i class="bi bi-pencil"></i>';


                                    /*
                                     * ELIMINAR SITE
                                     */

                                    const botonEliminarSite =
                                        document.createElement(
                                            "button"
                                        );


                                    botonEliminarSite.type =
                                        "button";


                                    botonEliminarSite.className =
                                        "btn-icon btnEliminarSite";


                                    botonEliminarSite.title =
                                        "Eliminar site";


                                    botonEliminarSite.setAttribute(
                                        "aria-label",
                                        "Eliminar site"
                                    );


                                    botonEliminarSite.dataset.siteId =
                                        site.id;


                                    botonEliminarSite.dataset.client =
                                        cliente.nombre;


                                    botonEliminarSite.dataset.project =
                                        proyecto.nombre;


                                    botonEliminarSite.dataset.site =
                                        site.nombre;


                                    botonEliminarSite.innerHTML =
                                        '<i class="bi bi-trash"></i>';


                                    /*
                                     * NUEVO SUBPROYECTO
                                     */

                                    const botonNuevoSubproyecto =
                                        document.createElement(
                                            "button"
                                        );


                                    botonNuevoSubproyecto.type =
                                        "button";


                                    botonNuevoSubproyecto.className =
                                        "btn btn-outline-primary btn-sm btnNuevoSubproyecto";


                                    botonNuevoSubproyecto.dataset.client =
                                        cliente.nombre;


                                    botonNuevoSubproyecto.dataset.project =
                                        proyecto.nombre;


                                    botonNuevoSubproyecto.dataset.site =
                                        site.nombre;


                                    botonNuevoSubproyecto.dataset.siteId =
                                        site.id;


                                    botonNuevoSubproyecto.innerHTML =
                                        '<i class="bi bi-plus-lg"></i> Subproyecto';


                                    /*
                                     * TOGGLE SITE
                                     */

                                    const botonToggleSite =
                                        document.createElement("button");

                                    botonToggleSite.type =
                                        "button";

                                    botonToggleSite.className =
                                        "btn-icon site-toggle";

                                    botonToggleSite.title =
                                        "Mostrar subproyectos";

                                    botonToggleSite.setAttribute(
                                        "aria-label",
                                        "Mostrar subproyectos"
                                    );

                                    botonToggleSite.setAttribute(
                                        "aria-expanded",
                                        "false"
                                    );

                                    botonToggleSite.innerHTML =
                                        '<i class="bi bi-chevron-down"></i>';


                                    /*
                                     * ARMAR ACCIONES
                                     */

                                    siteActions.append(
                                        siteCounter,
                                        estadoSite,
                                        botonEditarSite,
                                        botonEliminarSite,
                                        botonNuevoSubproyecto,
                                        botonToggleSite
                                    );


                                    /*
                                     * ARMAR CABECERA
                                     */

                                    siteHeader.append(
                                        siteMainInfo,
                                        siteActions
                                    );


                                    /*
                                     * LISTA SUBPROYECTOS
                                     */

                                    const subprojectList =
                                        document.createElement("div");

                                    subprojectList.className =
                                        "subproject-list";

                                    subprojectList.style.display =
                                        "none";

                                    /*
                                    * OBTENER SUBPROYECTOS DEL SITE
                                    */

                                    const subproyectosSite =
                                        subproyectosPorSite[site.id] || [];

                                    /*
                                    * ACTUALIZAR CONTADOR
                                    */

                                    siteCounter.textContent =
                                        `${subproyectosSite.length} ${
                                            subproyectosSite.length === 1
                                                ? "subproyecto"
                                                : "subproyectos"
                                        }`;

                                    /*
                                    * MOSTRAR MENSAJE SI NO HAY SUBPROYECTOS
                                    */

                                    if (subproyectosSite.length === 0) {

                                        const mensajeSubproyectos =
                                            document.createElement("div");

                                        mensajeSubproyectos.className =
                                            "text-muted";

                                        mensajeSubproyectos.style.padding =
                                            "8px 13px";

                                        mensajeSubproyectos.textContent =
                                            "No hay subproyectos registrados.";

                                        subprojectList.appendChild(
                                            mensajeSubproyectos
                                        );

                                    } else {

                                        /*
                                        * MOSTRAR SUBPROYECTOS REGISTRADOS
                                        */

                                        subproyectosSite.forEach(function (subproyecto) {

                                            const subprojectItem =
                                                document.createElement("div");

                                            subprojectItem.className =
                                                "subproject-item";

                                            subprojectItem.dataset.subprojectId =
                                                subproyecto.id;

                                            /*
                                            * ICONO
                                            */

                                            const subprojectIcon =
                                                document.createElement("div");

                                            subprojectIcon.className =
                                                "subproject-icon";

                                            subprojectIcon.innerHTML =
                                                '<i class="bi bi-diagram-3"></i>';

                                            /*
                                            * INFORMACIÓN DEL SUBPROYECTO
                                            */

                                            const subprojectInfo =
                                                document.createElement("div");

                                            subprojectInfo.className =
                                                "subproject-info";

                                            const nombreSubproyecto =
                                                document.createElement("strong");

                                            nombreSubproyecto.textContent =
                                                subproyecto.nombre;

                                            const alcancesSubproyecto =
                                                document.createElement("span");

                                            alcancesSubproyecto.textContent =
                                                (subproyecto.alcances || [])
                                                    .map(function (alcance) {
                                                        return alcance.nombre;
                                                    })
                                                    .join(" · ") ||
                                                "Sin alcances registrados";

                                            subprojectInfo.append(
                                                nombreSubproyecto,
                                                alcancesSubproyecto
                                            );

                                            /*
                                            * ACCIONES DEL SUBPROYECTO
                                            */

                                            const subprojectActions =
                                                document.createElement("div");

                                            subprojectActions.className =
                                                "subproject-actions";

                                            /*
                                            * ESTADO
                                            */

                                            const estadoSubproyecto =
                                                document.createElement("span");

                                            estadoSubproyecto.className =
                                                subproyecto.estado
                                                    ? "status-badge success"
                                                    : "status-badge neutral";

                                            estadoSubproyecto.textContent =
                                                subproyecto.estado
                                                    ? "Activo"
                                                    : "Inactivo";

                                            /*
                                            * EDITAR SUBPROYECTO
                                            */

                                            const botonEditarSubproyecto =
                                                document.createElement("button");

                                            botonEditarSubproyecto.type =
                                                "button";

                                            botonEditarSubproyecto.className =
                                                "btn-icon btnEditarSubproyecto";

                                            botonEditarSubproyecto.title =
                                                "Editar subproyecto";

                                            botonEditarSubproyecto.setAttribute(
                                                "aria-label",
                                                "Editar subproyecto"
                                            );

                                            botonEditarSubproyecto.dataset.subprojectId =
                                                subproyecto.id;

                                            botonEditarSubproyecto.innerHTML =
                                                '<i class="bi bi-pencil"></i>';

                                            /*
                                            * ELIMINAR SUBPROYECTO
                                            */

                                            const botonEliminarSubproyecto =
                                                document.createElement("button");

                                            botonEliminarSubproyecto.type =
                                                "button";

                                            botonEliminarSubproyecto.className =
                                                "btn-icon btnEliminarSubproyecto";

                                            botonEliminarSubproyecto.title =
                                                "Eliminar subproyecto";

                                            botonEliminarSubproyecto.setAttribute(
                                                "aria-label",
                                                "Eliminar subproyecto"
                                            );

                                            botonEliminarSubproyecto.dataset.subprojectId =
                                                subproyecto.id;

                                            botonEliminarSubproyecto.dataset.subproject =
                                                subproyecto.nombre;

                                            botonEliminarSubproyecto.innerHTML =
                                                '<i class="bi bi-trash"></i>';

                                            /*
                                            * ARMAR ACCIONES
                                            */

                                            subprojectActions.append(
                                                estadoSubproyecto,
                                                botonEditarSubproyecto,
                                                botonEliminarSubproyecto
                                            );

                                            /*
                                            * ARMAR SUBPROYECTO
                                            */

                                            subprojectItem.append(
                                                subprojectIcon,
                                                subprojectInfo,
                                                subprojectActions
                                            );

                                            subprojectList.appendChild(
                                                subprojectItem
                                            );

                                        });


                                    }


                                    /*
                                     * ARMAR SITE
                                     */

                                    siteElemento.append(
                                        siteHeader,
                                        subprojectList
                                    );


                                    sitesContenedor.appendChild(
                                        siteElemento
                                    );

                                }
                            );

                        }


                        /*
                         * ARMAR PROYECTO
                         */

                        proyectoElemento.append(
                            cabeceraProyecto,
                            sitesContenedor
                        );


                        cuerpo.appendChild(
                            proyectoElemento
                        );

                    }
                );


                /*
                 * ARMAR CLIENTE
                 */

                tarjetaCliente.append(
                    cabecera,
                    cuerpo
                );

                contenedor.appendChild(
                    tarjetaCliente
                );

            }
        );


        /*
         * =========================================================
         * RESTAURAR CLIENTES ABIERTOS
         * =========================================================
         */

        contenedor.querySelectorAll(
            ".client-project-card"
        ).forEach(function (tarjeta) {

            if (
                !clientesAbiertos.has(
                    String(tarjeta.dataset.clientId)
                )
            ) {
                return;
            }

            const cuerpoCliente =
                tarjeta.querySelector(".client-project-body");

            const boton =
                tarjeta.querySelector(".client-toggle");

            if (!cuerpoCliente || !boton) {
                return;
            }

            cuerpoCliente.style.display = "";

            boton.title = "Ocultar proyectos";
            boton.setAttribute("aria-label", "Ocultar proyectos");
            boton.setAttribute("aria-expanded", "true");

            const icono = boton.querySelector("i");

            if (icono) {
                icono.className = "bi bi-chevron-up";
            }

        });


        /*
         * =========================================================
         * RESTAURAR PROYECTOS ABIERTOS
         * =========================================================
         */

        contenedor.querySelectorAll(
            ".project-item"
        ).forEach(function (proyecto) {

            if (
                !proyectosAbiertos.has(
                    String(proyecto.dataset.projectId)
                )
            ) {
                return;
            }

            const sites =
                proyecto.querySelector(".project-sites");

            const boton =
                proyecto.querySelector(".project-toggle");

            if (!sites || !boton) {
                return;
            }

            sites.style.display = "";

            boton.title = "Ocultar sites";
            boton.setAttribute("aria-label", "Ocultar sites");
            boton.setAttribute("aria-expanded", "true");

            const icono = boton.querySelector("i");

            if (icono) {
                icono.className = "bi bi-chevron-up";
            }

        });


        /*
         * =========================================================
         * RESTAURAR SITES ABIERTOS
         * =========================================================
         */

        contenedor.querySelectorAll(
            ".site-item"
        ).forEach(function (site) {

            if (
                !sitesAbiertos.has(
                    String(site.dataset.siteId)
                )
            ) {
                return;
            }

            const subproyectos =
                site.querySelector(".subproject-list");

            const boton =
                site.querySelector(".site-toggle");

            if (!subproyectos || !boton) {
                return;
            }

            subproyectos.style.display = "";

            boton.title = "Ocultar subproyectos";
            boton.setAttribute("aria-label", "Ocultar subproyectos");
            boton.setAttribute("aria-expanded", "true");

            const icono = boton.querySelector("i");

            if (icono) {
                icono.className = "bi bi-chevron-up";
            }

        });


    } catch (error) {

        console.error(
            "Error al cargar proyectos y sites:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los proyectos y sites.",
            "error"
        );

    }

}


/* ELIMINAR PROYECTO */

document.addEventListener(
    "click",
    function (event) {

        const boton =
            event.target.closest(
                ".btnEliminarProyecto"
            );

        if (!boton) {
            return;
        }


        const proyectoId =
            boton.dataset.projectId;


        if (!proyectoId) {

            mostrarNotificacion(
                "No se identificó el proyecto.",
                "error"
            );

            return;
        }


        const proyecto =
            boton.closest(
                ".project-item"
            );


        const nombreProyecto =
            proyecto
                ?.querySelector(
                    ".project-item-main strong"
                )
                ?.textContent
                .trim() ||
            "este proyecto";


        /*
         * CONTAR SITES DEL PROYECTO
         */

        const cantidadSites =
            proyecto
                ?.querySelectorAll(
                    ".site-item"
                )
                ?.length || 0;


        /*
         * SI TIENE SITES
         */

        if (
            cantidadSites > 0
        ) {

            mostrarNotificacion(
                `No se puede eliminar el proyecto "${nombreProyecto}" porque tiene ${cantidadSites} ${cantidadSites === 1 ? "site asociado" : "sites asociados"}. Gestiona primero los sites del proyecto.`,
                "warning",
                "No se puede eliminar el proyecto"
            );

            return;
        }


        /*
         * ABRIR CONFIRMACIÓN
         */

        document.getElementById(
            "eliminarProyectoMensaje"
        ).textContent =
            `Esta acción eliminará el proyecto "${nombreProyecto}".`;


        const modal =
            document.getElementById(
                "eliminarProyectoModal"
            );


        modal.dataset.projectId =
            proyectoId;


        eliminarProyectoModal.show();

    }
);

/* CONFIRMAR ELIMINACIÓN DE PROYECTO */

document.getElementById(
    "btnConfirmarEliminarProyecto"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "eliminarProyectoModal"
            );

        const proyectoId =
            modal.dataset.projectId;

        if (!proyectoId) {

            mostrarNotificacion(
                "No se identificó el proyecto.",
                "error"
            );

            return;
        }

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Eliminando..."
            );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/proyectos/${proyectoId}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!respuesta.ok) {

                let resultado = null;

                try {
                    resultado =
                        await respuesta.json();
                } catch (error) {
                    resultado = null;
                }

                throw new Error(
                    resultado?.detail ||
                    "No se pudo eliminar el proyecto."
                );
            }


            eliminarProyectoModal.hide();


            await cargarProyectos();


            mostrarNotificacion(
                "El proyecto se eliminó correctamente.",
                "success"
            );


            delete modal.dataset.projectId;


        } catch (error) {

            console.error(
                "Error al eliminar proyecto:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo eliminar el proyecto.",
                "error"
            );


        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);


/* =========================================================
   13. SITES
   ========================================================= */

/* CARGAR CLIENTES */

async function cargarClientesEnSelectSite() {

    const select =
        document.getElementById(
            "siteCliente"
        );


    if (!select) {
        return;
    }


    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/clientes/activos`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los clientes."
            );

        }


        const clientes =
            await respuesta.json();


        select.innerHTML =
            "";


        const opcionInicial =
            document.createElement(
                "option"
            );


        opcionInicial.value =
            "";


        opcionInicial.textContent =
            "Seleccionar cliente";


        opcionInicial.disabled =
            true;


        opcionInicial.selected =
            true;


        select.appendChild(
            opcionInicial
        );


        clientes.forEach(
            function (cliente) {

                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    cliente.id;


                opcion.textContent =
                    cliente.nombre;


                select.appendChild(
                    opcion
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar clientes para site:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los clientes.",
            "error"
        );

    }

}


/* CARGAR PROYECTOS DEL CLIENTE */

async function cargarProyectosEnSelectSite(
    clienteId
) {

    const select =
        document.getElementById(
            "siteProyecto"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        "";


    if (!clienteId) {

        const opcion =
            document.createElement(
                "option"
            );


        opcion.value =
            "";


        opcion.textContent =
            "Selecciona primero un cliente";


        select.appendChild(
            opcion
        );


        select.disabled =
            true;


        return;
    }


    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/proyectos/cliente/${clienteId}`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los proyectos."
            );

        }


        const proyectos =
            await respuesta.json();


        const proyectosActivos =
            proyectos.filter(
                function (proyecto) {

                    return (
                        proyecto.estado ===
                        "activo"
                    );

                }
            );


        if (
            proyectosActivos.length === 0
        ) {

            const opcion =
                document.createElement(
                    "option"
                );


            opcion.value =
                "";


            opcion.textContent =
                "Este cliente no tiene proyectos activos";


            select.appendChild(
                opcion
            );


            select.disabled =
                true;


            return;
        }


        const opcionInicial =
            document.createElement(
                "option"
            );


        opcionInicial.value =
            "";


        opcionInicial.textContent =
            "Seleccionar proyecto";


        opcionInicial.disabled =
            true;


        opcionInicial.selected =
            true;


        select.appendChild(
            opcionInicial
        );


        proyectosActivos.forEach(
            function (proyecto) {

                const opcion =
                    document.createElement(
                        "option"
                    );


                opcion.value =
                    proyecto.id;


                opcion.textContent =
                    proyecto.nombre;


                select.appendChild(
                    opcion
                );

            }
        );


        select.disabled =
            false;

    } catch (error) {

        console.error(
            "Error al cargar proyectos para site:",
            error
        );


        select.disabled =
            true;


        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los proyectos.",
            "error"
        );

    }

}


/* CAMBIO DE CLIENTE */

document.getElementById(
    "siteCliente"
)?.addEventListener(
    "change",
    async function () {

        await cargarProyectosEnSelectSite(
            this.value
        );

    }
);


/* ABRIR MODAL DESDE PROYECTO */

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                ".btnNuevoSite"
            );


        if (!button) {
            return;
        }


        const clienteId =
            button.dataset.clientId ||
            "";


        const proyectoId =
            button.dataset.projectId ||
            "";


        await cargarClientesEnSelectSite();


        const clienteSelect =
            document.getElementById(
                "siteCliente"
            );


        clienteSelect.value =
            clienteId;


        await cargarProyectosEnSelectSite(
            clienteId
        );


        const proyectoSelect =
            document.getElementById(
                "siteProyecto"
            );


        proyectoSelect.value =
            proyectoId;


        limpiarCampos([
            "siteNombre",
            "siteDireccion",
            "siteDepartamento",
            "siteProvincia",
            "siteDistrito"
        ]);


        document.getElementById(
            "siteEstado"
        ).value =
            "activo";


        nuevoSiteModal.show();

    }
);


/* CREAR SITE */

document.getElementById(
    "guardarSite"
)?.addEventListener(
    "click",
    async function () {

        const proyectoId =
            document.getElementById(
                "siteProyecto"
            ).value;


        const nombre =
            document.getElementById(
                "siteNombre"
            ).value.trim();


        const direccion =
            document.getElementById(
                "siteDireccion"
            ).value.trim();


        const departamento =
            document.getElementById(
                "siteDepartamento"
            ).value.trim();


        const provincia =
            document.getElementById(
                "siteProvincia"
            ).value.trim();


        const distrito =
            document.getElementById(
                "siteDistrito"
            ).value.trim();


        const estado =
            document.getElementById(
                "siteEstado"
            ).value;


        /*
         * VALIDACIONES
         */

        if (!proyectoId) {

            mostrarNotificacion(
                "Selecciona un proyecto para el site.",
                "warning"
            );

            return;
        }


        if (!nombre) {

            mostrarNotificacion(
                "Ingresa el código o nombre del site.",
                "warning"
            );

            return;
        }


        if (!direccion) {

            mostrarNotificacion(
                "Ingresa la dirección del site.",
                "warning"
            );

            return;
        }


        if (!departamento) {

            mostrarNotificacion(
                "Ingresa el departamento del site.",
                "warning"
            );

            return;
        }


        if (!provincia) {

            mostrarNotificacion(
                "Ingresa la provincia del site.",
                "warning"
            );

            return;
        }


        if (!distrito) {

            mostrarNotificacion(
                "Ingresa el distrito del site.",
                "warning"
            );

            return;
        }


        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Guardando..."
            );


        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/sites/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            proyecto_id:
                                Number(
                                    proyectoId
                                ),

                            nombre:
                                nombre,

                            direccion:
                                direccion,

                            departamento:
                                departamento,

                            provincia:
                                provincia,

                            distrito:
                                distrito,

                            estado:
                                estado ===
                                "activo"

                        })
                    }
                );


            if (!respuesta.ok) {

                const mensaje =
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo registrar el site."
                    );


                throw new Error(
                    mensaje
                );

            }


            nuevoSiteModal.hide();


            mostrarNotificacion(
                "El site se registró correctamente.",
                "success"
            );


            await cargarProyectos();

        } catch (error) {

            console.error(
                "Error al registrar site:",
                error
            );


            mostrarNotificacion(
                error.message ||
                "No se pudo registrar el site.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }

    }
);

/* CARGAR CLIENTES EN SELECT DE EDICIÓN DE SITE */
async function cargarClientesEnSelectEditarSite() {

    const select =
        document.getElementById(
            "editarSiteCliente"
        );

    if (!select) {
        return;
    }

    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/clientes/`
            );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar los clientes."
            );
        }

        const clientes =
            await respuesta.json();

        select.innerHTML = "";

        const opcionInicial =
            document.createElement("option");

        opcionInicial.value = "";
        opcionInicial.textContent =
            "Seleccionar cliente";

        opcionInicial.disabled = true;

        select.appendChild(
            opcionInicial
        );

        clientes.forEach(
            function (cliente) {

                const opcion =
                    document.createElement("option");

                opcion.value =
                    cliente.id;

                opcion.textContent =
                    cliente.nombre;

                select.appendChild(
                    opcion
                );
            }
        );

    } catch (error) {

        console.error(
            "Error al cargar clientes para editar site:",
            error
        );

        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los clientes.",
            "error"
        );
    }
}

/* Cargar proyectos del cliente en select de edición de Site */
async function cargarProyectosEnSelectEditarSite(
    clienteId,
    proyectoSeleccionadoId = null
) {

    const select =
        document.getElementById(
            "editarSiteProyecto"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    if (!clienteId) {

        const opcion =
            document.createElement("option");

        opcion.value = "";

        opcion.textContent =
            "Selecciona primero un cliente";

        select.appendChild(
            opcion
        );

        select.disabled = true;

        return;
    }

    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/proyectos/cliente/${clienteId}`
            );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar los proyectos."
            );
        }

        const proyectos =
            await respuesta.json();

        if (proyectos.length === 0) {

            const opcion =
                document.createElement("option");

            opcion.value = "";

            opcion.textContent =
                "No hay proyectos para este cliente";

            select.appendChild(
                opcion
            );

            select.disabled = true;

            return;
        }

        const opcionInicial =
            document.createElement("option");

        opcionInicial.value = "";

        opcionInicial.textContent =
            "Seleccionar proyecto";

        opcionInicial.disabled = true;

        select.appendChild(
            opcionInicial
        );

        proyectos.forEach(
            function (proyecto) {

                const opcion =
                    document.createElement("option");

                opcion.value =
                    proyecto.id;

                opcion.textContent =
                    proyecto.nombre;

                select.appendChild(
                    opcion
                );
            }
        );

        select.disabled = false;

        if (proyectoSeleccionadoId !== null) {

            select.value =
                String(
                    proyectoSeleccionadoId
                );
        }

    } catch (error) {

        console.error(
            "Error al cargar proyectos para editar site:",
            error
        );

        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los proyectos.",
            "error"
        );
    }
}

/* CAMBIO DE CLIENTE */
document.getElementById(
    "editarSiteCliente"
)?.addEventListener(
    "change",
    async function () {

        await cargarProyectosEnSelectEditarSite(
            this.value
        );
    }
);

/* EDITAR SITE */

document.addEventListener(
    "click",
    async function (event) {

        const boton =
            event.target.closest(
                ".btnEditarSite"
            );

        if (!boton) {
            return;
        }

        const siteId =
            boton.dataset.siteId;

        if (!siteId) {
            mostrarNotificacion(
                "No se identificó el site.",
                "error"
            );
            return;
        }

        try {

            /* =============================================
               OBTENER INFORMACIÓN DEL SITE
               ============================================= */

            const respuestaSite =
                await apiFetch(
                    `${API_URL}/sites/${siteId}`
                );

            if (!respuestaSite.ok) {

                let resultado = null;

                try {
                    resultado =
                        await respuestaSite.json();
                } catch (error) {
                    resultado = null;
                }

                throw new Error(
                    resultado?.detail ||
                    "No se pudo cargar el site."
                );
            }

            const site =
                await respuestaSite.json();

            /* =============================================
               OBTENER INFORMACIÓN DEL PROYECTO
               ============================================= */

            const respuestaProyecto =
                await apiFetch(
                    `${API_URL}/proyectos/${site.proyecto_id}`
                );

            if (!respuestaProyecto.ok) {
                throw new Error(
                    "No se pudo identificar el proyecto del site."
                );
            }

            const proyecto =
                await respuestaProyecto.json();

            /* =============================================
               CARGAR CLIENTES Y PROYECTOS
               ============================================= */

            await cargarClientesEnSelectEditarSite();

            const selectCliente =
                document.getElementById(
                    "editarSiteCliente"
                );

            selectCliente.value =
                String(proyecto.cliente_id);

            await cargarProyectosEnSelectEditarSite(
                proyecto.cliente_id,
                site.proyecto_id
            );

            /* =============================================
               CARGAR DATOS DEL SITE EN EL FORMULARIO
               ============================================= */

            document.getElementById(
                "editarSiteNombre"
            ).value =
                site.nombre || "";

            document.getElementById(
                "editarSiteDireccion"
            ).value =
                site.direccion || "";

            document.getElementById(
                "editarSiteDepartamento"
            ).value =
                site.departamento || "";

            document.getElementById(
                "editarSiteProvincia"
            ).value =
                site.provincia || "";

            document.getElementById(
                "editarSiteDistrito"
            ).value =
                site.distrito || "";

            document.getElementById(
                "editarSiteEstado"
            ).value =
                String(site.estado);

            /* =============================================
               GUARDAR ID Y MOSTRAR MODAL
               ============================================= */

            const modal =
                document.getElementById(
                    "editarSiteModal"
                );

            modal.dataset.siteId =
                site.id;

            editarSiteModal.show();

        } catch (error) {

            console.error(
                "Error al cargar site para editar:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo cargar la información del site.",
                "error"
            );
        }
    }
);

/* GUARDAR CAMBIOS DEL SITE */

document.getElementById(
    "actualizarSite"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "editarSiteModal"
            );

        const siteId =
            modal.dataset.siteId;

        const proyectoId =
            document.getElementById(
                "editarSiteProyecto"
            ).value;

        const nombre =
            document.getElementById(
                "editarSiteNombre"
            ).value.trim();

        const direccion =
            document.getElementById(
                "editarSiteDireccion"
            ).value.trim();

        const departamento =
            document.getElementById(
                "editarSiteDepartamento"
            ).value.trim();

        const provincia =
            document.getElementById(
                "editarSiteProvincia"
            ).value.trim();

        const distrito =
            document.getElementById(
                "editarSiteDistrito"
            ).value.trim();

        const estado =
            document.getElementById(
                "editarSiteEstado"
            ).value === "true";

        /* =============================================
           VALIDAR DATOS
           ============================================= */

        if (!siteId) {
            mostrarNotificacion(
                "No se identificó el site.",
                "error"
            );
            return;
        }

        if (!proyectoId) {
            mostrarNotificacion(
                "Selecciona un proyecto.",
                "warning"
            );
            return;
        }

        if (!nombre) {
            mostrarNotificacion(
                "Ingresa el código o nombre del site.",
                "warning"
            );
            return;
        }

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Actualizando..."
            );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/sites/${siteId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            proyecto_id:
                                Number(proyectoId),
                            nombre:
                                nombre,
                            direccion:
                                direccion || null,
                            departamento:
                                departamento || null,
                            provincia:
                                provincia || null,
                            distrito:
                                distrito || null,
                            estado:
                                estado
                        })
                    }
                );

            let resultado = null;

            try {
                resultado =
                    await respuesta.json();
            } catch (error) {
                resultado = null;
            }

            if (!respuesta.ok) {

                const detalle =
                    resultado?.detail;

                const mensaje =
                    Array.isArray(detalle)
                        ? detalle.map(
                            function (error) {
                                return error.msg;
                            }
                        ).join("\n")
                        : (
                            detalle ||
                            "No se pudo actualizar el site."
                        );

                throw new Error(mensaje);
            }

            editarSiteModal.hide();

            await cargarProyectos();

            mostrarNotificacion(
                "El site se actualizó correctamente.",
                "success"
            );

            delete modal.dataset.siteId;

        } catch (error) {

            console.error(
                "Error al actualizar site:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo actualizar el site.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }
    }
);

/* ELIMINAR SITE */

document.addEventListener(
    "click",
    function (event) {

        const boton =
            event.target.closest(
                ".btnEliminarSite"
            );

        if (!boton) {
            return;
        }

        const siteId =
            boton.dataset.siteId;

        if (!siteId) {
            mostrarNotificacion(
                "No se identificó el site.",
                "error"
            );
            return;
        }

        const siteItem =
            boton.closest(".site-item");

        const nombreSite =
            siteItem
                ?.querySelector(".site-main-info strong")
                ?.textContent
                .trim() ||
            boton.dataset.site ||
            "este site";

        /*
         * VERIFICAR SUBPROYECTOS ASOCIADOS
         */
        const cantidadSubproyectos =
            siteItem
                ?.querySelectorAll(".subproject-item")
                ?.length || 0;

        if (cantidadSubproyectos > 0) {
            mostrarNotificacion(
                `No se puede eliminar el site "${nombreSite}" porque tiene ${cantidadSubproyectos} ${cantidadSubproyectos === 1 ? "subproyecto asociado" : "subproyectos asociados"}. Gestiona primero los subproyectos del site.`,
                "warning",
                "No se puede eliminar el site"
            );
            return;
        }

        /*
         * PREPARAR CONFIRMACIÓN
         */
        document.getElementById(
            "eliminarSiteMensaje"
        ).textContent =
            `Esta acción eliminará el site "${nombreSite}".`;

        const modal =
            document.getElementById(
                "eliminarSiteModal"
            );

        modal.dataset.siteId =
            siteId;

        eliminarSiteModal.show();
    }
);

/* CONFIRMAR ELIMINACIÓN DE SITE */
document.getElementById(
    "btnConfirmarEliminarSite"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "eliminarSiteModal"
            );

        const siteId =
            modal.dataset.siteId;

        if (!siteId) {
            mostrarNotificacion(
                "No se identificó el site.",
                "error"
            );
            return;
        }

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Eliminando..."
            );

        try {

            /* =============================================
               ELIMINAR SITE EN EL BACKEND
               ============================================= */

            const respuesta =
                await apiFetch(
                    `${API_URL}/sites/${siteId}`,
                    {
                        method: "DELETE"
                    }
                );

            if (!respuesta.ok) {

                let resultado = null;

                try {
                    resultado =
                        await respuesta.json();
                } catch (error) {
                    resultado = null;
                }

                throw new Error(
                    resultado?.detail ||
                    "No se pudo eliminar el site."
                );
            }

            /* =============================================
               ACTUALIZAR INTERFAZ
               ============================================= */

            eliminarSiteModal.hide();

            await cargarProyectos();

            mostrarNotificacion(
                "El site se eliminó correctamente.",
                "success"
            );

            delete modal.dataset.siteId;

        } catch (error) {

            console.error(
                "Error al eliminar site:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo eliminar el site.",
                "error"
            );

        } finally {
            finalizarCargaBoton(
                boton,
                estadoBoton
            );
        }
    }
);


/* =========================================================
   14. SUBPROYECTOS
   ========================================================= */

/* CARGAR ALCANCES ACTIVOS */
async function cargarAlcancesSubproyecto() {
    const contenedor = document.getElementById("subproyectoAlcances");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    try {
        const respuesta = await apiFetch(`${API_URL}/alcances/`);

        if (!respuesta.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuesta,
                    "No se pudieron cargar los alcances."
                )
            );
        }

        const alcances = await respuesta.json();
        const alcancesActivos = alcances.filter(
            function (alcance) {
                return alcance.activo === true;
            }
        );

        if (alcancesActivos.length === 0) {
            const mensaje = document.createElement("div");
            mensaje.className = "text-muted";
            mensaje.textContent = "No hay alcances activos disponibles.";
            contenedor.appendChild(mensaje);
            return;
        }

        alcancesActivos.forEach(function (alcance) {
            /* TARJETA SELECCIONABLE */
            const tarjeta = document.createElement("label");
            tarjeta.className = "scope-option";

            const casilla = document.createElement("input");
            casilla.type = "checkbox";
            casilla.name = "subprojectScope";
            casilla.value = alcance.id;

            /* ICONO */
            const icono = document.createElement("span");
            icono.className = "scope-option-icon";
            icono.innerHTML = '<i class="bi bi-diagram-3"></i>';

            /* INFORMACIÓN */
            const contenido = document.createElement("span");
            contenido.className = "scope-option-content";

            const nombre = document.createElement("strong");
            nombre.textContent = alcance.nombre;

            const descripcion = document.createElement("small");
            descripcion.textContent =
                alcance.descripcion ||
                "Sin descripción registrada.";

            contenido.append(nombre, descripcion);

            tarjeta.append(casilla, icono, contenido);
            contenedor.appendChild(tarjeta);
        });
    } catch (error) {
        console.error(
            "Error al cargar alcances del subproyecto:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudieron cargar los alcances.",
            "error"
        );

        throw error;
    }
}


/* ABRIR MODAL NUEVO SUBPROYECTO */

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                ".btnNuevoSubproyecto"
            );

        if (!button) {
            return;
        }

        const siteId =
            button.dataset.siteId;

        if (!siteId) {
            mostrarNotificacion(
                "No se identificó el Site.",
                "error"
            );
            return;
        }

        const modal =
            document.getElementById(
                "nuevoSubproyectoModal"
            );

        modal.dataset.siteId = siteId;

        document.getElementById(
            "subproyectoCliente"
        ).textContent =
            button.dataset.client || "-";

        document.getElementById(
            "subproyectoProyecto"
        ).textContent =
            button.dataset.project || "-";

        document.getElementById(
            "subproyectoSite"
        ).textContent =
            button.dataset.site || "-";

        document.getElementById(
            "subproyectoNombre"
        ).value = "";

        try {

            await cargarAlcancesSubproyecto();

            nuevoSubproyectoModal.show();

        } catch (error) {
            // Se muestra el error en cargarAlcancesSubproyecto.
        }
    }
);


/* GUARDAR SUBPROYECTO */

document.getElementById(
    "guardarSubproyecto"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "nuevoSubproyectoModal"
            );

        const siteId =
            modal.dataset.siteId;

        const nombre =
            document.getElementById(
                "subproyectoNombre"
            ).value.trim();

        const alcancesIds =
            Array.from(
                modal.querySelectorAll(
                    "input[name='subprojectScope']:checked"
                )
            ).map(
                function (checkbox) {
                    return Number(checkbox.value);
                }
            );

        if (!siteId) {
            mostrarNotificacion(
                "No se identificó el Site.",
                "error"
            );
            return;
        }

        if (!nombre) {
            mostrarNotificacion(
                "Ingresa el nombre del subproyecto.",
                "warning"
            );
            return;
        }

        if (alcancesIds.length === 0) {
            mostrarNotificacion(
                "Selecciona al menos un alcance.",
                "warning"
            );
            return;
        }

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Guardando..."
            );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/subproyectos/`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            site_id: Number(siteId),
                            nombre: nombre,
                            descripcion: null,
                            alcances_ids: alcancesIds
                        })
                    }
                );

            if (!respuesta.ok) {
                throw new Error(
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo crear el subproyecto."
                    )
                );
            }

            await respuesta.json();

            nuevoSubproyectoModal.hide();

            await cargarProyectos();

            delete modal.dataset.siteId;

            mostrarNotificacion(
                "El subproyecto se creó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al crear subproyecto:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo crear el subproyecto.",
                "error"
            );

        } finally {
            finalizarCargaBoton(
                boton,
                estadoBoton
            );
        }
    }
);

/* EDITAR SUBPROYECTO */
async function cargarAlcancesSubproyectoEdicion(alcancesSeleccionados) {
    const contenedor = document.getElementById(
        "editarSubproyectoAlcances"
    );

    if (!contenedor) return;

    contenedor.innerHTML = "";

    const respuesta = await apiFetch(`${API_URL}/alcances/`);

    if (!respuesta.ok) {
        throw new Error(
            await obtenerMensajeError(
                respuesta,
                "No se pudieron cargar los alcances."
            )
        );
    }

    const alcances = await respuesta.json();

    const idsSeleccionados = new Set(
        alcancesSeleccionados.map(function (alcance) {
            return Number(alcance.id);
        })
    );

    const alcancesDisponibles = alcances.filter(function (alcance) {
        return alcance.activo === true ||
            idsSeleccionados.has(Number(alcance.id));
    });

    if (alcancesDisponibles.length === 0) {
        const mensaje = document.createElement("div");
        mensaje.className = "text-muted";
        mensaje.textContent = "No hay alcances disponibles.";
        contenedor.appendChild(mensaje);
        return;
    }

    alcancesDisponibles.forEach(function (alcance) {
        const tarjeta = document.createElement("label");
        tarjeta.className = "scope-option";

        const casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.name = "editarSubprojectScope";
        casilla.value = alcance.id;
        casilla.checked = idsSeleccionados.has(Number(alcance.id));

        const icono = document.createElement("span");
        icono.className = "scope-option-icon";
        icono.innerHTML = '<i class="bi bi-diagram-3"></i>';

        const contenido = document.createElement("span");
        contenido.className = "scope-option-content";

        const nombre = document.createElement("strong");
        nombre.textContent = alcance.nombre;

        const descripcion = document.createElement("small");
        descripcion.textContent =
            alcance.descripcion || "Sin descripción registrada.";

        contenido.append(nombre, descripcion);
        tarjeta.append(casilla, icono, contenido);

        contenedor.appendChild(tarjeta);
    });
}


/* ABRIR MODAL EDITAR SUBPROYECTO */
document.addEventListener("click", async function (event) {
    const boton = event.target.closest(".btnEditarSubproyecto");

    if (!boton) return;

    const subproyectoId = boton.dataset.subprojectId;

    if (!subproyectoId) {
        mostrarNotificacion(
            "No se identificó el subproyecto.",
            "error"
        );
        return;
    }

    boton.disabled = true;

    try {
        const respuesta = await apiFetch(
            `${API_URL}/subproyectos/${subproyectoId}`
        );

        if (!respuesta.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuesta,
                    "No se pudo obtener el subproyecto."
                )
            );
        }

        const subproyecto = await respuesta.json();

        await cargarAlcancesSubproyectoEdicion(
            subproyecto.alcances || []
        );

        subproyectoEditandoId = subproyecto.id;

        document.getElementById(
            "editarSubproyectoNombre"
        ).value = subproyecto.nombre || "";

        document.getElementById(
            "editarSubproyectoEstado"
        ).value = String(subproyecto.estado);

        editarSubproyectoModal.show();

    } catch (error) {
        console.error(
            "Error al cargar el subproyecto:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo cargar el subproyecto.",
            "error"
        );

    } finally {
        boton.disabled = false;
    }
});


/* GUARDAR CAMBIOS DEL SUBPROYECTO */
document.getElementById(
    "guardarEdicionSubproyecto"
)?.addEventListener("click", async function () {
    if (!subproyectoEditandoId) {
        mostrarNotificacion(
            "No se identificó el subproyecto.",
            "error"
        );
        return;
    }

    const nombre = document.getElementById(
        "editarSubproyectoNombre"
    ).value.trim();

    const estado = document.getElementById(
        "editarSubproyectoEstado"
    ).value === "true";

    const alcancesIds = Array.from(
        document.querySelectorAll(
            "#editarSubproyectoAlcances input[name='editarSubprojectScope']:checked"
        )
    ).map(function (checkbox) {
        return Number(checkbox.value);
    });

    if (!nombre) {
        mostrarNotificacion(
            "Ingresa el nombre del subproyecto.",
            "warning"
        );
        return;
    }

    if (alcancesIds.length === 0) {
        mostrarNotificacion(
            "Selecciona al menos un alcance.",
            "warning"
        );
        return;
    }

    const boton = this;

    const estadoBoton =
        iniciarCargaBoton(
            boton,
            "Editando..."
        );

    try {
        const respuesta = await apiFetch(
            `${API_URL}/subproyectos/${subproyectoEditandoId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre: nombre,
                    alcances_ids: alcancesIds,
                    estado: estado
                })
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuesta,
                    "No se pudo actualizar el subproyecto."
                )
            );
        }

        await respuesta.json();

        editarSubproyectoModal.hide();
        subproyectoEditandoId = null;

        await cargarProyectos();

        mostrarNotificacion(
            "El subproyecto se actualizó correctamente.",
            "success"
        );

    } catch (error) {
        console.error(
            "Error al actualizar el subproyecto:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo actualizar el subproyecto.",
            "error"
        );

    } finally {
        finalizarCargaBoton(
            boton,
            estadoBoton
        );
    }
});


/* ABRIR MODAL ELIMINAR SUBPROYECTO */
document.addEventListener("click", function (event) {
    const boton = event.target.closest(".btnEliminarSubproyecto");

    if (!boton) return;

    const subproyectoId = boton.dataset.subprojectId;
    const nombre = boton.dataset.subproject || "este subproyecto";

    if (!subproyectoId) {
        mostrarNotificacion(
            "No se identificó el subproyecto.",
            "error"
        );
        return;
    }

    subproyectoEliminandoId = subproyectoId;

    document.getElementById(
        "eliminarSubproyectoMensaje"
    ).textContent =
        `Se eliminará el registro del subproyecto "${nombre}".`;

    eliminarSubproyectoModal.show();
});


/* CONFIRMAR ELIMINACIÓN DEL SUBPROYECTO */
document.getElementById(
    "btnConfirmarEliminarSubproyecto"
)?.addEventListener("click", async function () {
    if (!subproyectoEliminandoId) {
        mostrarNotificacion(
            "No se identificó el subproyecto que se desea eliminar.",
            "error"
        );
        return;
    }

    const boton = this;

    const estadoBoton =
        iniciarCargaBoton(
            boton,
            "Eliminando..."
        );

    try {
        const respuesta = await apiFetch(
            `${API_URL}/subproyectos/${subproyectoEliminandoId}`,
            {
                method: "DELETE"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuesta,
                    "No se pudo eliminar el subproyecto."
                )
            );
        }

        eliminarSubproyectoModal.hide();
        subproyectoEliminandoId = null;

        await cargarProyectos();

        mostrarNotificacion(
            "El subproyecto se eliminó correctamente.",
            "success"
        );

    } catch (error) {
        console.error(
            "Error al eliminar el subproyecto:",
            error
        );

        mostrarNotificacion(
            error.message || "No se pudo eliminar el subproyecto.",
            "error"
        );

    } finally {
        finalizarCargaBoton(
            boton,
            estadoBoton
        );
    }
});

/* =========================================================
   15. TIPOS DE DOCUMENTO
   ========================================================= */

document.getElementById(
    "btnNuevoTipoDocumento"
)?.addEventListener(
    "click",
    function () {

        tipoDocumentoEditandoId = null;


        document.getElementById(
            "tipoDocumentoNombre"
        ).value =
            "";


        document.getElementById(
            "tipoDocumentoDescripcion"
        ).value =
            "";


        nuevoTipoDocumentoModal.show();

    }
);

/* GUARDAR NUEVO TIPO DOCUMENTO */
document.getElementById(
    "guardarTipoDocumento"
)?.addEventListener(
    "click",
    async function () {

        const nombre =
            document.getElementById(
                "tipoDocumentoNombre"
            ).value.trim();

        const descripcion =
            document.getElementById(
                "tipoDocumentoDescripcion"
            ).value.trim();


        if (!nombre) {

            mostrarNotificacion(
                "El nombre del tipo de documento es obligatorio.",
                "warning"
            );

            return;
        }

        const boton = this;
        const estadoCarga = iniciarCargaBoton(
            boton,
            "Guardando..."
        );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/tipos-documento/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            nombre: nombre,
                            descripcion:
                                descripcion || null
                        })
                    }
                );

            if (!respuesta.ok) {

                const error =
                    await respuesta.json();

                throw new Error(
                    error.detail ||
                    "No se pudo crear el tipo de documento."
                );
            }

            await respuesta.json();

            await cargarTiposDocumento();

            nuevoTipoDocumentoModal.hide();

            mostrarNotificacion(
                "El tipo de documento se creó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al crear tipo de documento:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo crear el tipo de documento.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoCarga
            );

        }

    }
);

/* EDITAR TIPO DOCUMENTO */
document.getElementById(
    "actualizarTipoDocumento"
)?.addEventListener(
    "click",
    async function () {

        if (!tipoDocumentoEditandoId) {

            mostrarNotificacion(
                "No se ha seleccionado un tipo de documento para actualizar.",
                "warning"
            );

            return;
        }

        const nombre =
            document.getElementById(
                "editarTipoDocumentoNombre"
            ).value.trim();

        const descripcion =
            document.getElementById(
                "editarTipoDocumentoDescripcion"
            ).value.trim();

        const activo =
            document.getElementById(
                "editarTipoDocumentoEstado"
            ).value === "true";

        if (!nombre) {

            mostrarNotificacion(
                "El nombre del tipo de documento es obligatorio.",
                "warning"
            );

            return;
        }

        const boton = this;
        const estadoCarga = iniciarCargaBoton(
            boton,
            "Guardando cambios..."
        );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/tipos-documento/${tipoDocumentoEditandoId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            nombre: nombre,
                            descripcion:
                                descripcion || null,
                            activo: activo
                        })
                    }
                );

            if (!respuesta.ok) {

                const error =
                    await respuesta.json();

                throw new Error(
                    error.detail ||
                    "No se pudo actualizar el tipo de documento."
                );
            }

            await respuesta.json();

            await cargarTiposDocumento();

            editarTipoDocumentoModal.hide();

            tipoDocumentoEditandoId = null;

            mostrarNotificacion(
                "El tipo de documento se actualizó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al actualizar tipo de documento:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo actualizar el tipo de documento.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoCarga
            );

        }

    }
);

/* CARGAR TIPOS DOCUMENTO */
async function cargarTiposDocumento() {

    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/tipos-documento/`
            );

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los tipos de documento."
            );

        }

        const tiposDocumento =
            await respuesta.json();

        const totalTiposDocumento = document.getElementById("totalTiposDocumento");

        if (totalTiposDocumento) {
            totalTiposDocumento.textContent = tiposDocumento.length;
        }

        const lista =
            document.getElementById(
                "listaTiposDocumento"
            );

        if (!lista) {
            return;
        }

        lista.innerHTML = "";

        tiposDocumento.forEach(
            function (tipo) {

                const elemento =
                    document.createElement("div");

                elemento.className =
                    "config-list-item";

                elemento.innerHTML = `
                    <div class="config-list-icon">
                        <i class="bi bi-file-earmark-text"></i>
                    </div>

                    <div class="config-list-info">
                        <strong>${tipo.nombre}</strong>
                        <span>${tipo.descripcion || "Sin descripción"}</span>
                    </div>

                    <span class="status-badge ${tipo.activo ? "success" : ""}">
                        ${tipo.activo ? "Activo" : "Inactivo"}
                    </span>

                    <button
                        type="button"
                        class="table-action"
                        title="Editar"
                    >
                        <i class="bi bi-pencil"></i>
                    </button>

                    <button
                        type="button"
                        class="table-action"
                        title="Eliminar"
                    >
                        <i class="bi bi-trash"></i>
                    </button>
                `;

                const botonesAccion =
                    elemento.querySelectorAll(
                        ".table-action"
                    );

                const botonEditar =
                    botonesAccion[0];

                const botonEliminar =
                    botonesAccion[1];

                botonEditar.addEventListener(
                    "click",
                    async function () {

                        tipoDocumentoEditandoId = tipo.id;

                        try {

                            const respuesta =
                                await apiFetch(
                                    `${API_URL}/tipos-documento/${tipo.id}`
                                );

                            if (!respuesta.ok) {

                                throw new Error(
                                    "No se pudo obtener el tipo de documento."
                                );

                            }

                            const tipoDocumento =
                                await respuesta.json();

                            document.getElementById(
                                "editarTipoDocumentoNombre"
                            ).value =
                                tipoDocumento.nombre;

                            document.getElementById(
                                "editarTipoDocumentoDescripcion"
                            ).value =
                                tipoDocumento.descripcion || "";

                            document.getElementById(
                                "editarTipoDocumentoEstado"
                            ).value =
                                String(tipoDocumento.activo);

                            editarTipoDocumentoModal.show();

                        } catch (error) {

                            console.error(
                                "Error al cargar tipo de documento:",
                                error
                            );

                            mostrarNotificacion(
                                "No se pudo cargar el tipo de documento.",
                                "error"
                            );

                        }

                    }
                );

                botonEliminar.addEventListener(
                    "click",
                    function () {

                        tipoDocumentoEliminandoId =
                            tipo.id;

                        document.getElementById(
                            "eliminarTipoDocumentoMensaje"
                        ).textContent =
                            `Esta acción eliminará el tipo de documento "${tipo.nombre}".`;

                        eliminarTipoDocumentoModal.show();

                    }
                );

                lista.appendChild(elemento);

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar tipos de documento:",
            error
        );

        mostrarNotificacion(
            "No se pudieron cargar los tipos de documento.",
            "error"
        );

    }

}

/* CONFIRMAR ELIMINACIÓN DE TIPO DOCUMENTO */
document.getElementById(
    "btnConfirmarEliminarTipoDocumento"
)?.addEventListener(
    "click",
    async function () {

        if (!tipoDocumentoEliminandoId) {

            mostrarNotificacion(
                "No se ha seleccionado un tipo de documento para eliminar.",
                "warning"
            );

            return;
        }

        const boton = this;
        const estadoCarga = iniciarCargaBoton(
            boton,
            "Eliminando..."
        );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/tipos-documento/${tipoDocumentoEliminandoId}`,
                    {
                        method: "DELETE"
                    }
                );

            if (!respuesta.ok) {

                const error =
                    await respuesta.json();

                throw new Error(
                    error.detail ||
                    "No se pudo eliminar el tipo de documento."
                );
            }

            await cargarTiposDocumento();

            eliminarTipoDocumentoModal.hide();

            tipoDocumentoEliminandoId = null;

            mostrarNotificacion(
                "El tipo de documento se eliminó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al eliminar tipo de documento:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo eliminar el tipo de documento.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoCarga
            );

        }

    }
);

/* =========================================================
   16. PLANTILLAS
   ========================================================= */

/* CARGAR TIPOS DE DOCUMENTO */

async function cargarTiposDocumentoPlantilla() {

    const select = document.getElementById(
        "plantillaTipoDocumento"
    );

    if (!select) return;

    try {

        const respuesta = await apiFetch(
            `${API_URL}/tipos-documento/activos`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los tipos de documento.");
        }

        const tipos = await respuesta.json();

        select.replaceChildren();

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Seleccione un tipo de documento";
        opcionInicial.disabled = true;
        opcionInicial.selected = true;

        select.appendChild(opcionInicial);

        tipos.forEach(function (tipo) {

            const opcion = document.createElement("option");

            opcion.value = tipo.id;
            opcion.textContent = tipo.nombre;

            select.appendChild(opcion);

        });

    } catch (error) {

        console.error(
            "Error al cargar tipos de documento para plantillas:",
            error
        );

        select.replaceChildren();

        const opcionError = document.createElement("option");
        opcionError.value = "";
        opcionError.textContent = "Error al cargar los tipos de documento";
        opcionError.disabled = true;
        opcionError.selected = true;

        select.appendChild(opcionError);

    }

}

/* CARGAR CLIENTES PARA PLANTILLAS */

async function cargarClientesPlantilla() {
    const select = document.getElementById("plantillaCliente");

    if (!select) return;

    try {
        const respuesta = await apiFetch(`${API_URL}/clientes/`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los clientes.");
        }

        const clientes = await respuesta.json();

        select.replaceChildren();

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Seleccione un cliente";
        opcionInicial.selected = true;

        select.appendChild(opcionInicial);

        clientes
            .filter(function (cliente) {
                return cliente.activo === true;
            })
            .forEach(function (cliente) {
                const opcion = document.createElement("option");

                opcion.value = cliente.id;
                opcion.textContent = cliente.nombre;

                select.appendChild(opcion);
            });

    } catch (error) {
        console.error("Error al cargar clientes para plantillas:", error);

        select.replaceChildren();

        const opcionError = document.createElement("option");
        opcionError.value = "";
        opcionError.textContent = "Error al cargar los clientes";
        opcionError.disabled = true;
        opcionError.selected = true;

        select.appendChild(opcionError);
    }
}

/* CARGAR ALCANCES Y GENERAR TARJETAS */

async function cargarAlcancesPlantilla() {
    const contenedor = document.getElementById("plantillaAlcancesContainer");

    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="text-muted">Cargando alcances...</div>
    `;

    try {
        const respuesta = await apiFetch(`${API_URL}/alcances/`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los alcances.");
        }

        const alcances = await respuesta.json();

        const alcancesActivos = alcances.filter(function (alcance) {
            return alcance.activo === true;
        });

        contenedor.replaceChildren();

        if (alcancesActivos.length === 0) {
            contenedor.innerHTML = `
                <div class="text-muted">
                    No hay alcances activos disponibles.
                </div>
            `;
            return;
        }

        alcancesActivos.forEach(function (alcance) {
            const tarjeta = document.createElement("label");
            tarjeta.className = "document-type-option";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "plantillaAlcance";
            checkbox.value = alcance.id;

            const icono = document.createElement("div");
            icono.className = "document-type-icon";
            icono.innerHTML = `
                <i class="bi bi-diagram-3"></i>
            `;

            const contenido = document.createElement("div");
            contenido.className = "document-type-content";

            const nombre = document.createElement("strong");
            nombre.textContent = alcance.nombre;

            contenido.appendChild(nombre);

            if (alcance.descripcion) {
                const descripcion = document.createElement("small");
                descripcion.textContent = alcance.descripcion;
                contenido.appendChild(descripcion);
            }

            tarjeta.appendChild(checkbox);
            tarjeta.appendChild(icono);
            tarjeta.appendChild(contenido);

            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error(
            "Error al cargar alcances para plantillas:",
            error
        );

        contenedor.innerHTML = `
            <div class="text-danger">
                No se pudieron cargar los alcances. Intenta nuevamente.
            </div>
        `;
    }
}


/* CARGAR ALCANCES PARA EDITAR UNA PLANTILLA */

async function cargarAlcancesEdicionPlantilla(alcancesSeleccionados = []) {

    const contenedor = document.getElementById(
        "editarPlantillaAlcancesContainer"
    );

    if (!contenedor) {
        throw new Error(
            "No se encontró el contenedor de alcances del modal de edición."
        );
    }

    contenedor.innerHTML = `
        <div class="text-muted">Cargando alcances...</div>
    `;

    const respuesta = await apiFetch(`${API_URL}/alcances/`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los alcances.");
    }

    const alcances = await respuesta.json();

    const seleccionados = new Set(
        alcancesSeleccionados.map(function (alcance) {
            return String(
                typeof alcance === "object" ? alcance.id : alcance
            );
        })
    );

    contenedor.replaceChildren();

    const alcancesActivos = alcances.filter(function (alcance) {
        return alcance.activo === true;
    });

    if (alcancesActivos.length === 0) {
        contenedor.innerHTML = `
            <div class="text-muted">
                No hay alcances activos disponibles.
            </div>
        `;
        return;
    }

    alcancesActivos.forEach(function (alcance) {

        const tarjeta = document.createElement("label");
        tarjeta.className = "document-type-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "editarPlantillaAlcance";
        checkbox.value = alcance.id;
        checkbox.checked = seleccionados.has(String(alcance.id));

        const icono = document.createElement("div");
        icono.className = "document-type-icon";
        icono.innerHTML = `<i class="bi bi-diagram-3"></i>`;

        const contenido = document.createElement("div");
        contenido.className = "document-type-content";

        const nombre = document.createElement("strong");
        nombre.textContent = alcance.nombre;

        contenido.appendChild(nombre);

        if (alcance.descripcion) {
            const descripcion = document.createElement("small");
            descripcion.textContent = alcance.descripcion;
            contenido.appendChild(descripcion);
        }

        tarjeta.appendChild(checkbox);
        tarjeta.appendChild(icono);
        tarjeta.appendChild(contenido);

        contenedor.appendChild(tarjeta);
    });
}

document.getElementById(
    "btnNuevaPlantilla"
)?.addEventListener(
    "click",
    async function () {

        document.getElementById(
            "plantillaTipoDocumento"
        ).value = "";

        // Limpiar el cliente seleccionado
        document.getElementById(
            "plantillaCliente"
        ).value = "";

        document.getElementById(
            "plantillaNombre"
        ).value = "";

        document.getElementById(
            "plantillaDescripcion"
        ).value = "";

        document.getElementById(
            "plantillaArchivo"
        ).value = "";

        // Limpiar selecciones anteriores
        document.querySelectorAll(
            '#plantillaAlcancesContainer input[name="plantillaAlcance"]'
        ).forEach(
            function (checkbox) {
                checkbox.checked = false;
            }
        );

        // Abrir el modal
        nuevaPlantillaModal.show();

        // Cargar los datos desde el backend
        await Promise.all([
            cargarClientesPlantilla(),
            cargarTiposDocumentoPlantilla(),
            cargarAlcancesPlantilla()
        ]);

    }
);


/* GUARDAR NUEVA PLANTILLA */
document.getElementById(
    "btnGuardarPlantilla"
)?.addEventListener(
    "click",
    async function () {

        const botonGuardar =
            document.getElementById("btnGuardarPlantilla");

        const clienteId =
            document.getElementById(
                "plantillaCliente"
            ).value;

        const tipoDocumentoId =
            document.getElementById(
                "plantillaTipoDocumento"
            ).value;

        const nombre =
            document.getElementById(
                "plantillaNombre"
            ).value.trim();

        const descripcion =
            document.getElementById(
                "plantillaDescripcion"
            ).value.trim();

        const archivo =
            document.getElementById(
                "plantillaArchivo"
            ).files[0];

        const alcancesSeleccionados =
            document.querySelectorAll(
                '#plantillaAlcancesContainer input[name="plantillaAlcance"]:checked'
            );

        const alcancesIds = Array.from(
            alcancesSeleccionados
        ).map(
            function (checkbox) {
                return checkbox.value;
            }
        );

        const combinacionDuplicada = plantillasRegistradas.some(
            function (plantilla) {

                if (
                    !plantilla.activo ||
                    String(plantilla.cliente_id) !== String(clienteId) ||
                    String(plantilla.tipo_documento_id) !== String(tipoDocumentoId)
                ) {
                    return false;
                }

                const alcancesExistentes = Array.isArray(plantilla.alcances)
                    ? plantilla.alcances
                        .map(function (alcance) {
                            return String(alcance.id);
                        })
                        .sort()
                    : [];

                const alcancesNuevos = alcancesIds
                    .map(String)
                    .sort();

                return (
                    alcancesExistentes.length === alcancesNuevos.length &&
                    alcancesExistentes.every(
                        function (id, indice) {
                            return id === alcancesNuevos[indice];
                        }
                    )
                );
            }
        );

        if (combinacionDuplicada) {
            mostrarNotificacion(
                "Ya existe una plantilla con ese cliente, tipo de documento y combinación de alcances. Utiliza 'Subir nueva versión' para actualizar su archivo.",
                "warning"
            );

            return;
        }

        if (!clienteId) {

            mostrarNotificacion(
                "Debe seleccionar un cliente.",
                "warning"
            );

            return;
        }

        if (!tipoDocumentoId) {

            mostrarNotificacion(
                "Debe seleccionar un tipo de documento.",
                "warning"
            );

            return;
        }

        if (!nombre) {

            mostrarNotificacion(
                "El nombre de la plantilla es obligatorio.",
                "warning"
            );

            return;
        }

        if (alcancesIds.length === 0) {

            mostrarNotificacion(
                "Debe seleccionar al menos un alcance.",
                "warning"
            );

            return;
        }

        if (!archivo) {

            mostrarNotificacion(
                "Debe seleccionar el archivo de la plantilla.",
                "warning"
            );

            return;
        }

        // MOSTRAR INDICADOR DE CARGA
        botonGuardar.disabled = true;

        botonGuardar.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Guardando plantilla...
        `;

        try {

            const datos = new FormData();

            datos.append(
                "cliente_id",
                clienteId
            );

            datos.append(
                "tipo_documento_id",
                tipoDocumentoId
            );

            datos.append(
                "nombre",
                nombre
            );

            datos.append(
                "descripcion",
                descripcion
            );

            alcancesIds.forEach(
                function (alcanceId) {

                    datos.append(
                        "alcances_ids",
                        alcanceId
                    );

                }
            );

            datos.append(
                "archivo",
                archivo
            );

            const respuesta = await apiFetch(
                `${API_URL}/plantillas/`,
                {
                    method: "POST",
                    body: datos
                }
            );

            if (!respuesta.ok) {

                let mensaje =
                    "No se pudo crear la plantilla.";

                try {

                    const error =
                        await respuesta.json();

                    mensaje =
                        error.detail || mensaje;

                } catch (errorLectura) {

                    console.error(
                        "No se pudo interpretar el error del servidor:",
                        errorLectura
                    );

                }

                throw new Error(mensaje);
            }

            await respuesta.json();

            await cargarPlantillas();

            nuevaPlantillaModal.hide();

            mostrarNotificacion(
                "La plantilla se creó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al crear plantilla:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo crear la plantilla.",
                "error"
            );

        } finally {

            // RESTAURAR EL BOTÓN AL TERMINAR
            botonGuardar.disabled = false;

            botonGuardar.innerHTML = `
                <i class="bi bi-check-lg"></i>
                Guardar plantilla
            `;

        }

    }
);



/* DATOS DE PLANTILLAS */
let plantillasRegistradas = [];
let clientesPorIdPlantilla = new Map();
let tiposPorIdPlantilla = new Map();


/* CARGAR Y MOSTRAR PLANTILLAS AGRUPADAS */
async function cargarPlantillas() {

    const contenedor = document.getElementById("listaPlantillas");

    contenedor.innerHTML = `
        <div class="text-muted">
            <i class="bi bi-arrow-repeat"></i>
            Cargando plantillas...
        </div>
    `;

    try {

        const [
            respuestaPlantillas,
            respuestaClientes,
            respuestaTipos
        ] = await Promise.all([
            apiFetch(`${API_URL}/plantillas/`),
            apiFetch(`${API_URL}/clientes/`),
            apiFetch(`${API_URL}/tipos-documento/activos`)
        ]);

        if (
            !respuestaPlantillas.ok ||
            !respuestaClientes.ok ||
            !respuestaTipos.ok
        ) {
            throw new Error(
                "No se pudieron cargar los datos de las plantillas."
            );
        }

        plantillasRegistradas = await respuestaPlantillas.json();

        const clientes = await respuestaClientes.json();
        const tiposDocumento = await respuestaTipos.json();

        clientesPorIdPlantilla = new Map(
            clientes.map(cliente => [
                String(cliente.id),
                cliente.nombre
            ])
        );

        tiposPorIdPlantilla = new Map(
            tiposDocumento.map(tipo => [
                String(tipo.id),
                tipo.nombre
            ])
        );

        /* CARGAR TIPOS EN EL FILTRO */
        const filtroTipo = document.getElementById(
            "filtroPlantillaTipoDocumento"
        );

        const tipoSeleccionado = filtroTipo.value;

        filtroTipo.innerHTML = `
            <option value="">Todos los tipos</option>
        `;

        tiposDocumento.forEach(tipo => {

            const opcion = document.createElement("option");

            opcion.value = String(tipo.id);
            opcion.textContent = tipo.nombre;

            filtroTipo.appendChild(opcion);

        });

        if (
            Array.from(filtroTipo.options).some(
                opcion => opcion.value === tipoSeleccionado
            )
        ) {
            filtroTipo.value = tipoSeleccionado;
        }

        /* MOSTRAR RESULTADOS */
        aplicarFiltrosPlantillas();

    } catch (error) {

        console.error(
            "Error al cargar plantillas:",
            error
        );

        contenedor.innerHTML = `
            <div class="text-danger">
                No se pudieron cargar las plantillas.
            </div>
        `;

        mostrarNotificacion(
            "Error al cargar las plantillas.",
            "error"
        );

    }

}



/* APLICAR BUSCADOR Y FILTROS */
function aplicarFiltrosPlantillas() {

    const contenedor = document.getElementById("listaPlantillas");

    const busqueda = document.getElementById(
        "buscarPlantillas"
    ).value.trim().toLowerCase();

    const tipoSeleccionado = document.getElementById(
        "filtroPlantillaTipoDocumento"
    ).value;

    const estadoSeleccionado = document.getElementById(
        "filtroPlantillaEstado"
    ).value;

    const fechaDesde = document.getElementById(
        "filtroPlantillaFechaDesde"
    ).value;

    const fechaHasta = document.getElementById(
        "filtroPlantillaFechaHasta"
    ).value;

    const plantillasFiltradas = plantillasRegistradas.filter(
        plantilla => {

            const cliente =
                clientesPorIdPlantilla.get(
                    String(plantilla.cliente_id)
                ) || "Cliente no disponible";

            const tipoDocumento =
                tiposPorIdPlantilla.get(
                    String(plantilla.tipo_documento_id)
                ) || "Tipo de documento no disponible";

            const textoBusqueda = [
                plantilla.nombre,
                plantilla.descripcion,
                cliente,
                tipoDocumento
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            if (
                busqueda &&
                !textoBusqueda.includes(busqueda)
            ) {
                return false;
            }

            if (
                tipoSeleccionado &&
                String(plantilla.tipo_documento_id) !== tipoSeleccionado
            ) {
                return false;
            }

            if (
                estadoSeleccionado !== "" &&
                String(plantilla.activo) !== estadoSeleccionado
            ) {
                return false;
            }

            const fechaPlantilla = plantilla.fecha_carga
                ? String(plantilla.fecha_carga).substring(0, 10)
                : "";

            if (
                fechaDesde &&
                (!fechaPlantilla || fechaPlantilla < fechaDesde)
            ) {
                return false;
            }

            if (
                fechaHasta &&
                (!fechaPlantilla || fechaPlantilla > fechaHasta)
            ) {
                return false;
            }

            return true;
        }
    );

    /* SIN RESULTADOS */
    if (plantillasFiltradas.length === 0) {

        contenedor.innerHTML = `
            <div class="text-muted py-4 text-center">
                <i class="bi bi-folder2-open"></i>
                <p class="mb-0 mt-2">
                    No se encontraron plantillas con los criterios seleccionados.
                </p>
            </div>
        `;

        return;
    }

    /* AGRUPAR POR CLIENTE Y TIPO DE DOCUMENTO */
    const gruposClientes = new Map();

    plantillasFiltradas.forEach(plantilla => {

        const clienteId = String(plantilla.cliente_id);

        const clienteNombre =
            clientesPorIdPlantilla.get(clienteId) ||
            "Cliente no disponible";

        const tipoId = String(plantilla.tipo_documento_id);

        const tipoNombre =
            tiposPorIdPlantilla.get(tipoId) ||
            "Tipo de documento no disponible";

        if (!gruposClientes.has(clienteId)) {

            gruposClientes.set(clienteId, {
                nombre: clienteNombre,
                tipos: new Map()
            });

        }

        const grupoCliente = gruposClientes.get(clienteId);

        if (!grupoCliente.tipos.has(tipoId)) {

            grupoCliente.tipos.set(tipoId, {
                nombre: tipoNombre,
                plantillas: []
            });

        }

        grupoCliente.tipos.get(tipoId).plantillas.push(plantilla);

    });

    /* EVITAR INSERTAR TEXTO COMO HTML */
    const escaparHTML = valor => String(valor ?? "").replace(
        /[&<>"']/g,
        caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]
    );

    /* CONSTRUIR LA JERARQUÍA */
    contenedor.className = "template-hierarchy";

    contenedor.innerHTML = Array.from(gruposClientes.values())
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(grupoCliente => {

            const gruposTipos = Array.from(grupoCliente.tipos.values())
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map(grupoTipo => {

                    const tarjetas = grupoTipo.plantillas
                        .sort((a, b) =>
                            String(a.nombre).localeCompare(String(b.nombre))
                        )
                        .map(plantilla => {

                            const fecha = plantilla.fecha_carga
                                ? new Date(
                                    plantilla.fecha_carga
                                ).toLocaleDateString("es-PE", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                })
                                : "Sin fecha";

                            const estado = plantilla.activo
                                ? "Activa"
                                : "Inactiva";

                            const alcancesHTML =
                                Array.isArray(plantilla.alcances) &&
                                plantilla.alcances.length > 0
                                    ? plantilla.alcances
                                        .map(alcance =>
                                            escaparHTML(alcance.nombre)
                                        )
                                        .join(", ")
                                    : "Sin alcances asociados";

                            return `
                                <div class="template-card">

                                    <div class="template-icon">
                                        <i class="bi bi-file-earmark-word"></i>
                                    </div>

                                    <div class="template-content">

                                        <strong>
                                            ${escaparHTML(plantilla.nombre)}
                                        </strong>

                                        <span>
                                            Versión ${escaparHTML(plantilla.version)}
                                        </span>

                                        <small>
                                            <i class="bi bi-calendar3"></i>
                                            Actualizada: ${escaparHTML(fecha)}
                                        </small>

                                        <small>
                                            Estado: ${estado}
                                        </small>

                                        <small>
                                            <i class="bi bi-diagram-3"></i>
                                            <strong>Alcances:</strong>
                                            ${alcancesHTML}
                                        </small>

                                    </div>

                                    <!-- EDITAR PLANTILLA -->
                                    <button
                                        type="button"
                                        class="template-action"
                                        title="Editar plantilla"
                                        aria-label="Editar ${escaparHTML(plantilla.nombre)}"
                                        data-editar-plantilla="${escaparHTML(plantilla.id)}"
                                    >
                                        <i class="bi bi-pencil-square"></i>
                                    </button>

                                    <!-- DESCARGAR PLANTILLA -->
                                    <button
                                        type="button"
                                        class="template-action"
                                        title="Descargar plantilla"
                                        aria-label="Descargar ${escaparHTML(plantilla.nombre)}"
                                        data-descargar-plantilla="${escaparHTML(plantilla.id)}"
                                    >
                                        <i class="bi bi-download"></i>
                                    </button>

                                    <!-- SUBIR NUEVA VERSIÓN -->
                                    <button
                                        type="button"
                                        class="template-action"
                                        title="Subir nueva versión"
                                        aria-label="Subir nueva versión de ${escaparHTML(plantilla.nombre)}"
                                        data-subir-version-plantilla="${escaparHTML(plantilla.id)}"
                                    >
                                        <i class="bi bi-cloud-arrow-up"></i>
                                    </button>

                                    <!-- HISTORIAL DE VERSIONES -->
                                    <button
                                        type="button"
                                        class="template-action"
                                        title="Historial de versiones"
                                        aria-label="Consultar historial de ${escaparHTML(plantilla.nombre)}"
                                        data-historial-plantilla="${escaparHTML(plantilla.id)}"
                                    >
                                        <i class="bi bi-clock-history"></i>
                                    </button>

                                </div>
                            `;

                        }).join("");

                    return `
                        <section class="template-type-group">

                            <h5 class="template-type-heading">
                                <i class="bi bi-file-earmark-text"></i>
                                ${escaparHTML(grupoTipo.nombre)}
                                <span class="badge text-bg-light">
                                    ${grupoTipo.plantillas.length}
                                </span>
                            </h5>

                            <div class="template-group-items">
                                ${tarjetas}
                            </div>

                        </section>
                    `;

                }).join("");

            const cantidadPlantillas = Array.from(
                grupoCliente.tipos.values()
            ).reduce(
                (total, grupo) => total + grupo.plantillas.length,
                0
            );

            return `
                <section class="template-client-group">

                    <div class="template-client-heading">

                        <div>
                            <h4>
                                <i class="bi bi-building"></i>
                                ${escaparHTML(grupoCliente.nombre)}
                            </h4>

                            <small>
                                ${cantidadPlantillas}
                                ${cantidadPlantillas === 1
                                    ? "plantilla"
                                    : "plantillas"}
                            </small>
                        </div>

                    </div>

                    <div class="template-client-content">
                        ${gruposTipos}
                    </div>

                </section>
            `;

        }).join("");

}


/* EVENTOS DEL BUSCADOR Y FILTROS */
document.getElementById(
    "buscarPlantillas"
)?.addEventListener(
    "input",
    aplicarFiltrosPlantillas
);

[
    "filtroPlantillaTipoDocumento",
    "filtroPlantillaEstado",
    "filtroPlantillaFechaDesde",
    "filtroPlantillaFechaHasta"
].forEach(id => {

    document.getElementById(id)?.addEventListener(
        "change",
        aplicarFiltrosPlantillas
    );

});


/* LIMPIAR FILTROS */
document.getElementById(
    "btnLimpiarFiltrosPlantillas"
)?.addEventListener(
    "click",
    function () {

        document.getElementById(
            "buscarPlantillas"
        ).value = "";

        document.getElementById(
            "filtroPlantillaTipoDocumento"
        ).value = "";

        document.getElementById(
            "filtroPlantillaEstado"
        ).value = "";

        document.getElementById(
            "filtroPlantillaFechaDesde"
        ).value = "";

        document.getElementById(
            "filtroPlantillaFechaHasta"
        ).value = "";

        aplicarFiltrosPlantillas();

    }
);

/* DESCARGAR PLANTILLA Y CONSULTAR HISTORIAL */
document.getElementById(
    "listaPlantillas"
)?.addEventListener(
    "click",
    async function (evento) {

        /* EDITAR PLANTILLA */
        const botonEditar = evento.target.closest(
            "[data-editar-plantilla]"
        );

        if (botonEditar) {

            const plantillaId =
                botonEditar.dataset.editarPlantilla;

            const plantilla = plantillasRegistradas.find(
                item => String(item.id) === String(plantillaId)
            );

            if (!plantilla) {
                mostrarNotificacion(
                    "No se encontró la plantilla seleccionada.",
                    "error"
                );
                return;
            }

            const modalElemento = document.getElementById(
                "editarPlantillaModal"
            );

            document.getElementById(
                "editarPlantillaId"
            ).value = plantilla.id;

            document.getElementById(
                "editarPlantillaNombre"
            ).value = plantilla.nombre || "";

            document.getElementById(
                "editarPlantillaDescripcion"
            ).value = plantilla.descripcion || "";

            document.getElementById(
                "editarPlantillaEstado"
            ).value = String(plantilla.activo);

            const selectCliente = document.getElementById(
                "editarPlantillaCliente"
            );

            const selectTipo = document.getElementById(
                "editarPlantillaTipoDocumento"
            );

            try {

                const [respuestaClientes, respuestaTipos] =
                    await Promise.all([
                        apiFetch(`${API_URL}/clientes/`),
                        apiFetch(`${API_URL}/tipos-documento/activos`)
                    ]);

                if (!respuestaClientes.ok || !respuestaTipos.ok) {
                    throw new Error(
                        "No se pudieron cargar los clientes o tipos de documento."
                    );
                }

                const clientes = await respuestaClientes.json();
                const tipos = await respuestaTipos.json();

                selectCliente.replaceChildren();

                const opcionCliente = document.createElement("option");
                opcionCliente.value = "";
                opcionCliente.textContent = "Seleccione un cliente";
                selectCliente.appendChild(opcionCliente);

                clientes
                    .filter(cliente => cliente.activo === true)
                    .forEach(cliente => {
                        const opcion = document.createElement("option");
                        opcion.value = cliente.id;
                        opcion.textContent = cliente.nombre;
                        selectCliente.appendChild(opcion);
                    });

                selectTipo.replaceChildren();

                const opcionTipo = document.createElement("option");
                opcionTipo.value = "";
                opcionTipo.textContent = "Seleccione un tipo de documento";
                selectTipo.appendChild(opcionTipo);

                tipos.forEach(tipo => {
                    const opcion = document.createElement("option");
                    opcion.value = tipo.id;
                    opcion.textContent = tipo.nombre;
                    selectTipo.appendChild(opcion);
                });

                selectCliente.value = String(plantilla.cliente_id);
                selectTipo.value = String(plantilla.tipo_documento_id);

                await cargarAlcancesEdicionPlantilla(
                    plantilla.alcances || []
                );

                bootstrap.Modal.getOrCreateInstance(
                    modalElemento
                ).show();

            } catch (error) {

                console.error(
                    "Error al preparar la edición de la plantilla:",
                    error
                );

                mostrarNotificacion(
                    error.message || "No se pudo abrir la edición.",
                    "error"
                );
            }

            return;
        }


        /* DESCARGAR PLANTILLA */
        const botonDescargar = evento.target.closest(
            "[data-descargar-plantilla]"
        );

        if (botonDescargar) {

            const plantillaId =
                botonDescargar.dataset.descargarPlantilla;

            window.open(
                `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}/descargar`,
                "_blank"
            );

            return;
        }

        /* CONSULTAR HISTORIAL DE VERSIONES */
        const botonHistorial = evento.target.closest(
            "[data-historial-plantilla]"
        );

        if (!botonHistorial) return;

        const plantillaId =
            botonHistorial.dataset.historialPlantilla;

        await mostrarHistorialPlantillas(plantillaId);

    }
);


/* MOSTRAR HISTORIAL DE VERSIONES */
async function mostrarHistorialPlantillas(plantillaId) {

    const contenedorHistorial = document.getElementById(
        "contenidoHistorialPlantillas"
    );

    const tituloHistorial = document.getElementById(
        "tituloHistorialPlantillas"
    );

    const modalElemento = document.getElementById(
        "historialPlantillasModal"
    );

    if (!contenedorHistorial || !tituloHistorial || !modalElemento) {
        mostrarNotificacion(
            "No se encontró el modal del historial de versiones.",
            "error"
        );
        return;
    }

    const plantilla = plantillasRegistradas.find(
        item => String(item.id) === String(plantillaId)
    );

    tituloHistorial.textContent = plantilla
        ? `Historial: ${plantilla.nombre}`
        : "Historial de versiones";

    contenedorHistorial.innerHTML = `
        <div class="text-muted text-center py-4">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Cargando versiones...
        </div>
    `;

    bootstrap.Modal.getOrCreateInstance(modalElemento).show();

    try {

        const respuesta = await apiFetch(
            `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}/versiones`
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo consultar el historial de versiones."
            );
        }

        const versiones = await respuesta.json();

        const escapar = valor =>
            String(valor ?? "").replace(
                /[&<>"']/g,
                caracter => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                })[caracter]
            );

        if (!Array.isArray(versiones) || versiones.length === 0) {

            contenedorHistorial.innerHTML = `
                <div class="template-history-empty">
                    <i class="bi bi-clock-history"></i>
                    <strong>Sin versiones registradas</strong>
                    <p>
                        Esta plantilla todavía no tiene versiones anteriores disponibles.
                    </p>
                </div>
            `;

            return;
        }

        contenedorHistorial.innerHTML = `
            <div class="template-version-list">
                ${versiones.map(version => {

                    const fecha = version.fecha_carga
                        ? new Date(
                            version.fecha_carga
                        ).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        })
                        : "Sin fecha";

                    const esActual = plantilla
                        && Number(version.numero_version)
                            === Number(plantilla.version);

                    return `
                        <div class="template-version-item">

                            <div class="template-version-icon">
                                <i class="bi bi-file-earmark-text"></i>
                            </div>

                            <div class="template-version-info">

                                <div class="template-version-title">
                                    <span>
                                        Versión ${escapar(version.numero_version)}
                                    </span>

                                    ${esActual
                                        ? '<span class="template-version-current">Actual</span>'
                                        : ''}
                                </div>

                                <small>
                                    <i class="bi bi-file-earmark me-1"></i>
                                    ${escapar(
                                        version.nombre_archivo || "Archivo sin nombre"
                                    )}
                                </small>

                                <small>
                                    <i class="bi bi-calendar3 me-1"></i>
                                    ${escapar(fecha)}
                                </small>

                                <small>
                                    <i class="bi bi-chat-left-text me-1"></i>
                                    ${escapar(
                                        version.motivo || "Sin motivo registrado"
                                    )}
                                </small>

                            </div>

                            <button
                                type="button"
                                class="template-version-download"
                                title="Descargar esta versión"
                                aria-label="Descargar versión ${escapar(version.numero_version)}"
                                data-descargar-version="${escapar(plantillaId)}"
                                data-numero-version="${escapar(version.numero_version)}"
                            >
                                <i class="bi bi-download"></i>
                            </button>

                            ${!esActual ? `
                                <button
                                    type="button"
                                    class="template-version-download"
                                    title="Restaurar esta versión"
                                    aria-label="Restaurar versión ${escapar(version.numero_version)}"
                                    data-restaurar-version="${escapar(plantillaId)}"
                                    data-version-id="${escapar(version.id)}"
                                >
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                </button>

                                <button
                                    type="button"
                                    class="template-version-download text-danger"
                                    title="Eliminar esta versión"
                                    aria-label="Eliminar versión ${escapar(version.numero_version)}"
                                    data-eliminar-version="${escapar(plantillaId)}"
                                    data-version-id="${escapar(version.id)}"
                                    data-numero-version="${escapar(version.numero_version)}"
                                >
                                    <i class="bi bi-trash3"></i>
                                </button>
                            ` : ""}

                        </div>
                    `;

                }).join("")}
            </div>
        `;

    } catch (error) {

        console.error(
            "Error al consultar las versiones:",
            error
        );

        contenedorHistorial.innerHTML = `
            <div class="alert alert-danger mb-0">
                No se pudo cargar el historial de versiones.
            </div>
        `;

        mostrarNotificacion(
            error.message || "Error al cargar el historial.",
            "error"
        );
    }
}


/* EVENTOS DEL HISTORIAL: RESTAURAR Y DESCARGAR */
document.getElementById(
    "contenidoHistorialPlantillas"
)?.addEventListener(
    "click",
    async function (evento) {

        /* ABRIR MODAL PARA ELIMINAR UNA VERSIÓN */
        const botonEliminarVersion = evento.target.closest(
            "[data-eliminar-version]"
        );

        if (botonEliminarVersion) {
            const plantillaId =
                botonEliminarVersion.dataset.eliminarVersion;

            const versionId =
                botonEliminarVersion.dataset.versionId;

            const numeroVersion =
                botonEliminarVersion.dataset.numeroVersion;

            document.getElementById(
                "eliminarVersionPlantillaId"
            ).value = plantillaId;

            document.getElementById(
                "eliminarVersionId"
            ).value = versionId;

            document.getElementById(
                "eliminarVersionPlantillaMensaje"
            ).textContent =
                `Se eliminará la versión ${numeroVersion} y su archivo asociado, si corresponde.`;

            const modalHistorial = document.getElementById(
                "historialPlantillasModal"
            );

            const modalEliminar = document.getElementById(
                "eliminarVersionPlantillaModal"
            );

            modalHistorial.addEventListener(
                "hidden.bs.modal",
                function abrirModalEliminar() {
                    bootstrap.Modal.getOrCreateInstance(
                        modalEliminar
                    ).show();
                },
                { once: true }
            );

            bootstrap.Modal.getOrCreateInstance(
                modalHistorial
            ).hide();

            return;
        }

        /* ABRIR MODAL PARA RESTAURAR UNA VERSIÓN */
        const botonRestaurar = evento.target.closest(
            "[data-restaurar-version]"
        );

        if (botonRestaurar) {
            document.getElementById(
                "restaurarVersionPlantillaId"
            ).value = botonRestaurar.dataset.restaurarVersion;

            document.getElementById(
                "restaurarVersionId"
            ).value = botonRestaurar.dataset.versionId;

            document.getElementById(
                "restaurarVersionMotivo"
            ).value = "";

            const modalHistorial = document.getElementById(
                "historialPlantillasModal"
            );

            const modalRestauracion = document.getElementById(
                "restaurarVersionPlantillaModal"
            );

            const instanciaHistorial =
                bootstrap.Modal.getOrCreateInstance(modalHistorial);

            modalHistorial.addEventListener(
                "hidden.bs.modal",
                function abrirRestauracion() {
                    modalHistorial.removeEventListener(
                        "hidden.bs.modal",
                        abrirRestauracion
                    );

                    bootstrap.Modal.getOrCreateInstance(
                        modalRestauracion
                    ).show();
                },
                { once: true }
            );

            instanciaHistorial.hide();

            return;
        }


        /* DESCARGAR UNA VERSIÓN ESPECÍFICA */
        const botonDescargarVersion = evento.target.closest(
            "[data-descargar-version]"
        );

        if (botonDescargarVersion) {

            const plantillaId =
                botonDescargarVersion.dataset.descargarVersion;

            const numeroVersion =
                botonDescargarVersion.dataset.numeroVersion;

            window.open(
                `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}/descargar?numero_version=${encodeURIComponent(numeroVersion)}`,
                "_blank"
            );
        }

    }
);

/* CANCELAR RESTAURACIÓN Y VOLVER AL HISTORIAL */
document.getElementById(
    "btnCancelarRestaurarVersion"
)?.addEventListener("click", function () {

    const modalRestauracion = document.getElementById(
        "restaurarVersionPlantillaModal"
    );

    const modalHistorial = document.getElementById(
        "historialPlantillasModal"
    );

    modalRestauracion.addEventListener(
        "hidden.bs.modal",
        function volverAlHistorial() {
            modalRestauracion.removeEventListener(
                "hidden.bs.modal",
                volverAlHistorial
            );

            bootstrap.Modal.getOrCreateInstance(
                modalHistorial
            ).show();
        },
        { once: true }
    );

    bootstrap.Modal.getOrCreateInstance(
        modalRestauracion
    ).hide();
});

/* CONFIRMAR RESTAURACIÓN DE VERSIÓN */
document.getElementById(
    "btnConfirmarRestaurarVersion"
)?.addEventListener(
    "click",
    async function () {

        const boton = this;

        const plantillaId = document.getElementById(
            "restaurarVersionPlantillaId"
        ).value;

        const versionId = document.getElementById(
            "restaurarVersionId"
        ).value;

        const motivo = document.getElementById(
            "restaurarVersionMotivo"
        ).value.trim();

        if (!plantillaId || !versionId) {
            mostrarNotificacion(
                "No se identificó la plantilla o versión seleccionada.",
                "error"
            );
            return;
        }

        if (!motivo) {
            mostrarNotificacion(
                "Debes indicar el motivo de la restauración.",
                "warning"
            );

            document.getElementById(
                "restaurarVersionMotivo"
            ).focus();

            return;
        }

        const textoOriginal = boton.innerHTML;

        boton.disabled = true;

        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Restaurando...
        `;

        try {

            const formulario = new FormData();
            formulario.append("motivo", motivo);

            const respuesta = await apiFetch(
                `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}/versiones/${encodeURIComponent(versionId)}/restaurar`,
                {
                    method: "POST",
                    body: formulario
                }
            );

            if (!respuesta.ok) {

                let mensaje =
                    "No se pudo restaurar la versión seleccionada.";

                try {
                    const error = await respuesta.json();
                    mensaje = error.detail || mensaje;
                } catch (_) {
                    // Mantener el mensaje predeterminado.
                }

                throw new Error(mensaje);
            }

            await respuesta.json();

            const modalRestauracion = document.getElementById(
                "restaurarVersionPlantillaModal"
            );

            const modalHistorial = document.getElementById(
                "historialPlantillasModal"
            );

            // Cerrar el modal de restauración antes de actualizar.
            modalRestauracion.addEventListener(
                "hidden.bs.modal",
                async function actualizarVista() {

                    modalRestauracion.removeEventListener(
                        "hidden.bs.modal",
                        actualizarVista
                    );

                    // Si el historial continúa abierto, cerrarlo también.
                    const instanciaHistorial =
                        bootstrap.Modal.getInstance(modalHistorial);

                    if (
                        modalHistorial.classList.contains("show") &&
                        instanciaHistorial
                    ) {
                        instanciaHistorial.hide();
                    }

                    await cargarPlantillas();

                    mostrarNotificacion(
                        "La versión se restauró correctamente.",
                        "success"
                    );
                },
                { once: true }
            );

            bootstrap.Modal.getOrCreateInstance(
                modalRestauracion
            ).hide();

        } catch (error) {

            console.error(
                "Error al restaurar la versión:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "Ocurrió un error al restaurar la versión.",
                "error"
            );

        } finally {

            boton.disabled = false;
            boton.innerHTML = textoOriginal;

        }

    }
);

/* ABRIR MODAL PARA SUBIR UNA NUEVA VERSION */
document.getElementById(
    "listaPlantillas"
)?.addEventListener(
    "click",
    function (evento) {

        const boton = evento.target.closest(
            "[data-subir-version-plantilla]"
        );

        if (!boton) return;

        const plantillaId =
            boton.dataset.subirVersionPlantilla;

        const plantilla = plantillasRegistradas.find(
            item => String(item.id) === String(plantillaId)
        );

        if (!plantilla) {
            mostrarNotificacion(
                "No se encontró la plantilla seleccionada.",
                "error"
            );
            return;
        }

        if (!plantilla.activo) {
            mostrarNotificacion(
                "No se pueden subir versiones de una plantilla inactiva.",
                "warning"
            );
            return;
        }

        document.getElementById(
            "subirVersionPlantillaId"
        ).value = plantillaId;

        document.getElementById(
            "subirVersionPlantillaArchivo"
        ).value = "";

        document.getElementById(
            "subirVersionPlantillaMotivo"
        ).value = "";

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("subirVersionPlantillaModal")
        ).show();
    }
);


/* GUARDAR NUEVA VERSION */

document.getElementById(
    "btnConfirmarSubirVersionPlantilla"
)?.addEventListener(
    "click",
    async function () {

        const boton = document.getElementById(
            "btnConfirmarSubirVersionPlantilla"
        );

        const plantillaId = document.getElementById(
            "subirVersionPlantillaId"
        ).value;

        const archivo = document.getElementById(
            "subirVersionPlantillaArchivo"
        ).files[0];

        const motivo = document.getElementById(
            "subirVersionPlantillaMotivo"
        ).value.trim();

        if (!plantillaId) {
            mostrarNotificacion(
                "No se ha seleccionado una plantilla.",
                "warning"
            );
            return;
        }

        if (!archivo) {
            mostrarNotificacion(
                "Selecciona el archivo de la nueva versión.",
                "warning"
            );
            return;
        }

        if (!motivo) {
            mostrarNotificacion(
                "Debes indicar el motivo de la actualización.",
                "warning"
            );
            return;
        }

        const textoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Subiendo versión...
        `;

        try {

            const datos = new FormData();

            datos.append("archivo", archivo);
            datos.append("motivo", motivo);

            const respuesta = await apiFetch(
                `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}/versiones`,
                {
                    method: "POST",
                    body: datos
                }
            );

            if (!respuesta.ok) {
                let mensaje = "No se pudo subir la nueva versión.";

                try {
                    const error = await respuesta.json();
                    mensaje = error.detail || mensaje;
                } catch (errorLectura) {
                    console.error(
                        "No se pudo interpretar el error:",
                        errorLectura
                    );
                }

                throw new Error(mensaje);
            }

            await respuesta.json();

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("subirVersionPlantillaModal")
            ).hide();

            await cargarPlantillas();

            mostrarNotificacion(
                "La nueva versión se ha subido correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al subir nueva versión:",
                error
            );

            mostrarNotificacion(
                error.message || "No se pudo subir la nueva versión.",
                "error"
            );

        } finally {

            boton.disabled = false;
            boton.innerHTML = textoOriginal;

        }
    }
);

/* CONFIRMAR ELIMINACIÓN DE UNA VERSIÓN */
document.getElementById(
    "btnConfirmarEliminarVersion"
)?.addEventListener(
    "click",
    async function () {
        const boton = this;

        const plantillaId = document.getElementById(
            "eliminarVersionPlantillaId"
        ).value;

        const versionId = document.getElementById(
            "eliminarVersionId"
        ).value;

        if (!plantillaId || !versionId) {
            mostrarNotificacion(
                "No se identificó la plantilla o versión seleccionada.",
                "error"
            );
            return;
        }

        const textoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"></span>
            Eliminando...
        `;

        try {
            const respuesta = await apiFetch(
                `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}/versiones/${encodeURIComponent(versionId)}`,
                {
                    method: "DELETE"
                }
            );

            if (!respuesta.ok) {
                let mensaje = "No se pudo eliminar la versión.";

                try {
                    const error = await respuesta.json();
                    mensaje = error.detail || mensaje;
                } catch (_) {
                    // Se conserva el mensaje predeterminado.
                }

                throw new Error(mensaje);
            }

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById(
                    "eliminarVersionPlantillaModal"
                )
            ).hide();

            await mostrarHistorialPlantillas(plantillaId);
            await cargarPlantillas();

            mostrarNotificacion(
                "La versión se eliminó correctamente.",
                "success"
            );

        } catch (error) {
            console.error(
                "Error al eliminar la versión:",
                error
            );

            mostrarNotificacion(
                error.message || "No se pudo eliminar la versión.",
                "error"
            );

        } finally {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }
);


/* GUARDAR EDICIÓN DE PLANTILLA */

document.getElementById(
    "btnGuardarEdicionPlantilla"
)?.addEventListener(
    "click",
    async function () {

        const boton = this;

        const plantillaId = document.getElementById(
            "editarPlantillaId"
        ).value;

        const clienteId = document.getElementById(
            "editarPlantillaCliente"
        ).value;

        const tipoDocumentoId = document.getElementById(
            "editarPlantillaTipoDocumento"
        ).value;

        const nombre = document.getElementById(
            "editarPlantillaNombre"
        ).value.trim();

        const descripcion = document.getElementById(
            "editarPlantillaDescripcion"
        ).value.trim();

        const activo = document.getElementById(
            "editarPlantillaEstado"
        ).value === "true";

        const alcancesIds = Array.from(
            document.querySelectorAll(
                '#editarPlantillaAlcancesContainer input[name="editarPlantillaAlcance"]:checked'
            )
        ).map(function (checkbox) {
            return Number(checkbox.value);
        });

        if (!plantillaId) {
            mostrarNotificacion(
                "No se identificó la plantilla que deseas editar.",
                "error"
            );
            return;
        }

        if (!clienteId || !tipoDocumentoId || !nombre) {
            mostrarNotificacion(
                "Completa el cliente, tipo de documento y nombre.",
                "warning"
            );
            return;
        }

        if (alcancesIds.length === 0) {
            mostrarNotificacion(
                "Debes seleccionar al menos un alcance.",
                "warning"
            );
            return;
        }

        const textoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Guardando cambios...
        `;

        try {

            const respuesta = await apiFetch(
                `${API_URL}/plantillas/${encodeURIComponent(plantillaId)}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        cliente_id: Number(clienteId),
                        tipo_documento_id: Number(tipoDocumentoId),
                        nombre: nombre,
                        descripcion: descripcion,
                        alcances_ids: alcancesIds,
                        activo: activo
                    })
                }
            );

            if (!respuesta.ok) {

                let mensaje = "No se pudo actualizar la plantilla.";

                try {
                    const error = await respuesta.json();
                    mensaje = error.detail || mensaje;
                } catch (_) {
                    // Se mantiene el mensaje predeterminado.
                }

                throw new Error(mensaje);
            }

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("editarPlantillaModal")
            ).hide();

            await cargarPlantillas();

            mostrarNotificacion(
                "La plantilla se actualizó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al actualizar la plantilla:",
                error
            );

            mostrarNotificacion(
                error.message || "No se pudo actualizar la plantilla.",
                "error"
            );

        } finally {

            boton.disabled = false;
            boton.innerHTML = textoOriginal;

        }
    }
);

/* =========================================================
   17. REQUISITOS DEL ALCANCE
   ========================================================= */

const filtroRequisitoTipo =
    document.getElementById(
        "filtroRequisitoTipo"
    );


const seleccionarTodosRequisitos =
    document.getElementById(
        "seleccionarTodosRequisitos"
    );


function filtrarRequisitos() {

    const tipoSeleccionado =
        filtroRequisitoTipo.value;


    document.querySelectorAll(
        "#listaRequisitos .requirement-item"
    ).forEach(
        function (requisito) {

            const tipo =
                requisito.dataset.tipoRequisito;


            if (
                tipoSeleccionado === "" ||
                tipo === tipoSeleccionado
            ) {

                requisito.style.display =
                    "";

            } else {

                requisito.style.display =
                    "none";

            }

        }
    );


    actualizarSeleccionTodos();

}


function actualizarSeleccionTodos() {

    if (!seleccionarTodosRequisitos) {
        return;
    }


    const requisitosVisibles =
        Array.from(
            document.querySelectorAll(
                "#listaRequisitos .requirement-item"
            )
        ).filter(
            function (requisito) {

                return (
                    requisito.style.display !==
                    "none"
                );

            }
        );


    const checksVisibles =
        requisitosVisibles.map(
            function (requisito) {

                return requisito.querySelector(
                    ".requisito-evidencia"
                );

            }
        );


    seleccionarTodosRequisitos.checked =
        checksVisibles.length > 0 &&
        checksVisibles.every(
            function (checkbox) {

                return checkbox.checked;

            }
        );

}


filtroRequisitoTipo?.addEventListener(
    "change",
    filtrarRequisitos
);


seleccionarTodosRequisitos?.addEventListener(
    "change",
    function () {

        const tipoSeleccionado =
            filtroRequisitoTipo.value;


        document.querySelectorAll(
            "#listaRequisitos .requirement-item"
        ).forEach(
            function (requisito) {

                const tipo =
                    requisito.dataset.tipoRequisito;


                if (
                    tipoSeleccionado === "" ||
                    tipo === tipoSeleccionado
                ) {

                    const checkbox =
                        requisito.querySelector(
                            ".requisito-evidencia"
                        );


                    if (checkbox) {

                        checkbox.checked =
                            seleccionarTodosRequisitos.checked;

                    }

                }

            }
        );

    }
);


document.querySelectorAll(
    "#listaRequisitos .requisito-evidencia"
).forEach(
    function (checkbox) {

        checkbox.addEventListener(
            "change",
            actualizarSeleccionTodos
        );

    }
);


/* =========================================================
   18. NUEVO ALCANCE
   ========================================================= */

document.getElementById(
    "btnNuevoAlcance"
)?.addEventListener(
    "click",
    function () {

        document.getElementById(
            "alcanceNombre"
        ).value = "";

        document.getElementById(
            "alcanceDescripcion"
        ).value = "";

        nuevoAlcanceModal.show();

    }
);

/* CARGAR ALCANCES */
async function cargarAlcances() {

    try {

        const respuesta =
            await apiFetch(
                `${API_URL}/alcances/`
            );

        if (!respuesta.ok) {

            const error =
                await respuesta.json();

            throw new Error(
                error.detail ||
                "No se pudieron cargar los alcances."
            );
        }

        const alcances =
            await respuesta.json();

        const contenedor =
            document.getElementById(
                "listaAlcances"
            );

        if (!contenedor) {

            console.error(
                "No se encontró el contenedor listaAlcances."
            );

            return;
        }

        contenedor.innerHTML = "";


        if (alcances.length === 0) {

            const mensaje =
                document.createElement("div");

            mensaje.className =
                "text-muted";

            mensaje.textContent =
                "No hay alcances registrados.";

            contenedor.appendChild(
                mensaje
            );

            return;
        }


        alcances.forEach(
            function (alcance) {

                const tarjeta =
                    document.createElement("div");

                tarjeta.className =
                    "installation-card";


                /*
                 * ICONO
                 */

                const icono =
                    document.createElement("div");

                icono.className =
                    "installation-icon";

                icono.innerHTML =
                    '<i class="bi bi-diagram-3"></i>';


                /*
                 * CONTENIDO
                 */

                const contenido =
                    document.createElement("div");

                contenido.className =
                    "installation-card-content";

                const nombre =
                    document.createElement("strong");

                nombre.textContent =
                    alcance.nombre;

                const descripcion =
                    document.createElement("span");

                descripcion.textContent =
                    alcance.descripcion ||
                    "Sin descripción registrada.";

                const estado =
                    document.createElement("span");

                estado.textContent =
                    alcance.activo
                        ? "Activo"
                        : "Inactivo";

                contenido.append(
                    nombre,
                    descripcion,
                    estado
                );

                /*
                 * ACCIONES
                 */

                const acciones =
                    document.createElement("div");

                acciones.className =
                    "client-actions";


                const boton =
                    document.createElement("button");

                boton.type =
                    "button";

                boton.className =
                    "table-action";

                boton.title =
                    "Opciones";

                boton.setAttribute(
                    "aria-label",
                    "Opciones de " +
                    alcance.nombre
                );

                boton.dataset.alcanceId =
                    alcance.id;

                boton.dataset.alcanceNombre =
                    alcance.nombre;

                boton.innerHTML =
                    '<i class="bi bi-three-dots"></i>';


                const menu =
                    document.createElement("div");

                menu.className =
                    "client-actions-menu";


                const opcionVer =
                    document.createElement("button");

                opcionVer.type =
                    "button";

                opcionVer.className =
                    "client-menu-item";

                opcionVer.innerHTML =
                    '<i class="bi bi-eye"></i> Ver alcance';


                const opcionEditar =
                    document.createElement("button");

                opcionEditar.type =
                    "button";

                opcionEditar.className =
                    "client-menu-item";

                opcionEditar.innerHTML =
                    '<i class="bi bi-pencil"></i> Editar alcance';


                const opcionEliminar =
                    document.createElement("button");

                opcionEliminar.type =
                    "button";

                opcionEliminar.className =
                    "client-menu-item";

                opcionEliminar.innerHTML =
                    '<i class="bi bi-trash"></i> Eliminar alcance';


                menu.append(
                    opcionVer,
                    opcionEditar,
                    opcionEliminar
                );


                acciones.append(
                    boton,
                    menu
                );


                tarjeta.append(
                    icono,
                    contenido,
                    acciones
                );


                contenedor.appendChild(
                    tarjeta
                );

            }
        );

    } catch (error) {

        console.error(
            "Error al cargar alcances:",
            error
        );

        mostrarNotificacion(
            error.message ||
            "No se pudieron cargar los alcances.",
            "error"
        );

    }

}

/* MENÚ DE ACCIONES DE ALCANCES */
document.getElementById(
    "listaAlcances"
)?.addEventListener(
    "click",
    async function (evento) {

        /*
         * BOTÓN DE TRES PUNTOS
         */

        const boton =
            evento.target.closest(
                ".table-action"
            );


        if (boton) {

            evento.stopPropagation();


            const acciones =
                boton.closest(
                    ".client-actions"
                );


            if (!acciones) {
                return;
            }


            const menu =
                acciones.querySelector(
                    ".client-actions-menu"
                );


            if (!menu) {
                return;
            }


            /*
             * CERRAR OTROS MENÚS
             */

            document
                .querySelectorAll(
                    ".client-actions-menu.show"
                )
                .forEach(
                    function (otroMenu) {

                        if (
                            otroMenu !==
                            menu
                        ) {

                            otroMenu.classList.remove(
                                "show"
                            );

                            otroMenu.classList.remove(
                                "open-up"
                            );


                            const otraTarjeta =
                                otroMenu.closest(
                                    ".installation-card, .entity-card"
                                );


                            if (otraTarjeta) {

                                otraTarjeta.classList.remove(
                                    "menu-abierto"
                                );

                            }

                        }

                    }
                );


            /*
             * COMPROBAR SI YA ESTABA ABIERTO
             */

            const estabaAbierto =
                menu.classList.contains(
                    "show"
                );


            if (estabaAbierto) {

                menu.classList.remove(
                    "show"
                );

                menu.classList.remove(
                    "open-up"
                );


                const tarjeta =
                    menu.closest(
                        ".installation-card"
                    );


                if (tarjeta) {

                    tarjeta.classList.remove(
                        "menu-abierto"
                    );

                }


                return;
            }


            /*
             * MOSTRAR MENÚ
             */

            menu.classList.add(
                "show"
            );


            const tarjeta =
                menu.closest(
                    ".installation-card"
                );


            if (tarjeta) {

                tarjeta.classList.add(
                    "menu-abierto"
                );

            }


            /*
             * DETECTAR DIRECCIÓN
             */

            const rectBoton =
                boton.getBoundingClientRect();


            const alturaMenu =
                menu.offsetHeight;


            const anchoMenu =
                menu.offsetWidth;


            const espacioAbajo =
                window.innerHeight -
                rectBoton.bottom;


            const espacioArriba =
                rectBoton.top;


            const separacion =
                6;


            let abrirArriba =
                false;


            if (
                espacioAbajo <
                    alturaMenu +
                    separacion &&
                espacioArriba >
                    espacioAbajo
            ) {

                abrirArriba =
                    true;

            }


            /*
             * POSICIÓN VERTICAL
             */

            let posicionTop;


            if (abrirArriba) {

                posicionTop =
                    rectBoton.top -
                    alturaMenu -
                    separacion;

            } else {

                posicionTop =
                    rectBoton.bottom +
                    separacion;

            }


            /*
             * POSICIÓN HORIZONTAL
             */

            let posicionLeft =
                rectBoton.right -
                anchoMenu;


            if (
                posicionLeft +
                    anchoMenu >
                window.innerWidth -
                    10
            ) {

                posicionLeft =
                    window.innerWidth -
                    anchoMenu -
                    10;

            }


            if (
                posicionLeft <
                10
            ) {

                posicionLeft =
                    10;

            }


            menu.style.top =
                posicionTop +
                "px";


            menu.style.left =
                posicionLeft +
                "px";


            return;

        }


        /*
         * OPCIONES DEL MENÚ
         */

        const opcion =
            evento.target.closest(
                ".client-menu-item"
            );


        if (!opcion) {
            return;
        }


        evento.stopPropagation();


        const menu =
            opcion.closest(
                ".client-actions-menu"
            );


        if (menu) {

            menu.classList.remove(
                "show"
            );

            menu.classList.remove(
                "open-up"
            );


            const tarjeta =
                menu.closest(
                    ".installation-card"
                );


            if (tarjeta) {

                tarjeta.classList.remove(
                    "menu-abierto"
                );

            }

        }


        const acciones =
            opcion.closest(
                ".client-actions"
            );


        if (!acciones) {
            return;
        }


        const botonPrincipal =
            acciones.querySelector(
                ".table-action"
            );


        if (!botonPrincipal) {
            return;
        }


        const alcanceId =
            botonPrincipal.dataset.alcanceId;


        if (!alcanceId) {
            return;
        }


        /*
         * VER ALCANCE
         */

        if (
            opcion ===
            opcion.parentElement?.querySelector(
                ".client-menu-item:first-child"
            )
        ) {

            try {

                const respuesta =
                    await apiFetch(
                        `${API_URL}/alcances/${alcanceId}`
                    );


                if (!respuesta.ok) {

                    const error =
                        await respuesta.json();

                    throw new Error(
                        error.detail ||
                        "No se pudo consultar el alcance."
                    );

                }


                const alcance =
                    await respuesta.json();


                document.getElementById(
                    "verAlcanceNombre"
                ).textContent =
                    alcance.nombre ||
                    "Nombre no registrado";


                document.getElementById(
                    "verAlcanceDescripcion"
                ).textContent =
                    alcance.descripcion ||
                    "Sin descripción registrada.";


                document.getElementById(
                    "verAlcanceEstado"
                ).textContent =
                    alcance.activo
                        ? "Activo"
                        : "Inactivo";


                verAlcanceModal.show();


            } catch (error) {

                console.error(
                    "Error al consultar el alcance:",
                    error
                );


                mostrarNotificacion(
                    error.message ||
                    "No se pudo consultar el alcance.",
                    "error"
                );

            }

        }

        
        /*
         * EDITAR ALCANCE
         */

        if (
            opcion ===
            opcion.parentElement?.querySelector(
                ".client-menu-item:nth-child(2)"
            )
        ) {

            try {

                const respuesta =
                    await apiFetch(
                        `${API_URL}/alcances/${alcanceId}`
                    );


                if (!respuesta.ok) {

                    const error =
                        await respuesta.json();

                    throw new Error(
                        error.detail ||
                        "No se pudo consultar el alcance."
                    );

                }


                const alcance =
                    await respuesta.json();


                document.getElementById(
                    "editarAlcanceNombre"
                ).value =
                    alcance.nombre ||
                    "";

                document.getElementById(
                    "editarAlcanceDescripcion"
                ).value =
                    alcance.descripcion ||
                    "";


                document.getElementById(
                    "editarAlcanceEstado"
                ).value =
                    alcance.activo
                        ? "activo"
                        : "inactivo";


                alcanceEditandoId =
                    alcance.id;

                editarAlcanceModal.show();


            } catch (error) {

                console.error(
                    "Error al cargar el alcance para editar:",
                    error
                );


                mostrarNotificacion(
                    error.message ||
                    "No se pudo cargar el alcance para editar.",
                    "error"
                );

            }

        }

        /*
        * ELIMINAR ALCANCE
        */

        if (
            opcion ===
            opcion.parentElement?.querySelector(
                ".client-menu-item:nth-child(3)"
            )
        ) {

            alcanceEliminandoId =
                alcanceId;

            const nombreAlcance =
                botonPrincipal.dataset.alcanceNombre ||
                "este alcance";

            document.getElementById(
                "eliminarAlcanceMensaje"
            ).textContent =
                'Se eliminará el alcance "' +
                nombreAlcance +
                '". Esta acción no se puede deshacer.';

            eliminarAlcanceModal.show();

        }


    }
);

/* GUARDAR NUEVO ALCANCE */
document.getElementById(
    "btnGuardarAlcance"
)?.addEventListener(
    "click",
    async function () {

        const nombre =
            document.getElementById(
                "alcanceNombre"
            ).value.trim();

        const descripcion =
            document.getElementById(
                "alcanceDescripcion"
            ).value.trim();


        if (!nombre) {

            mostrarNotificacion(
                "El nombre del alcance es obligatorio.",
                "warning"
            );

            return;
        }

        const boton = this;
        const estadoCarga = iniciarCargaBoton(
            boton,
            "Guardando..."
        );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/alcances/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            nombre: nombre,
                            descripcion:
                                descripcion || null
                        })
                    }
                );

            if (!respuesta.ok) {

                const error =
                    await respuesta.json();

                throw new Error(
                    error.detail ||
                    "No se pudo crear el alcance."
                );
            }

            await respuesta.json();

            await cargarAlcances();

            nuevoAlcanceModal.hide();

            mostrarNotificacion(
                "El alcance se creó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al crear alcance:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo crear el alcance.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoCarga
            );

        }

    }
);


/* EDITAR ALCANCE */
document.getElementById(
    "btnActualizarAlcance"
)?.addEventListener(
    "click",
    async function () {

        const modal =
            document.getElementById(
                "editarAlcanceModal"
            );

        const alcanceId =
            alcanceEditandoId;

        const nombre =
            document.getElementById(
                "editarAlcanceNombre"
            ).value.trim();

        const descripcion =
            document.getElementById(
                "editarAlcanceDescripcion"
            ).value.trim();

        const estado =
            document.getElementById(
                "editarAlcanceEstado"
            ).value;

        if (!alcanceId) {

            mostrarNotificacion(
                "No se identificó el alcance que deseas actualizar.",
                "warning"
            );

            return;
        }

        if (!nombre) {

            mostrarNotificacion(
                "El nombre del alcance es obligatorio.",
                "warning"
            );

            return;
        }

        const boton = this;
        const estadoCarga = iniciarCargaBoton(
            boton,
            "Guardando cambios..."
        );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/alcances/${alcanceId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            nombre: nombre,
                            descripcion:
                                descripcion || null,
                            activo:
                                estado === "activo"
                        })
                    }
                );

            if (!respuesta.ok) {

                const error =
                    await respuesta.json();

                throw new Error(
                    error.detail ||
                    "No se pudo actualizar el alcance."
                );

            }

            await respuesta.json();

            await cargarAlcances();

            editarAlcanceModal.hide();

            mostrarNotificacion(
                "El alcance se actualizó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al actualizar el alcance:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo actualizar el alcance.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoCarga
            );

        }

    }
);

/* CONFIRMAR ELIMINACIÓN DE ALCANCE */
document.getElementById(
    "btnConfirmarEliminarAlcance"
)?.addEventListener(
    "click",
    async function () {

        const alcanceId =
            alcanceEliminandoId;

        if (!alcanceId) {
            mostrarNotificacion(
                "No se identificó el alcance que deseas eliminar.",
                "warning"
            );
            return;
        }

        const boton = this;
        const estadoCarga = iniciarCargaBoton(
            boton,
            "Eliminando..."
        );

        try {

            const respuesta =
                await apiFetch(
                    `${API_URL}/alcances/${alcanceId}`,
                    {
                        method: "DELETE"
                    }
                );

            if (!respuesta.ok) {
                const error =
                    await respuesta.json();

                throw new Error(
                    error.detail ||
                    "No se pudo eliminar el alcance."
                );
            }

            await cargarAlcances();

            eliminarAlcanceModal.hide();

            alcanceEliminandoId = null;

            mostrarNotificacion(
                "El alcance se eliminó correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al eliminar el alcance:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo eliminar el alcance.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoCarga
            );

        }

    }
);


/* =========================================================
   19. NUEVO REQUISITO
   ========================================================= */


/* ABRIR MODAL DE NUEVO REQUISITO */

/* BOTÓN GENERAL */
document.getElementById(
    "btnNuevoRequisito"
)?.addEventListener(
    "click",
    function () {

        document.getElementById(
            "requisitoNombre"
        ).value = "";

        document.getElementById(
            "requisitoDescripcion"
        ).value = "";

        const selectAlcance =
            document.getElementById(
                "requisitoAlcance"
            );

        selectAlcance.disabled = false;
        selectAlcance.value = "";

        const tiposDocumento =
            document.getElementById(
                "requisitoTiposDocumento"
            );

        Array.from(
            tiposDocumento.options
        ).forEach(
            function (opcion) {
                opcion.selected = false;
            }
        );

        document.getElementById(
            "requisitoObligatorio"
        ).checked = true;

        nuevoRequisitoModal.show();

    }
);

/* BOTONES DE CADA TARJETA DE ALCANCE */
document.getElementById(
    "listaRequisitos"
)?.addEventListener(
    "click",
    function (evento) {

        const boton =
            evento.target.closest(
                "button[data-alcance-id]"
            );

        if (!boton) {
            return;
        }

        document.getElementById(
            "requisitoNombre"
        ).value = "";

        document.getElementById(
            "requisitoDescripcion"
        ).value = "";

        const selectAlcance =
            document.getElementById(
                "requisitoAlcance"
            );

        selectAlcance.value =
            boton.dataset.alcanceId;

        selectAlcance.disabled = true;

        const tiposDocumento =
            document.getElementById(
                "requisitoTiposDocumento"
            );

        Array.from(
            tiposDocumento.options
        ).forEach(
            function (opcion) {
                opcion.selected = false;
            }
        );

        document.getElementById(
            "requisitoObligatorio"
        ).checked = true;

        nuevoRequisitoModal.show();

    }
);

/* CARGAR REQUISITOS FOTOGRÁFICOS */
async function cargarRequisitos() {

    const lista =
        document.getElementById(
            "listaRequisitos"
        );

    if (!lista) {
        return;
    }

    try {

        const [
            respuestaAlcances,
            respuestaRequisitos,
            respuestaTiposDocumento
        ] = await Promise.all([

            apiFetch(`${API_URL}/alcances/`),

            apiFetch(`${API_URL}/requisitos-fotograficos/`),

            apiFetch(`${API_URL}/tipos-documento/`)

        ]);

        if (!respuestaAlcances.ok) {

            throw new Error(
                await obtenerMensajeError(
                    respuestaAlcances,
                    "No se pudieron obtener los alcances."
                )
            );

        }

        if (!respuestaRequisitos.ok) {

            throw new Error(
                await obtenerMensajeError(
                    respuestaRequisitos,
                    "No se pudieron obtener los requisitos fotográficos."
                )
            );

        }

        if (!respuestaTiposDocumento.ok) {

            throw new Error(
                await obtenerMensajeError(
                    respuestaTiposDocumento,
                    "No se pudieron obtener los tipos de documento."
                )
            );

        }

        const alcances =
            await respuestaAlcances.json();

        const requisitos =
            await respuestaRequisitos.json();

        const totalRequisitos = document.getElementById("totalRequisitos");

        if (totalRequisitos) {
            totalRequisitos.textContent = requisitos.length;
        }

        const tiposDocumento = 
            await respuestaTiposDocumento.json();

        const tiposDocumentoPorId = new Map(
            tiposDocumento.map(function (tipo) {
                return [String(tipo.id), tipo.nombre];
            })
        );

        lista.innerHTML = "";

        lista.classList.remove("requirement-list");

        lista.classList.add("client-project-list");

        if (alcances.length === 0) {

            const mensaje =
                document.createElement("div");

            mensaje.className =
                "text-muted";

            mensaje.textContent =
                "No hay alcances registrados.";

            lista.appendChild(mensaje);

            return;
        }

        /* MOSTRAR CADA ALCANCE */
        alcances.forEach(function (alcance) {

            const requisitosAlcance =
                requisitos.filter(function (requisito) {

                    return String(requisito.alcance_id) ===
                        String(alcance.id);

                });

            /* TARJETA PRINCIPAL */
            const tarjeta =
                document.createElement("article");

            tarjeta.className =
                "client-project-card";

            /* CABECERA DEL ALCANCE */
            const cabecera =
                document.createElement("div");

            cabecera.className =
                "client-project-header";

            const principal =
                document.createElement("div");

            principal.className =
                "client-project-main";

            const icono =
                document.createElement("div");

            icono.className =
                "client-project-icon";

            icono.innerHTML =
                '<i class="bi bi-diagram-3"></i>';

            const informacion =
                document.createElement("div");

            const nombre =
                document.createElement("strong");

            nombre.textContent =
                alcance.nombre;

            const detalle =
                document.createElement("span");

            const cantidad =
                requisitosAlcance.length;

            detalle.textContent =
                cantidad +
                (
                    cantidad === 1
                        ? " requisito fotográfico"
                        : " requisitos fotográficos"
                );

            informacion.append(
                nombre,
                detalle
            );

            principal.append(
                icono,
                informacion
            );

            /* BOTÓN NUEVO REQUISITO */
            const botonNuevo =
                document.createElement("button");

            botonNuevo.type = "button";

            botonNuevo.className =
                "btn btn-outline-primary";

            botonNuevo.dataset.alcanceId =
                alcance.id;

            botonNuevo.dataset.alcanceNombre =
                alcance.nombre;

            botonNuevo.innerHTML =
                '<i class="bi bi-plus-lg"></i> Requisito';

            /* FLECHA DESPLEGABLE */
            const botonToggle =
                document.createElement("button");

            botonToggle.type = "button";

            botonToggle.className =
                "btn-icon client-toggle";

            botonToggle.title =
                "Mostrar requisitos";

            botonToggle.setAttribute(
                "aria-label",
                "Mostrar requisitos de " + alcance.nombre
            );

            botonToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            botonToggle.innerHTML =
                '<i class="bi bi-chevron-down"></i>';

            /* ACCIONES DE LA CABECERA */
            const acciones =
                document.createElement("div");

            acciones.className =
                "client-project-actions";

            acciones.append(
                botonNuevo,
                botonToggle
            );

            cabecera.append(
                principal,
                acciones
            );

            /* CONTENIDO DESPLEGABLE */
            const cuerpo =
                document.createElement("div");

            cuerpo.className =
                "client-project-body";

            cuerpo.style.display =
                "none";

            /* LISTA DE REQUISITOS */
            const listaInterna =
                document.createElement("div");

            listaInterna.style.display =
                "flex";

            listaInterna.style.flexDirection =
                "column";

            listaInterna.style.gap =
                "10px";

            listaInterna.style.marginTop =
                "12px";

            if (requisitosAlcance.length === 0) {

                const mensaje =
                    document.createElement("div");

                mensaje.className =
                    "text-muted";

                mensaje.style.fontSize =
                    "12px";

                mensaje.style.padding =
                    "14px";

                mensaje.textContent =
                    "Este alcance todavía no tiene requisitos fotográficos.";

                listaInterna.appendChild(
                    mensaje
                );

            } else {

                requisitosAlcance.forEach(
                    function (requisito, indice) {

                        /* TARJETA DEL REQUISITO */
                        const elemento =
                            document.createElement("div");

                        elemento.className =
                            "project-item";

                        elemento.style.marginTop =
                            "0";

                        /* CABECERA DEL REQUISITO */
                        const cabeceraRequisito =
                            document.createElement("div");

                        cabeceraRequisito.className =
                            "project-item-header";

                        const principalRequisito =
                            document.createElement("div");

                        principalRequisito.className =
                            "project-item-main";

                        const iconoRequisito =
                            document.createElement("div");

                        iconoRequisito.className =
                            "project-item-icon";

                        iconoRequisito.innerHTML =
                            '<i class="bi bi-camera"></i>';

                        const contenido =
                            document.createElement("div");

                        contenido.style.minWidth =
                            "0";

                        const nombreRequisito =
                            document.createElement("strong");

                        nombreRequisito.textContent =
                            requisito.nombre;

                        const descripcion =
                            document.createElement("span");

                        descripcion.textContent =
                            requisito.descripcion ||
                            "Sin descripción";

                        contenido.append(
                            nombreRequisito,
                            descripcion
                        );

                        /* TIPOS DE DOCUMENTO ASOCIADOS */
                        const tiposAsociados = document.createElement("div");

                        tiposAsociados.style.display = "flex";
                        tiposAsociados.style.flexWrap = "wrap";
                        tiposAsociados.style.gap = "6px";
                        tiposAsociados.style.marginTop = "8px";

                        const idsTipos = requisito.tipos_documento_ids || [];

                        if (idsTipos.length > 0) {

                            idsTipos.forEach(function (tipoId) {

                                const nombreTipo = tiposDocumentoPorId.get(
                                    String(tipoId)
                                );

                                if (!nombreTipo) {
                                    return;
                                }

                                const etiqueta = document.createElement("span");

                                etiqueta.className = "badge text-bg-light border";
                                etiqueta.textContent = nombreTipo;

                                tiposAsociados.appendChild(etiqueta);

                            });

                        } else {

                            const sinTipos = document.createElement("span");

                            sinTipos.className = "text-muted";
                            sinTipos.style.fontSize = "12px";
                            sinTipos.textContent = "Sin tipos de documento asociados";

                            tiposAsociados.appendChild(sinTipos);

                        }

                        contenido.appendChild(tiposAsociados);


                        principalRequisito.append(
                            iconoRequisito,
                            contenido
                        );

                        /* ACCIONES DEL REQUISITO */
                        const accionesRequisito =
                            document.createElement("div");

                        accionesRequisito.className =
                            "project-item-actions";

                        /* ESTADO OBLIGATORIO U OPCIONAL */
                        const estado =
                            document.createElement("span");

                        estado.className =
                            "required-badge";

                        estado.textContent =
                            requisito.obligatorio
                                ? "Obligatorio"
                                : "Opcional";

                        /* ESTADO ACTIVO O INACTIVO */
                        const estadoActivo =
                            document.createElement("span");

                        estadoActivo.className =
                            requisito.activo
                                ? "status-badge success"
                                : "status-badge neutral";

                        estadoActivo.textContent =
                            requisito.activo
                                ? "Activo"
                                : "Inactivo";

                        /* BOTÓN EDITAR */
                        const botonEditar =
                            document.createElement("button");

                        botonEditar.type = "button";

                        botonEditar.className = "btn-icon";

                        botonEditar.title = "Editar requisito";

                        botonEditar.setAttribute(
                            "aria-label",
                            "Editar requisito " + requisito.nombre
                        );

                        botonEditar.dataset.requisitoId =
                            requisito.id;

                        botonEditar.innerHTML =
                            '<i class="bi bi-pencil"></i>';

                        /* BOTÓN ELIMINAR */
                        const botonEliminar =
                            document.createElement("button");

                        botonEliminar.type = "button";

                        botonEliminar.className = "btn-icon";

                        botonEliminar.title = "Eliminar requisito";

                        botonEliminar.setAttribute(
                            "aria-label",
                            "Eliminar requisito " + requisito.nombre
                        );

                        botonEliminar.dataset.eliminarRequisitoId =
                            requisito.id;

                        botonEliminar.innerHTML =
                            '<i class="bi bi-trash3"></i>';

                        /* AGREGAR ELEMENTOS */
                        accionesRequisito.append(
                            estado,
                            estadoActivo,
                            botonEditar,
                            botonEliminar
                        );

                        cabeceraRequisito.append(
                            principalRequisito,
                            accionesRequisito
                        );

                        elemento.appendChild(
                            cabeceraRequisito
                        );

                        listaInterna.appendChild(
                            elemento
                        );

                    }
                );

            }

            cuerpo.appendChild(
                listaInterna
            );

            tarjeta.append(
                cabecera,
                cuerpo
            );

            lista.appendChild(
                tarjeta
            );

        });

    } catch (error) {

        console.error(
            "Error al cargar requisitos fotográficos:",
            error
        );

        lista.textContent =
            "No se pudieron cargar los alcances y sus requisitos.";

        mostrarNotificacion(
            error.message ||
                "No se pudo conectar con el servidor.",
            "error"
        );

    }
}


/* CARGAR ALCANCES EN EL SELECTOR */
async function cargarAlcancesRequisito() {

    const selector =
        document.getElementById("requisitoAlcance");

    const respuesta =
        await apiFetch(`${API_URL}/alcances/`);

    if (!respuesta.ok) {
        throw new Error(
            await obtenerMensajeError(
                respuesta,
                "No se pudieron cargar los alcances."
            )
        );
    }

    const alcances = await respuesta.json();

    selector.innerHTML =
        '<option value="">Seleccionar alcance</option>';

    alcances
        .filter(alcance => alcance.activo)
        .forEach(alcance => {

            const opcion = document.createElement("option");

            opcion.value = alcance.id;
            opcion.textContent = alcance.nombre;

            selector.appendChild(opcion);
        });
}


/* CARGAR TIPOS DE DOCUMENTO ACTIVOS */
async function cargarTiposDocumentoRequisito() {

    const contenedor =
        document.getElementById("requisitoTiposDocumento");

    const respuesta =
        await apiFetch(`${API_URL}/tipos-documento/activos`);

    if (!respuesta.ok) {
        throw new Error(
            await obtenerMensajeError(
                respuesta,
                "No se pudieron cargar los tipos de documento."
            )
        );
    }

    const tipos = await respuesta.json();

    contenedor.innerHTML = "";

    if (tipos.length === 0) {

        const mensaje = document.createElement("div");

        mensaje.className = "text-muted";
        mensaje.textContent =
            "No hay tipos de documento activos registrados.";

        contenedor.appendChild(mensaje);

        return;
    }

    const normalizarNombre = (nombre) =>
        nombre
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    const ordenDocumentos = [
        "tss",
        "reporte pre power on",
        "reporte de instalacion",
        "checklist final"
    ];

    tipos.sort((a, b) => {
        const nombreA = normalizarNombre(a.nombre);
        const nombreB = normalizarNombre(b.nombre);

        const indiceA = ordenDocumentos.indexOf(nombreA);
        const indiceB = ordenDocumentos.indexOf(nombreB);

        const posicionA = indiceA === -1 ? Infinity : indiceA;
        const posicionB = indiceB === -1 ? Infinity : indiceB;

        return posicionA - posicionB;
    });

    tipos.forEach(tipo => {

        const tarjeta = document.createElement("label");

        tarjeta.className = "document-type-option";

        const casilla = document.createElement("input");

        casilla.type = "checkbox";
        casilla.name = "requisitoTipoDocumento";
        casilla.value = tipo.id;

        const icono = document.createElement("span");

        icono.className = "document-type-icon";
        icono.innerHTML = '<i class="bi bi-file-earmark-text"></i>';

        const contenido = document.createElement("span");

        contenido.className = "document-type-content";

        const nombre = document.createElement("strong");

        nombre.textContent = tipo.nombre;

        const descripcion = document.createElement("small");

        descripcion.textContent =
            tipo.descripcion || "Tipo de documento registrado en el sistema.";

        contenido.append(nombre, descripcion);

        tarjeta.append(casilla, icono, contenido);

        contenedor.appendChild(tarjeta);
    });
}


/* PREPARAR EL MODAL PARA UN NUEVO REQUISITO */
async function prepararNuevoRequisito(alcanceId = null) {

    document.getElementById("requisitoNombre").value = "";
    document.getElementById("requisitoDescripcion").value = "";
    document.getElementById("requisitoObligatorio").checked = true;

    const selectorAlcance =
        document.getElementById("requisitoAlcance");

    selectorAlcance.disabled = false;
    selectorAlcance.value = "";

    document.getElementById("requisitoTiposDocumento")
        .querySelectorAll('input[name="requisitoTipoDocumento"]')
        .forEach(function (casilla) {
            casilla.checked = false;
        });

    await Promise.all([
        cargarAlcancesRequisito(),
        cargarTiposDocumentoRequisito()
    ]);

    if (alcanceId !== null) {

        selectorAlcance.value = String(alcanceId);
        selectorAlcance.disabled = true;
    }

    nuevoRequisitoModal.show();
}


/* BOTÓN PRINCIPAL: NUEVO REQUISITO */
document
    .getElementById("btnNuevoRequisito")
    ?.addEventListener("click", async function () {

        try {
            await prepararNuevoRequisito();
        } catch (error) {
            mostrarNotificacion(
                error.message || "No se pudo preparar el formulario.",
                "error"
            );
        }
    });


/* BOTONES DE ALCANCES Y REQUISITOS */
document
    .getElementById("listaRequisitos")
    ?.addEventListener("click", async function (evento) {

        /* NUEVO REQUISITO */
        const botonNuevo = evento.target.closest(
            "button[data-alcance-id]"
        );

        if (botonNuevo) {

            try {

                await prepararNuevoRequisito(
                    botonNuevo.dataset.alcanceId
                );

            } catch (error) {

                mostrarNotificacion(
                    error.message ||
                        "No se pudo preparar el formulario.",
                    "error"
                );
            }

            return;
        }

        /* EDITAR REQUISITO */
        const botonEditar = evento.target.closest(
            "button[data-requisito-id]"
        );

        if (botonEditar) {

            await prepararEditarRequisito(
                botonEditar.dataset.requisitoId
            );

            return;
        }

        /* ELIMINAR REQUISITO */
        const botonEliminar = evento.target.closest(
            "button[data-eliminar-requisito-id]"
        );

        if (botonEliminar) {

            requisitoEliminandoId =
                botonEliminar.dataset.eliminarRequisitoId;

            const requisito = botonEliminar
                .closest(".project-item")
                ?.querySelector(".project-item-main strong");

            const mensaje = document.getElementById(
                "eliminarRequisitoMensaje"
            );

            mensaje.textContent = requisito
                ? `Se eliminará el requisito "${requisito.textContent}". Esta acción no se puede deshacer.`
                : "Esta acción eliminará el registro del requisito fotográfico.";

            eliminarRequisitoModal.show();
        }
    });

/* GUARDAR REQUISITO FOTOGRÁFICO */
document.getElementById("btnGuardarRequisito")?.addEventListener(
    "click",
    async function () {

        const nombre = document.getElementById("requisitoNombre").value.trim();
        const descripcion = document.getElementById("requisitoDescripcion").value.trim();
        const alcanceId = document.getElementById("requisitoAlcance").value;
        const obligatorio = document.getElementById("requisitoObligatorio").checked;

        const tiposDocumentoIds = Array.from(
            document.querySelectorAll(
                '#requisitoTiposDocumento input[name="requisitoTipoDocumento"]:checked'
            )
        ).map(casilla => Number(casilla.value));

        if (!nombre) {
            mostrarNotificacion("Ingresa el nombre del requisito.", "error");
            return;
        }

        if (!alcanceId) {
            mostrarNotificacion("Selecciona un alcance.", "error");
            return;
        }

        if (tiposDocumentoIds.length === 0) {
            mostrarNotificacion("Selecciona al menos un tipo de documento.", "error");
            return;
        }

        const datos = {
            nombre: nombre,
            descripcion: descripcion || null,
            alcance_id: Number(alcanceId),
            tipos_documento_ids: tiposDocumentoIds,
            obligatorio: obligatorio,
            orden: 1,
            activo: true
        };

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Guardando..."
            );

        try {
            const respuesta = await apiFetch(
                `${API_URL}/requisitos-fotograficos/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                }
            );

            if (!respuesta.ok) {
                const error = await respuesta.json();
                throw new Error(
                    error.detail || "No se pudo crear el requisito."
                );
            }

            mostrarNotificacion(
                "Requisito creado correctamente.",
                "success"
            );

            nuevoRequisitoModal.hide();

            await cargarRequisitos();

        } catch (error) {
            mostrarNotificacion(
                error.message || "Ocurrió un error al crear el requisito.",
                "error"
            );
        } finally {
            finalizarCargaBoton(
                boton,
                estadoBoton
            );
        }
    }
);

/* ACTUALIZAR REQUISITO FOTOGRÁFICO */
document
    .getElementById("btnActualizarRequisito")
    ?.addEventListener("click", async function () {

        if (requisitoEditandoId === null) {
            mostrarNotificacion(
                "No se ha seleccionado un requisito para editar.",
                "error"
            );
            return;
        }

        const nombre = document.getElementById(
            "editarRequisitoNombre"
        ).value.trim();

        const descripcion = document.getElementById(
            "editarRequisitoDescripcion"
        ).value.trim();

        const alcanceId = document.getElementById(
            "editarRequisitoAlcance"
        ).value;

        const obligatorio = document.getElementById(
            "editarRequisitoObligatorio"
        ).checked;

        const activo = document.getElementById(
            "editarRequisitoEstado"
        ).value === "activo";

        const tiposDocumentoIds = Array.from(
            document.querySelectorAll(
                '#editarRequisitoTiposDocumento input[name="editarRequisitoTipoDocumento"]:checked'
            )
        ).map(function (casilla) {
            return Number(casilla.value);
        });

        if (!nombre) {
            mostrarNotificacion(
                "Ingresa el nombre del requisito.",
                "error"
            );
            return;
        }

        if (!alcanceId) {
            mostrarNotificacion(
                "Selecciona un alcance.",
                "error"
            );
            return;
        }

        if (tiposDocumentoIds.length === 0) {
            mostrarNotificacion(
                "Selecciona al menos un tipo de documento.",
                "error"
            );
            return;
        }

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Actualizando..."
            );

        try {

            const respuestaActual = await apiFetch(
                `${API_URL}/requisitos-fotograficos/${requisitoEditandoId}`
            );

            if (!respuestaActual.ok) {
                throw new Error(
                    await obtenerMensajeError(
                        respuestaActual,
                        "No se pudo obtener el requisito actual."
                    )
                );
            }

            const requisitoActual =
                await respuestaActual.json();

            const datos = {
                nombre: nombre,
                descripcion: descripcion || null,
                alcance_id: Number(alcanceId),
                tipos_documento_ids: tiposDocumentoIds,
                obligatorio: obligatorio,
                orden: requisitoActual.orden,
                activo: activo
            };

            const respuesta = await apiFetch(
                `${API_URL}/requisitos-fotograficos/${requisitoEditandoId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo actualizar el requisito."
                    )
                );
            }

            mostrarNotificacion(
                "Requisito actualizado correctamente.",
                "success"
            );

            editarRequisitoModal.hide();

            requisitoEditandoId = null;

            await cargarRequisitos();

        } catch (error) {

            mostrarNotificacion(
                error.message ||
                    "Ocurrió un error al actualizar el requisito.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }
    });

/* PREPARAR EDICIÓN DE REQUISITO */
async function prepararEditarRequisito(requisitoId) {

    try {

        const respuesta = await apiFetch(
            `${API_URL}/requisitos-fotograficos/${requisitoId}`
        );

        if (!respuesta.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuesta,
                    "No se pudo obtener el requisito fotográfico."
                )
            );
        }

        const requisito = await respuesta.json();

        requisitoEditandoId = requisito.id;

        document.getElementById(
            "editarRequisitoNombre"
        ).value = requisito.nombre || "";

        document.getElementById(
            "editarRequisitoDescripcion"
        ).value = requisito.descripcion || "";

        document.getElementById(
            "editarRequisitoObligatorio"
        ).checked = requisito.obligatorio;

        document.getElementById(
            "editarRequisitoEstado"
        ).value = requisito.activo
            ? "activo"
            : "inactivo";

        /* CARGAR ALCANCES */
        const selectorAlcance =
            document.getElementById(
                "editarRequisitoAlcance"
            );

        const respuestaAlcances = await apiFetch(
            `${API_URL}/alcances/`
        );

        if (!respuestaAlcances.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuestaAlcances,
                    "No se pudieron cargar los alcances."
                )
            );
        }

        const alcances = await respuestaAlcances.json();

        selectorAlcance.innerHTML =
            '<option value="">Seleccionar alcance</option>';

        alcances
            .filter(function (alcance) {
                return alcance.activo ||
                    String(alcance.id) ===
                    String(requisito.alcance_id);
            })
            .forEach(function (alcance) {

                const opcion =
                    document.createElement("option");

                opcion.value = alcance.id;
                opcion.textContent = alcance.nombre;

                selectorAlcance.appendChild(opcion);
            });

        selectorAlcance.value =
            String(requisito.alcance_id);

        /* CARGAR TIPOS DE DOCUMENTO */
        const contenedor =
            document.getElementById(
                "editarRequisitoTiposDocumento"
            );

        contenedor.innerHTML =
            '<div class="text-muted">Cargando tipos de documento...</div>';

        const respuestaTipos = await apiFetch(
            `${API_URL}/tipos-documento/activos`
        );

        if (!respuestaTipos.ok) {
            throw new Error(
                await obtenerMensajeError(
                    respuestaTipos,
                    "No se pudieron cargar los tipos de documento."
                )
            );
        }

        const tipos = await respuestaTipos.json();

        contenedor.innerHTML = "";

        if (tipos.length === 0) {

            const mensaje =
                document.createElement("div");

            mensaje.className = "text-muted";

            mensaje.textContent =
                "No hay tipos de documento activos registrados.";

            contenedor.appendChild(mensaje);

        } else {

            const idsAsociados = new Set(
                (requisito.tipos_documento_ids || [])
                    .map(String)
            );

            const normalizarNombre = function (nombre) {
                return nombre
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, " ");
            };

            const ordenDocumentos = [
                "tss",
                "reporte pre power on",
                "reporte de instalacion",
                "checklist final",
                "checklist de instalacion"
            ];

            tipos.sort(function (a, b) {

                const indiceA = ordenDocumentos.indexOf(
                    normalizarNombre(a.nombre)
                );

                const indiceB = ordenDocumentos.indexOf(
                    normalizarNombre(b.nombre)
                );

                const posicionA =
                    indiceA === -1 ? Infinity : indiceA;

                const posicionB =
                    indiceB === -1 ? Infinity : indiceB;

                return posicionA - posicionB;
            });

            tipos.forEach(function (tipo) {

                const tarjeta =
                    document.createElement("label");

                tarjeta.className =
                    "document-type-option";

                const casilla =
                    document.createElement("input");

                casilla.type = "checkbox";
                casilla.name = "editarRequisitoTipoDocumento";
                casilla.value = tipo.id;

                casilla.checked =
                    idsAsociados.has(String(tipo.id));

                const icono =
                    document.createElement("span");

                icono.className = "document-type-icon";

                icono.innerHTML =
                    '<i class="bi bi-file-earmark-text"></i>';

                const contenido =
                    document.createElement("span");

                contenido.className =
                    "document-type-content";

                const nombre =
                    document.createElement("strong");

                nombre.textContent = tipo.nombre;

                const descripcion =
                    document.createElement("small");

                descripcion.textContent =
                    tipo.descripcion ||
                    "Tipo de documento registrado en el sistema.";

                contenido.append(
                    nombre,
                    descripcion
                );

                tarjeta.append(
                    casilla,
                    icono,
                    contenido
                );

                contenedor.appendChild(tarjeta);
            });
        }

        editarRequisitoModal.show();

    } catch (error) {

        console.error(
            "Error al preparar la edición del requisito:",
            error
        );

        mostrarNotificacion(
            error.message ||
                "No se pudo preparar la edición del requisito.",
            "error"
        );
    }
}

/* CONFIRMAR ELIMINACIÓN DE REQUISITO */
document
    .getElementById("btnConfirmarEliminarRequisito")
    ?.addEventListener("click", async function () {

        if (requisitoEliminandoId === null) {
            mostrarNotificacion(
                "No se ha seleccionado un requisito para eliminar.",
                "error"
            );
            return;
        }

        const boton = this;

        const estadoBoton =
            iniciarCargaBoton(
                boton,
                "Eliminando..."
            );

        try {

            const respuesta = await apiFetch(
                `${API_URL}/requisitos-fotograficos/${requisitoEliminandoId}`,
                {
                    method: "DELETE"
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    await obtenerMensajeError(
                        respuesta,
                        "No se pudo eliminar el requisito fotográfico."
                    )
                );
            }

            mostrarNotificacion(
                "Requisito eliminado correctamente.",
                "success"
            );

            eliminarRequisitoModal.hide();

            requisitoEliminandoId = null;

            await cargarRequisitos();

        } catch (error) {

            mostrarNotificacion(
                error.message ||
                    "Ocurrió un error al eliminar el requisito.",
                "error"
            );

        } finally {

            finalizarCargaBoton(
                boton,
                estadoBoton
            );

        }
    });

/* =========================================================
   20. INICIALIZACIÓN
   ========================================================= */

cargarUsuarios();
cargarClientes();
cargarProyectos();
cargarTiposDocumento();
cargarAlcances();
cargarRequisitos();
cargarPlantillas();

// Actualizar los estados de conexión cada 30 segundos.
setInterval(actualizarEstadosConexion, 30000);