import api from './api'

class AreasService {
  async getAll() {
    const response = await api.get('/areas')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/areas/${id}`)
    return response.data
  }

  async create(area) {
    const response = await api.post('/areas', area)
    return response.data
  }

  async update(id, area) {
    const response = await api.put(`/areas/${id}`, area)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/areas/${id}`)
    return response.data
  }
}

export default new AreasService()
