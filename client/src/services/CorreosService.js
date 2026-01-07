import api from './api'

class CorreosService {
  async getAll() {
    const response = await api.get('/cuentas-email')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/cuentas-email/${id}`)
    return response.data
  }

  async create(cuenta) {
    const response = await api.post('/cuentas-email', cuenta)
    return response.data
  }

  async update(id, cuenta) {
    const response = await api.put(`/cuentas-email/${id}`, cuenta)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/cuentas-email/${id}`)
    return response.data
  }
}

export default new CorreosService()
