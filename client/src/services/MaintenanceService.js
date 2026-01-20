import api from './api';

const MaintenanceService = {
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
  }
};

export default MaintenanceService;
