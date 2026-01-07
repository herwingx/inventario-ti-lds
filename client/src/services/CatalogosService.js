import api from './api'

class CatalogosService {
  async getTiposEquipo() {
    const response = await api.get('/tipos-equipo')
    return response.data
  }

  async getSucursales() {
    // Assuming the endpoint is /sucursales
    const response = await api.get('/sucursales')
    return response.data
  }

  async getStatuses() {
    // Assuming the endpoint is /status
    const response = await api.get('/status')
    return response.data
  }
}

export default new CatalogosService()
