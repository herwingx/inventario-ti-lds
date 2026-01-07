import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '../services/AuthService'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('userData')) || null)
  const returnUrl = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.roleId === 1) // Asumiendo rol 1 es admin
  const username = computed(() => user.value?.username || 'Usuario')
  const userInitial = computed(() => user.value?.username?.charAt(0).toUpperCase() || 'U')

  async function login(username, password) {
    try {
      const response = await AuthService.login({ username, password })

      token.value = response.token
      user.value = response.user

      localStorage.setItem('token', response.token)
      localStorage.setItem('userData', JSON.stringify(response.user))

      // Redirigir a la URL intentada o al home
      router.push(returnUrl.value || '/home')
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
