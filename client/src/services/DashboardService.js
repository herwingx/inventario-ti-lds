import apiClient from './api'

/**
 * @fileoverview Servicio de Dashboard.
 * Centraliza la obtención de estadísticas y métricas clave para el panel de control.
 */
export default {
  /**
   * Obtiene las estadísticas del dashboard
   * @returns {Promise<Object>} Objeto con contadores de equipos, empleados, asignaciones y mantenimientos
   */
  /**
   * Obtiene las estadísticas del dashboard
   * @returns {Promise<Object>} Objeto con estadísticas completas del dashboard
   */
  async getStats() {
    try {
      const res = await apiClient.get('/dashboard')

      // Mapeamos la respuesta del backend a la estructura que espera la vista
      // El backend devuelve: { stats: { equipos: { total, ... }, empleados, asignaciones_activas }, activity: { ... } }
      const backendData = res.data

      return {
        // Stats básicas para las cards
        equipos: backendData.stats.equipos.total || 0,
        empleados: backendData.stats.empleados || 0,
        asignaciones: backendData.stats.asignaciones_activas || 0,
        mantenimientos: backendData.stats.equipos.mantenimiento || 0,

        // Datos adicionales para gráficos o secciones detalle
        equipos_disponibles: backendData.stats.equipos.disponibles || 0,
        equipos_por_tipo: backendData.stats.equipos.por_tipo || [],
        actividad_reciente: backendData.activity.recent_assignments || []
      }
    } catch (e) {
      console.error('Error fetching dashboard stats:', e.message)
      throw e
    }
  }
}
