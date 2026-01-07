import api from './api';

export default {
  /**
   * Obtener todos los mantenimientos
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
   * Obtener un mantenimiento por ID
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
   * Crear un nuevo mantenimiento
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
   * Actualizar una mantenimiento existente
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
   * Eliminar un mantenimiento
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
