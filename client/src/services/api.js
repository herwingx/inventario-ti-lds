import axios from 'axios'

/**
 * Cliente HTTP base configurado para conectar con el backend.
 * 
 * Este módulo exporta una instancia de axios preconfigurada que actúa como
 * el punto central de comunicación con la API. Incluye configuraciones
 * globales como la URL base, headers por defecto y timeouts.
 * 
 * Además, implementa interceptores para:
 * 1. Inyectar automáticamente el token JWT en cada petición.
 * 2. Manejar respuestas de error globales (ej. expiración de sesión 401).
 * 
 * @module services/api
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
})

/**
 * Interceptor de Request.
 * 
 * Propósito: Automatizar la autenticación.
 * Verifica si existe un token en localStorage y lo adjunta al header
 * Authorization de la petición saliente. Esto evita tener que enviar
 * manualmente el token en cada llamada a la API.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Interceptor de Response.
 * 
 * Propósito: Manejo centralizado de errores.
 * Intercepta todas las respuestas para detectar condiciones críticas,
 * principalmente errores 401 (No autorizado) que indican que la sesión
 * ha expirado o el token es inválido, forzando un cierre de sesión
 * y redirección al login.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error 401: Token inválido o expirado -> Forzar logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      window.location.href = '/soporte/login'
    }

    // Error de red o servidor no disponible
    if (!error.response) {
      console.error('Error de conexión con el servidor')
    }

    return Promise.reject(error)
  }
)

export default apiClient
