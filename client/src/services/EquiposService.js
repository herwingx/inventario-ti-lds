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

  async getDisponibles() {
    // Asumiendo que el backend soporta filtro o traemos todos y filtramos
    // Por eficiencia, intentamos filtrar en cliente si el backend no tiene endpoint específico
    // Pero idealmente el backend debería filtrar. 
    // Revisando controladores anteriores, getAll acepta query params en muchos casos.
    // Si no, filtramos aquí. 
    const response = await api.get('/equipos')
    // Filtrar equipos con status DISPONIBLE (id 5, según convención vista)
    return response.data.filter(e => e.id_status === 5)
  }

  async getDisponiblesComponentes() {
    const response = await api.get('/equipos/disponibles-componentes')
    return response.data
  }
}

export default new EquiposService()
