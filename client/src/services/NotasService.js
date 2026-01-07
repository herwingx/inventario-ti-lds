import api from './api';

export default {
  async getAll() {
    const response = await api.get('/notas');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/notas/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/notas', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/notas/${id}`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/notas/${id}`);
  }
};
