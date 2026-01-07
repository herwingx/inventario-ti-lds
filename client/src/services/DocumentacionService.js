import api from './api';

/**
 * Servicio para la gestión de Documentación.
 * 
 * Permite subir y gestionar registros de documentación asociada a equipos o procesos.
 * NOTA: Este servicio exporta un objeto literal en lugar de una clase instanciada.
 */
export default {
  /**
   * Obtiene todos los documentos registrados.
   * 
   * @returns {Promise<Array<Object>>} Lista de documentos.
   */
  async getAll() {
    const response = await api.get('/documentacion');
    return response.data;
  },

  /**
   * Obtiene un documento por su ID.
   * 
   * @param {number|string} id - ID del documento.
   * @returns {Promise<Object>} Datos del documento.
   */
  async getById(id) {
    const response = await api.get(`/documentacion/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo registro de documento.
   * 
   * @param {Object} data - Datos del documento.
   * @returns {Promise<Object>} Documento creado.
   */
  async create(data) {
    const response = await api.post('/documentacion', data);
    return response.data;
  },

  /**
   * Actualiza un registro de documento existente.
   * 
   * @param {number|string} id - ID del documento.
   * @param {Object} data - Nuevos datos.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, data) {
    const response = await api.put(`/documentacion/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un registro de documento.
   * 
   * @param {number|string} id - ID del documento a eliminar.
   * @returns {Promise<void>}
   */
  async delete(id) {
    await api.delete(`/documentacion/${id}`);
  }
};
