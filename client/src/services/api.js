import axios from 'axios'

/**
 * Cliente HTTP base configurado para conectar con el backend.
 * Incluye interceptores para manejo de autenticación y errores.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
})

// Interceptor de request: Agregar token JWT
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

// Interceptor de response: Manejar errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error 401: Token inválido o expirado
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      window.location.href = '/soporte/login'
    }

    // Error de red
    if (!error.response) {
      console.error('Error de conexión con el servidor')
    }

    return Promise.reject(error)
  }
)

export default apiClient
