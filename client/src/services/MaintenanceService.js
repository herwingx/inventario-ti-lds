import api from './api';

/**
 * @module Services/MaintenanceService
 * @description Servicio para gestión de mantenimientos y evidencias (Fase 2B).
 */
const MaintenanceService = {
  // =============================================
  // CRUD MANTENIMIENTOS
  // =============================================

  // Obtener todos los mantenimientos (con filtros opcionales)
  async getAll(params = {}) {
    const response = await api.get('/mantenimientos', { params });
    return response.data;
  },

  // Obtener detalle de uno
  async getById(id) {
    const response = await api.get(`/mantenimientos/${id}`);
    return response.data;
  },

  // Crear nuevo mantenimiento
  async create(data) {
    const response = await api.post('/mantenimientos', data);
    return response.data;
  },

  // Actualizar estatus o datos
  async update(id, data) {
    const response = await api.put(`/mantenimientos/${id}`, data);
    return response.data;
  },

  // Eliminar
  async delete(id) {
    const response = await api.delete(`/mantenimientos/${id}`);
    return response.data;
  },

  // =============================================
  // EVIDENCIAS DE MANTENIMIENTO (Fase 2B)
  // =============================================

  /**
   * Obtiene todas las evidencias de un mantenimiento.
   * @param {number} mantenimientoId - ID del mantenimiento
   * @returns {Promise<Array>} Lista de evidencias
   */
  async getEvidencias(mantenimientoId) {
    const response = await api.get(`/mantenimientos/${mantenimientoId}/evidencias`);
    return response.data;
  },

  /**
   * Sube una nueva evidencia para un mantenimiento.
   * @param {number} mantenimientoId - ID del mantenimiento
   * @param {FormData} formData - FormData con archivo y metadatos (tipo, descripcion)
   * @returns {Promise<Object>} Datos de la evidencia creada
   */
  async uploadEvidencia(mantenimientoId, formData) {
    const response = await api.post(
      `/mantenimientos/${mantenimientoId}/evidencias`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  /**
   * Elimina una evidencia específica.
   * @param {number} mantenimientoId - ID del mantenimiento
   * @param {number} evidenciaId - ID de la evidencia a eliminar
   * @returns {Promise<Object>} Mensaje de confirmación
   */
  async deleteEvidencia(mantenimientoId, evidenciaId) {
    const response = await api.delete(
      `/mantenimientos/${mantenimientoId}/evidencias/${evidenciaId}`
    );
    return response.data;
  }
};

export default MaintenanceService;

