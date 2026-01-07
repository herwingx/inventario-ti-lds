// src/services/ProfileService.js
/**
 * @fileoverview Servicio de Perfil de Usuario.
 * Gestiona la obtención y actualización de datos del usuario autenticado.
 */

import api from './api'

export default {
  /**
   * Obtiene el perfil del usuario autenticado.
   * 
   * @returns {Promise<Object>} Datos del perfil
   */
  getProfile() {
    return api.get('/profile').then(res => res.data)
  },

  /**
   * Actualiza el perfil del usuario (email, password).
   * 
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.email] - Nuevo email
   * @param {string} [data.currentPassword] - Contraseña actual (requerida si cambia password)
   * @param {string} [data.newPassword] - Nueva contraseña
   * @returns {Promise<Object>} Respuesta del servidor
   */
  updateProfile(data) {
    return api.put('/profile', data).then(res => res.data)
  }
}
