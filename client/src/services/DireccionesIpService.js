import api from './api'

/**
 * Servicio para la gestión de Direcciones IP.
 * 
 * Permite administrar el inventario de IPs y consultar su disponibilidad.
 */
class DireccionesIpService {
  /**
   * Obtiene el listado de direcciones IP con filtros opcionales.
   * 
   * @param {Object} [params={}] - Filtros (disponibles, segmento, status).
   * @returns {Promise<Array<Object>>} Lista de direcciones IP.
   */
  async getAll(params = {}) {
    const response = await api.get('/direcciones-ip', { params })
    return response.data
  }

  /**
   * Obtiene un resumen de uso por segmento de red.
   * Útil para dashboard o estadísticas.
   * 
   * @returns {Promise<Array<Object>>} Resumen por segmento.
   */
  async getSegmentosResumen() {
    const response = await api.get('/direcciones-ip/segmentos')
    return response.data
  }

  /**
   * Obtiene una dirección IP por su ID.
   * 
   * @param {number|string} id - ID de la IP.
   * @returns {Promise<Object>} Datos de la IP.
   */
  async getById(id) {
    const response = await api.get(`/direcciones-ip/${id}`)
    return response.data
  }

  /**
   * Registra una nueva dirección IP en el inventario.
   * 
   * @param {Object} direccionIp - Datos de la IP.
   * @returns {Promise<Object>} IP registrada.
   */
  async create(direccionIp) {
    const response = await api.post('/direcciones-ip', direccionIp)
    return response.data
  }

  /**
   * Actualiza los datos de una dirección IP.
   * 
   * @param {number|string} id - ID de la IP a actualizar.
   * @param {Object} direccionIp - Nuevos datos.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, direccionIp) {
    const response = await api.put(`/direcciones-ip/${id}`, direccionIp)
    return response.data
  }

  /**
   * Elimina una dirección IP del inventario.
   * 
   * @param {number|string} id - ID de la IP a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/direcciones-ip/${id}`)
    return response.data
  }

  // Métodos helper para filtros rapidos

  /**
   * Obtiene solo las direcciones IP marcadas como disponibles.
   * 
   * @returns {Promise<Array<Object>>} IPs disponibles.
   */
  async getDisponibles() {
    return this.getAll({ disponibles: 'true' })
  }

  /**
   * Obtiene direcciones IP filtradas por segmento.
   * 
   * @param {string|number} segmento - Segmento de red (ej: 0, 10).
   * @returns {Promise<Array<Object>>} IPs del segmento.
   */
  async getBySegmento(segmento) {
    return this.getAll({ segmento })
  }

  /**
   * Obtiene direcciones IP filtradas por estado.
   * 
   * @param {number} status - ID del estado.
   * @returns {Promise<Array<Object>>} IPs con ese estado.
   */
  async getByStatus(status) {
    return this.getAll({ status })
  }
}

export default new DireccionesIpService()
