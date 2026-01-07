import apiClient from './api'

/**
 * Servicio para obtener datos del dashboard.
 * Centraliza las llamadas a la API relacionadas con estadísticas.
 */
export default {
  /**
   * Obtiene las estadísticas del dashboard
   * @returns {Promise<Object>} Objeto con contadores de equipos, empleados, asignaciones y mantenimientos
   */
  async getStats() {
    // Helper para safely obtener counts
    const getCount = async (promise) => {
      try {
        const res = await promise
        return Array.isArray(res.data) ? res.data.length : 0
      } catch (e) {
        console.warn('Error fetching stat:', e.message)
        return 0
      }
    }

    // Para mantenimientos y asignaciones que requieren filtrado, hacemos lógica específica
    // Idealmente el backend debería darnos endpoints /count

    // Equipos
    const equiposCount = await getCount(apiClient.get('/equipos'))

    // Empleados
    const empleadosCount = await getCount(apiClient.get('/empleados'))

    // Asignaciones
    let asignacionesCount = 0
    try {
      const res = await apiClient.get('/asignaciones')
      if (Array.isArray(res.data)) {
        asignacionesCount = res.data.filter(a => !a.fecha_fin_asignacion).length
      }
    } catch (e) { console.warn('Error asignaciones:', e.message) }

    // Mantenimientos
    const mantenimientosCount = await getCount(apiClient.get('/mantenimientos'))

    return {
      equipos: equiposCount,
      empleados: empleadosCount,
      asignaciones: asignacionesCount,
      mantenimientos: mantenimientosCount
    }
  }
}
