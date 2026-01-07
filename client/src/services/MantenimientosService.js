import api from './api';

/**
   * Servicio para la gestión de Mantenimientos.
   *
   * Permite administrar los registros de mantenimiento preventivo y correctivo de equipos.
   */
export default {
  /**
   * Obtiene todos los registros de mantenimiento.
   * 
   * @returns {Promise<Array<Object>>} Lista de mantenimientos.
   */
  async getAll() {
    try {
      const response = await api.get('/mantenimientos');
      return response.data;
    } catch (error) {
      console.error('Error fetching mantenimientos:', error);
      throw error;
    }
  },

  /**
   * Obtiene un registro de mantenimiento por su ID.
   * 
   * @param {number|string} id - ID del mantenimiento.
   * @returns {Promise<Object>} Datos del mantenimiento.
   */
  async getById(id) {
    try {
      const response = await api.get(`/mantenimientos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching mantenimiento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo registro de mantenimiento.
   * 
   * @param {Object} data - Datos del mantenimiento.
   * @returns {Promise<Object>} Mantenimiento creado.
   */
  async create(data) {
    try {
      const response = await api.post('/mantenimientos', data);
      return response.data;
    } catch (error) {
      console.error('Error creating mantenimiento:', error);
      throw error;
    }
  },

  /**
   * Actualiza un registro de mantenimiento existente.
   * 
   * @param {number|string} id - ID del mantenimiento.
   * @param {Object} data - Nuevos datos.
   * @returns {Promise<Object>} Resultado de la actualización.
   */
  async update(id, data) {
    try {
      const response = await api.put(`/mantenimientos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating mantenimiento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un registro de mantenimiento.
   * 
   * @param {number|string} id - ID del mantenimiento a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   */
  async delete(id) {
    try {
      const response = await api.delete(`/mantenimientos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting mantenimiento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener estatus posibles (helper si existe endpoint, sino usar ids fijos)
   * Por ahora usaremos los status generales.
   */
};
