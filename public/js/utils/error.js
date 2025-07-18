// public/js/utils/error.js
// * Módulo utilitario para manejar errores de manera consistente en toda la aplicación

/**
 * Muestra un error con diseño atractivo y opciones de acción
 * @param {HTMLElement} container - Contenedor donde mostrar el error
 * @param {string} title - Título del error
 * @param {string} message - Mensaje detallado del error
 * @param {Object} options - Opciones adicionales
 * @param {string} options.action - Acción que falló (ej: 'cargar', 'guardar', 'eliminar')
 * @param {string} options.resource - Recurso afectado (ej: 'asignaciones', 'empleados')
 * @param {string} options.backRoute - Ruta para el botón "Volver"
 * @param {Function} options.onRetry - Función para reintentar la acción
 */
export function showError(container, title, message, options = {}) {
    const target = container || document.getElementById('content-area');
    const { action = 'procesar', resource = 'datos', backRoute, onRetry } = options;

    target.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
            <!-- Icono de error -->
            <div class="mb-4">
                <div class="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" style="width: 64px; height: 64px;">
                    <i class="fa fa-exclamation-triangle text-danger" style="font-size: 2rem;"></i>
                </div>
            </div>
            
            <!-- Título del error -->
            <h3 class="h5 fw-semibold text-dark mb-2 text-center">${title}</h3>
            
            <!-- Mensaje del error -->
            <p class="text-muted text-center mb-4" style="max-width: 400px;">${message}</p>
            
            <!-- Botones de acción -->
            <div class="d-flex flex-column flex-sm-row gap-2">
                ${onRetry ? `
                    <button onclick="window.retryAction()" class="btn btn-primary btn-sm">
                        <i class="fa fa-refresh me-2"></i>
                        REINTENTAR
                    </button>
                ` : ''}
                
                <!-- ${backRoute ? `
                    <button onclick="window.navigateTo('${backRoute}')" class="btn btn-outline-danger btn-sm">
                        <i class="fa fa-arrow-left me-2"></i>
                        VOLVER
                    </button>
                ` : ''} -->
            </div>
        </div>
    `;

    // Hacer la función de retry disponible globalmente si existe
    if (onRetry) {
        window.retryAction = onRetry;
    }
}

/**
// * Muestra un error para listas de datos
// * @param {HTMLElement} container - Contenedor donde mostrar el error
// * @param {string} resource - Recurso que falló al cargar
// * @param {string} message - Mensaje detallado del error
// * @param {string} backRoute - Ruta para volver
// * @param {Function} onRetry - Función para reintentar
// */
export function showListError(container, resource, message, backRoute = null, onRetry = null) {
    showError(container, `Error al cargar ${resource}`, message, {
        action: 'cargar',
        resource: resource,
        backRoute: backRoute,
        onRetry: onRetry
    });
}

/**
// * Muestra un error para formularios
// * @param {string} action - Acción que falló (Crear/Editar)
// * @param {string} resource - Recurso que se estaba procesando
// * @param {string} message - Mensaje detallado del error
// * @param {Function} onRetry - Función para reintentar
// */
export function showFormError(action, resource, message, onRetry = null) {
    showError(null, `Error al ${action.toLowerCase()} ${resource}`, message, {
        action: action.toLowerCase(),
        resource: resource,
        onRetry: onRetry
    });
}

/**
// * Muestra un error para detalles
// * @param {string} resource - Recurso del que se cargaban los detalles
// * @param {string|number} id - ID del recurso
// * @param {string} message - Mensaje detallado del error
// * @param {string} backRoute - Ruta para volver
// * @param {Function} onRetry - Función para reintentar
// */
export function showDetailsError(resource, id, message, backRoute = null, onRetry = null) {
    showError(null, `Error al cargar detalles del ${resource}`, message, {
        action: 'cargar',
        resource: resource,
        backRoute: backRoute,
        onRetry: onRetry
    });
}

/**
 * Muestra un error simple sin botones de acción
 * @param {HTMLElement} container - Contenedor donde mostrar el error
 * @param {string} message - Mensaje del error
 */
export function showSimpleError(container, message) {
    const target = container || document.getElementById('content-area');
    target.innerHTML = `
        <div class="d-flex align-items-center justify-content-center py-4">
            <div class="alert alert-danger d-flex align-items-center" role="alert" style="max-width: 500px;">
                <i class="fa fa-exclamation-triangle me-3"></i>
                <div>${message}</div>
            </div>
        </div>
    `;
}

/**
 * Muestra un mensaje cuando no hay datos en una tabla
 * @param {HTMLElement} container - Contenedor donde mostrar el mensaje
 * @param {string} resource - Recurso que está vacío (ej: 'equipos', 'empleados')
 * @param {string} createRoute - Ruta para crear nuevo elemento (opcional)
 */
export function showEmptyState(container, resource, createRoute = null) {
    const target = container || document.getElementById('content-area');
    target.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
            <!-- Icono de estado vacío -->
            <div class="mb-4">
                <div class="d-flex align-items-center justify-content-center rounded-circle bg-light" style="width: 80px; height: 80px;">
                    <i class="fa fa-inbox text-muted" style="font-size: 2.5rem;"></i>
                </div>
            </div>
            
            <!-- Título -->
            <h4 class="h5 fw-semibold text-dark mb-2 text-center">NO HAY ${resource.toUpperCase()} REGISTRADOS</h4>
            
            <!-- Mensaje -->
            <p class="text-muted text-center mb-4" style="max-width: 400px;">
                AÚN NO SE HAN REGISTRADO ${resource.toUpperCase()} EN EL SISTEMA. 
                ${createRoute ? `PUEDES COMENZAR CREANDO EL PRIMER ${resource.slice(0, -1).toUpperCase()}.` : ''}
            </p>
            
            <!-- Botón de acción -->
            ${createRoute ? `
                <button onclick="window.navigateTo('${createRoute}')" class="btn btn-primary btn-sm">
                    <i class="fa fa-plus me-2"></i>
                    CREAR ${resource.slice(0, -1).toUpperCase()}
                </button>
            ` : ''}
        </div>
    `;
} 