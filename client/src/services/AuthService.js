import api from './api'

/**
 * Servicio de Autenticación.
 * 
 * Gestiona todas las operaciones relacionadas con la autenticación de usuarios,
 * incluyendo el inicio de sesión y el cierre de sesión. Actúa como capa
 * intermedia entre los componentes/stores y la API de autenticación.
 */
class AuthService {
  /**
   * Inicia sesión en el sistema.
   * 
   * Envía las credenciales del usuario al backend para validar su identidad.
   * Si es exitoso, el backend retornará un token JWT y los datos del usuario.
   * 
   * @param {Object} credentials - Objeto con las credenciales.
   * @param {string} credentials.identifier - Correo o nombre de usuario.
   * @param {string} credentials.password - Contraseña del usuario.
   * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor (token + user).
   * @throws {Error} Si las credenciales son inválidas o hay error de conexión.
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  }

  async register(credentials) {
    const response = await api.post('/auth/signup', credentials)
    return response.data
  }

  /**
   * Cierra la sesión del usuario localmente.
   * 
   * Elimina el token de acceso y los datos del usuario almacenados en
   * localStorage. No realiza llamada al backend ya que es una invalidación
   * del lado del cliente (stateless JWT).
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
  }

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  }

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword })
    return response.data
  }
}

export default new AuthService()
