import api from './api'

/**
 * Servicio para la gestión de Áreas.
 * 
 * Permite realizar operaciones CRUD sobre las áreas de la organización.
 */
class AreasService {
  /**
   * Obtiene todas las áreas registradas.
   * 
   * @returns {Promise<Array<Object>>} Lista de áreas.
   */
  async getAll() {
    const response = await api.get('/areas')
    return response.data
  }

  /**
   * Obtiene un área por su ID.
   * 
   * @param {number|string} id - ID del área.
   * @returns {Promise<Object>} Datos del área.
   */
  async getById(id) {
    const response = await api.get(`/areas/${id}`)
    return response.data
  }

  /**
   * Crea una nueva área.
   * 
   * @param {Object} area - Datos de la nueva área.
   * @returns {Promise<Object>} Área creada.
   */
  async create(area) {
    const response = await api.post('/areas', area)
    return response.data
  }

  /**
   * Actualiza los datos de un área existente.
   * 
   * @param {number|string} id - ID del área a actualizar.
   * @param {Object} area - Nuevos datos del área.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, area) {
    const response = await api.put(`/areas/${id}`, area)
    return response.data
  }

  /**
   * Elimina un área del sistema.
   * 
   * @param {number|string} id - ID del área a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/areas/${id}`)
    return response.data
  }
}

export default new AreasService()
