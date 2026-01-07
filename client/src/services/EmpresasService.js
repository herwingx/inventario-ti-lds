import api from './api'

class EmpresasService {
  async getAll() {
    const response = await api.get('/empresas')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/empresas/${id}`)
    return response.data
  }

  async create(empresa) {
    const response = await api.post('/empresas', empresa)
    return response.data
  }

  async update(id, empresa) {
    const response = await api.put(`/empresas/${id}`, empresa)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/empresas/${id}`)
    return response.data
  }
}

export default new EmpresasService()
