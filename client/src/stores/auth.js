/**
 * @fileoverview Store de Autenticación (Pinia).
 * Gestiona el estado global de la sesión, incluyendo login, logout y permisos básicos.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '../services/AuthService'
import router from '../router'

/**
 * Store de Autenticación (Pinia).
 * 
 * Gestiona el estado global de la sesión del usuario en la aplicación.
 * Mantiene sincronizado el estado reactivo con el almacenamiento local (localStorage)
 * y provee métodos para iniciar y cerrar sesión.
 */
export const useAuthStore = defineStore('auth', () => {
  // ==========================================
  // Estado (State)
  // ==========================================
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('userData')) || null)
  const returnUrl = ref(null)

  // ==========================================
  // Getters (Computed)
  // ==========================================

  /** Verifica si el usuario tiene una sesión activa basada en la existencia del token. */
  const isAuthenticated = computed(() => !!token.value)

  /** Verifica si el usuario tiene rol de Administrador. */
  const isAdmin = computed(() => user.value?.roleId === 1) // Asumiendo rol 1 es admin

  /** Obtiene el nombre de usuario o un valor por defecto. */
  const username = computed(() => user.value?.username || 'Usuario')

  /** Obtiene la inicial del usuario para avatares. */
  const userInitial = computed(() => user.value?.username?.charAt(0).toUpperCase() || 'U')

  // ==========================================
  // Acciones (Actions)
  // ==========================================

  /**
   * Realiza el proceso de inicio de sesión.
   * 
   * Llama al servicio de autenticación y, si es exitoso,
   * actualiza el estado global y el localStorage. Redirige al usuario
   * a la página intentada anteriormente o al home.
   * 
   * @param {string} username - Nombre de usuario.
   * @param {string} password - Contraseña.
   * @returns {Promise<Object>} Objeto con { success: boolean, message?: string }.
   */
  async function login(username, password) {
    try {
      const response = await AuthService.login({ username, password })

      token.value = response.data.token
      user.value = response.data.user

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('userData', JSON.stringify(response.data.user))

      // Redirigir a la URL intentada o al home
      router.replace(returnUrl.value || '/home')
      returnUrl.value = null

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      }
    }
  }

  /**
   * Cierra la sesión activa.
   * 
   * Limpia el estado global, almacenamiento local y redirige al login.
   */
  function logout() {
    AuthService.logout()
    token.value = null
    user.value = null
    router.push('/login')
  }

  return {
    token,
    user,
    returnUrl,
    isAuthenticated,
    isAdmin,
    username,
    userInitial,
    login,
    logout
  }
})
