import api from './api'

class SucursalesService {
  async getAll() {
    const response = await api.get('/sucursales')
    return response.data
  }

  async getById(id) {
    const response = await api.get(`/sucursales/${id}`)
    return response.data
  }

  async create(sucursal) {
    const response = await api.post('/sucursales', sucursal)
    return response.data
  }

  async update(id, sucursal) {
    const response = await api.put(`/sucursales/${id}`, sucursal)
    return response.data
  }

  async delete(id) {
    const response = await api.delete(`/sucursales/${id}`)
    return response.data
  }

  async getTiposSucursal() {
    const response = await api.get('/tipos-sucursal')
    return response.data
  }
}

export default new SucursalesService()
