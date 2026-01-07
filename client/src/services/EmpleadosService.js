import api from './api'

class EmpleadosService {
  async getAll() {
    const response = await api.get('/empleados')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/empleados/${id}`)
    return response.data
  }

  async create(empleado) {
    const response = await api.post('/empleados', empleado)
    return response.data
  }

  async update(id, empleado) {
    const response = await api.put(`/empleados/${id}`, empleado)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/empleados/${id}`)
    return response.data
  }
}

export default new EmpleadosService()
