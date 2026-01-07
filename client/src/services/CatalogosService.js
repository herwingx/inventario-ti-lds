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

  async getEmpresas() {
    const response = await api.get('/empresas')
    return response.data
  }

  async getAreas() {
    const response = await api.get('/areas')
    return response.data
  }

  async getAreasByEmpresa(idEmpresa) {
    // El backend filtra por id_sucursal, pero internamente usa la empresa de esa sucursal
    // Como las áreas están asociadas a empresas, necesitamos un endpoint que filtre directamente
    // Por ahora, obtenemos todas y filtramos en el cliente
    const response = await api.get('/areas')
    return response.data.filter(area => area.id_empresa === idEmpresa)
  }
}

export default new CatalogosService()
