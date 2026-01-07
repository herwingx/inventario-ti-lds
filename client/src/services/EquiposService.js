import api from './api'

/**
 * Servicio de Gestión de Equipos.
 * 
 * Centraliza todas las operaciones CRUD y de consulta relacionadas con
 * el inventario de equipos (computadoras, periféricos, etc.).
 */
class EquiposService {
  /**
   * Obtiene el listado completo de equipos.
   * 
   * @returns {Promise<Array>} Lista de equipos con sus relaciones (marca, modelo, estado).
   */
  async getAll() {
    const response = await api.get('/equipos')
    return response.data
  }

  /**
   * Busca un equipo por su ID único.
   * 
   * @param {number|string} id - Identificador del equipo.
   * @returns {Promise<Object>} Detalles del equipo encontrado.
   */
  async getById(id) {
    const response = await api.get(`/equipos/${id}`)
    return response.data
  }

  /**
   * Registra un nuevo equipo en el inventario.
   * 
   * @param {Object} equipo - Datos del nuevo equipo.
   * @returns {Promise<Object>} Equipo creado.
   */
  async create(equipo) {
    const response = await api.post('/equipos', equipo)
    return response.data
  }

  /**
   * Actualiza la información de un equipo existente.
   * 
   * @param {number|string} id - Identificador del equipo a actualizar.
   * @param {Object} equipo - Datos actualizados.
   * @returns {Promise<Object>} Equipo actualizado.
   */
  async update(id, equipo) {
    const response = await api.put(`/equipos/${id}`, equipo)
    return response.data
  }

  /**
   * Elimina (o da de baja) un equipo del sistema.
   * 
   * @param {number|string} id - Identificador del equipo.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    const response = await api.delete(`/equipos/${id}`)
    return response.data
  }

  /**
   * Obtiene únicamente los equipos con estado 'DISPONIBLE'.
   * 
   * Útil para asignaciones rápidas. Realiza un filtrado en cliente
   * de la lista completa si el backend no provee un endpoint específico.
   * 
   * @returns {Promise<Array>} Lista de equipos disponibles.
   */
  async getDisponibles() {
    // Asumiendo que el backend soporta filtro o traemos todos y filtramos
    // Por eficiencia, intentamos filtrar en cliente si el backend no tiene endpoint específico
    // Pero idealmente el backend debería filtrar. 
    // Revisando controladores anteriores, getAll acepta query params en muchos casos.
    // Si no, filtramos aquí. 
    const response = await api.get('/equipos')
    // Filtrar equipos con status DISPONIBLE (id 5, según convención vista)
    return response.data.filter(e => e.id_status === 5)
  }

  /**
   * Obtiene componentes (RAM, Disco) disponibles para upgrade/mantenimiento.
   * 
   * @returns {Promise<Array>} Lista de componentes disponibles.
   */
  async getDisponiblesComponentes() {
    const response = await api.get('/equipos/disponibles-componentes')
    return response.data
  }
}

export default new EquiposService()


