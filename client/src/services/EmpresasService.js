import api from './api'

/**
 * Servicio para la gestión de Empresas.
 * 
 * Permite realizar operaciones CRUD sobre las empresas registradas en el sistema.
 */
class EmpresasService {
  /**
   * Obtiene todas las empresas.
   * 
   * @returns {Promise<Array<Object>>} Lista de empresas.
   */
  async getAll() {
    const response = await api.get('/empresas')
    return response.data
  }

  /**
   * Obtiene una empresa por su ID.
   * 
   * @param {number|string} id - ID de la empresa.
   * @returns {Promise<Object>} Datos de la empresa.
   */
  async getById(id) {
    const response = await api.get(`/empresas/${id}`)
    return response.data
  }

  /**
   * Crea una nueva empresa.
   * 
   * @param {Object} empresa - Datos de la nueva empresa.
   * @returns {Promise<Object>} Empresa creada.
   */
  async create(empresa) {
    const response = await api.post('/empresas', empresa)
    return response.data
  }

  /**
   * Actualiza los datos de una empresa existente.
   * 
   * @param {number|string} id - ID de la empresa a actualizar.
   * @param {Object} empresa - Nuevos datos.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, empresa) {
    const response = await api.put(`/empresas/${id}`, empresa)
    return response.data
  }

  /**
   * Elimina una empresa del sistema.
   * 
   * @param {number|string} id - ID de la empresa a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/empresas/${id}`)
    return response.data
  }
}

export default new EmpresasService()
