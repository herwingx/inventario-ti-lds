import api from './api'

/**
 * Servicio para la gestión de Empleados.
 * 
 * Permite realizar operaciones CRUD sobre el directorio de empleados.
 */
class EmpleadosService {
  /**
   * Obtiene todos los empleados registrados.
   * 
   * @returns {Promise<Array<Object>>} Lista de empleados.
   */
  async getAll() {
    const response = await api.get('/empleados')
    return response.data
  }

  /**
   * Obtiene un empleado por su ID.
   * 
   * @param {number|string} id - ID del empleado.
   * @returns {Promise<Object>} Datos del empleado.
   */
  async getById(id) {
    const response = await api.get(`/empleados/${id}`)
    return response.data
  }

  /**
   * Registra un nuevo empleado.
   * 
   * @param {Object} empleado - Datos del nuevo empleado.
   * @returns {Promise<Object>} Empleado creado.
   */
  async create(empleado) {
    const response = await api.post('/empleados', empleado)
    return response.data
  }

  /**
   * Actualiza los datos de un empleado existente.
   * 
   * @param {number|string} id - ID del empleado a actualizar.
   * @param {Object} empleado - Nuevos datos del empleado.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, empleado) {
    const response = await api.put(`/empleados/${id}`, empleado)
    return response.data
  }

  /**
   * Elimina un empleado del sistema.
   * 
   * @param {number|string} id - ID del empleado a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/empleados/${id}`)
    return response.data
  }
}

export default new EmpleadosService()
