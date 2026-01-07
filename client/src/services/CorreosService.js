import api from './api'

/**
 * Servicio para la gestión de Cuentas de Correo.
 * 
 * Permite administrar las cuentas de correo corporativo del inventario.
 */
class CorreosService {
  /**
   * Obtiene todas las cuentas de correo registradas.
   * 
   * @returns {Promise<Array<Object>>} Lista de cuentas de correo.
   */
  async getAll() {
    const response = await api.get('/cuentas-email')
    return response.data
  }

  /**
   * Obtiene una cuenta de correo por su ID.
   * 
   * @param {number|string} id - ID de la cuenta.
   * @returns {Promise<Object>} Datos de la cuenta.
   */
  async getById(id) {
    const response = await api.get(`/cuentas-email/${id}`)
    return response.data
  }

  /**
   * Crea una nueva cuenta de correo.
   * 
   * @param {Object} cuenta - Datos de la nueva cuenta.
   * @returns {Promise<Object>} Cuenta creada.
   */
  async create(cuenta) {
    const response = await api.post('/cuentas-email', cuenta)
    return response.data
  }

  /**
   * Actualiza los datos de una cuenta de correo existente.
   * 
   * @param {number|string} id - ID de la cuenta a actualizar.
   * @param {Object} cuenta - Nuevos datos de la cuenta.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, cuenta) {
    const response = await api.put(`/cuentas-email/${id}`, cuenta)
    return response.data
  }

  /**
   * Elimina una cuenta de correo del sistema.
   * 
   * @param {number|string} id - ID de la cuenta a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/cuentas-email/${id}`)
    return response.data
  }
}

export default new CorreosService()
