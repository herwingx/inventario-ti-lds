import api from './api'

/**
 * Servicio para la gestión de Sucursales.
 * 
 * Permite realizar operaciones CRUD sobre las sucursales y consultar sus tipos.
 */
class SucursalesService {
  /**
   * Obtiene todas las sucursales registradas.
   * 
   * @returns {Promise<Array<Object>>} Lista de sucursales.
   */
  async getAll() {
    const response = await api.get('/sucursales')
    return response.data
  }

  /**
   * Obtiene una sucursal por su ID.
   * 
   * @param {number|string} id - ID de la sucursal.
   * @returns {Promise<Object>} Datos de la sucursal.
   */
  async getById(id) {
    const response = await api.get(`/sucursales/${id}`)
    return response.data
  }

  /**
   * Registra una nueva sucursal.
   * 
   * @param {Object} sucursal - Datos de la nueva sucursal.
   * @returns {Promise<Object>} Sucursal creada.
   */
  async create(sucursal) {
    const response = await api.post('/sucursales', sucursal)
    return response.data
  }

  /**
   * Actualiza los datos de una sucursal existente.
   * 
   * @param {number|string} id - ID de la sucursal a actualizar.
   * @param {Object} sucursal - Nuevos datos.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, sucursal) {
    const response = await api.put(`/sucursales/${id}`, sucursal)
    return response.data
  }

  /**
   * Elimina una sucursal del sistema.
   * 
   * @param {number|string} id - ID de la sucursal a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/sucursales/${id}`)
    return response.data
  }

  /**
   * Obtiene el catálogo de tipos de sucursal.
   * 
   * @returns {Promise<Array<Object>>} Lista de tipos de sucursal.
   */
  async getTiposSucursal() {
    const response = await api.get('/tipos-sucursal')
    return response.data
  }
}

export default new SucursalesService()
