import api from './api'

class DireccionesIpService {
  async getAll(params = {}) {
    const response = await api.get('/direcciones-ip', { params })
    return response.data
  }

  async getSegmentosResumen() {
    const response = await api.get('/direcciones-ip/segmentos')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/direcciones-ip/${id}`)
    return response.data
  }

  async create(direccionIp) {
    const response = await api.post('/direcciones-ip', direccionIp)
    return response.data
  }

  async update(id, direccionIp) {
    const response = await api.put(`/direcciones-ip/${id}`, direccionIp)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/direcciones-ip/${id}`)
    return response.data
  }

  // Métodos helper para filtros
  async getDisponibles() {
    return this.getAll({ disponibles: 'true' })
  }

  async getBySegmento(segmento) {
    return this.getAll({ segmento })
  }

  async getByStatus(status) {
    return this.getAll({ status })
  }
}

export default new DireccionesIpService()
