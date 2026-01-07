import api from './api'

class AsignacionesService {
  async getAll(params = {}) {
    const response = await api.get('/asignaciones', { params })
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/asignaciones/${id}`)
    return response.data
  }

  async create(asignacion) {
    const response = await api.post('/asignaciones', asignacion)
    return response.data
  }

  async createWithComponents(data) {
    const response = await api.post('/asignaciones/con-componentes', data)
    return response.data
  }

  async update(id, asignacion) {
    const response = await api.put(`/asignaciones/${id}`, asignacion)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/asignaciones/${id}`)
    return response.data
  }

  async finalizar(id, fechaFin = null) {
    // Si no se pasa fecha, el backend usa la actual.
    // Finalizar implica actualizar status a FINALIZADO (6) y/o poner fecha fin
    const payload = {
      id_status_asignacion: 6, // FINALIZADO
      fecha_fin_asignacion: fechaFin || new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    return this.update(id, payload)
  }

  async getComponentes(id) {
    const response = await api.get(`/asignaciones/${id}/componentes`)
    return response.data
  }

  async updateComponentes(id, componentesIds) {
    const response = await api.put(`/asignaciones/${id}/componentes`, { componentes: componentesIds })
    return response.data
  }
}

export default new AsignacionesService()
