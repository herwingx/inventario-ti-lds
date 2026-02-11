import api from './api'

/**
 * Servicio de Gestión de Asignaciones.
 * 
 * Controla el ciclo de vida de las asignaciones de equipos a empleados o áreas.
 * Incluye funcionalidades para crear asignaciones simples o compuestas (con componentes),
 * finalizar asignaciones activas y gestionar los componentes asociados.
 */
class AsignacionesService {
  /**
   * Obtiene el listado de asignaciones con soporte para filtros.
   * 
   * @param {Object} [params={}] - Parámetros de consulta (filtros).
   * @returns {Promise<Array>} Lista de asignaciones.
   */
  async getAll(params = {}) {
    const response = await api.get('/asignaciones', { params })
    return response.data
  }

  /**
   * Obtiene los detalles de una asignación específica.
   * 
   * @param {number|string} id - ID de la asignación.
   * @returns {Promise<Object>} Detalle de la asignación.
   */
  async getById(id) {
    const response = await api.get(`/asignaciones/${id}`)
    return response.data
  }

  /**
   * Crea una nueva asignación simple.
   * 
   * @param {Object} asignacion - Datos de la asignación.
   * @returns {Promise<Object>} Asignación creada.
   */
  async create(asignacion) {
    const response = await api.post('/asignaciones', asignacion)
    return response.data
  }

  /**
   * Crea una asignación que incluye componentes adicionales.
   * 
   * @param {Object} data - Datos de la asignación y lista de IDs de componentes.
   * @returns {Promise<Object>} Resultado de la operación compuesta.
   */
  async createWithComponents(data) {
    const response = await api.post('/asignaciones/con-componentes', data)
    return response.data
  }

  /**
   * Actualiza los datos de una asignación existente.
   * 
   * @param {number|string} id - ID de la asignación.
   * @param {Object} asignacion - Datos a actualizar.
   * @returns {Promise<Object>} Asignación actualizada.
   */
  async update(id, asignacion) {
    const response = await api.put(`/asignaciones/${id}`, asignacion)
    return response.data
  }

  /**
   * Elimina una asignación.
   * 
   * @param {number|string} id - ID de la asignación.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/asignaciones/${id}`)
    return response.data
  }

  /**
   * Finaliza una asignación activa.
   * 
   * Establece el estado de la asignación a 'FINALIZADO' y registra la fecha de fin.
   * Esto libera el equipo asociado.
   * 
   * @param {number|string} id - ID de la asignación.
   * @param {string|null} [fechaFin=null] - Fecha de fin opcional (default: ahora).
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async finalizar(id, fechaFin = null) {
    // Si no se pasa fecha, el backend usa la actual.
    // Finalizar implica actualizar status a FINALIZADO (6) y/o poner fecha fin
    const payload = {
      id_status_asignacion: 6, // FINALIZADO
      fecha_fin_asignacion: fechaFin || new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    return this.update(id, payload)
  }

  /**
   * Obtiene los componentes asociados a una asignación.
   * 
   * @param {number|string} id - ID de la asignación.
   * @returns {Promise<Array>} Lista de componentes.
   */
  async getComponentes(id) {
    const response = await api.get(`/asignaciones/${id}/componentes`)
    return response.data
  }

  /**
   * Actualiza la lista de componentes de una asignación.
   * 
   * @param {number|string} id - ID de la asignación.
   * @param {Array<number>} componentesIds - Nuevos IDs de los componentes.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async updateComponentes(id, componentesIds) {
    const response = await api.put(`/asignaciones/${id}/componentes`, { componentes: componentesIds })
    return response.data
  }

  /**
   * Descarga la Carta Responsiva en formato PDF.
   * 
   * @param {number|string} id - ID de la asignación.
   * @returns {Promise<void>} Descarga directa en el navegador.
   */
  async downloadResponsivaPDF(id) {
    const response = await api.get(`/asignaciones/${id}/pdf`, {
      responseType: 'blob'
    })

    // Crear un link temporal para la descarga
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    // Intentar obtener el nombre del archivo desde el header si es posible
    const contentDisposition = response.headers['content-disposition']
    let fileName = `Responsiva_Asignacion_${id}.pdf`
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/)
      if (fileNameMatch.length === 2) fileName = fileNameMatch[1]
    }

    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()

    // Limpieza
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Envía la firma digital al servidor para generar y almacenar el PDF final.
   * 
   * @param {number|string} id - ID de la asignación.
   * @param {string} signatureBase64 - Imagen de la firma en formato Base64.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  async signAndGeneratePDF(id, signatureBase64) {
    const response = await api.post(`/asignaciones/${id}/sign`, {
      firma: signatureBase64
    })
    return response.data
  }
}

export default new AsignacionesService()
