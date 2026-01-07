import api from './api';

export default {
  async getAll() {
    const response = await api.get('/documentacion');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/documentacion/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/documentacion', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/documentacion/${id}`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/documentacion/${id}`);
  }
};
