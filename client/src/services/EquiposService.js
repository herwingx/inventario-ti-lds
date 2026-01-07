import api from './api'

class EquiposService {
  async getAll() {
    const response = await api.get('/equipos')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/equipos/${id}`)
    return response.data
  }

  async create(equipo) {
    const response = await api.post('/equipos', equipo)
    return response.data
  }

  async update(id, equipo) {
    const response = await api.put(`/equipos/${id}`, equipo)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/equipos/${id}`)
    return response.data
  }

  async getDisponiblesComponentes() {
    const response = await api.get('/equipos/disponibles-componentes')
    return response.data
  }
}

export default new EquiposService()
