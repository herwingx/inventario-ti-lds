import api from './api';

/**
 * Servicio para la gestión de Notas y Observaciones.
 * 
 * Permite registrar bitácoras o notas rápidas sobre equipos o situaciones varias.
 */
export default {
  /**
   * Obtiene todas las notas registradas.
   * 
   * @returns {Promise<Array<Object>>} Lista de notas.
   */
  async getAll() {
    const response = await api.get('/notas');
    return response.data;
  },

  /**
   * Obtiene una nota por su ID.
   * 
   * @param {number|string} id - ID de la nota.
   * @returns {Promise<Object>} Datos de la nota.
   */
  async getById(id) {
    const response = await api.get(`/notas/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva nota.
   * 
   * @param {Object} data - Datos de la nota (título, contenido, etc).
   * @returns {Promise<Object>} Nota creada.
   */
  async create(data) {
    const response = await api.post('/notas', data);
    return response.data;
  },

  /**
   * Actualiza una nota existente.
   * 
   * @param {number|string} id - ID de la nota.
   * @param {Object} data - Nuevos datos.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, data) {
    const response = await api.put(`/notas/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una nota.
   * 
   * @param {number|string} id - ID de la nota a eliminar.
   * @returns {Promise<void>}
   */
  async delete(id) {
    await api.delete(`/notas/${id}`);
  }
};
