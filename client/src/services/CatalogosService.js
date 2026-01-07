import api from './api'

/**
 * Servicio para la consulta de Catálogos del sistema.
 * 
 * Centraliza el acceso a listados comunes utilizados en selects y filtros
 * (Tipos de Equipo, Sucursales, Status, Empresas, Áreas).
 */
class CatalogosService {
  /**
   * Obtiene el catálogo de tipos de equipo.
   * 
   * @returns {Promise<Array<Object>>} Lista de tipos de equipo.
   */
  async getTiposEquipo() {
    const response = await api.get('/tipos-equipo')
    return response.data
  }

  /**
   * Obtiene el catálogo de sucursales.
   * 
   * @returns {Promise<Array<Object>>} Lista de sucursales.
   */
  async getSucursales() {
    // Assuming the endpoint is /sucursales
    const response = await api.get('/sucursales')
    return response.data
  }

  /**
   * Obtiene el catálogo de estados (status).
   * 
   * @returns {Promise<Array<Object>>} Lista de estados.
   */
  async getStatuses() {
    // Assuming the endpoint is /status
    const response = await api.get('/status')
    return response.data
  }

  /**
   * Obtiene el catálogo de empresas.
   * 
   * @returns {Promise<Array<Object>>} Lista de empresas.
   */
  async getEmpresas() {
    const response = await api.get('/empresas')
    return response.data
  }

  /**
   * Obtiene el catálogo de áreas.
   * 
   * @returns {Promise<Array<Object>>} Lista de áreas.
   */
  async getAreas() {
    const response = await api.get('/areas')
    return response.data
  }

  /**
   * Obtiene las áreas filtradas por empresa.
   * (Nota: Filtrado realizado en el cliente temporalmente).
   * 
   * @param {number|string} idEmpresa - ID de la empresa.
   * @returns {Promise<Array<Object>>} Lista de áreas de la empresa.
   */
  async getAreasByEmpresa(idEmpresa) {
    // El backend filtra por id_sucursal, pero internamente usa la empresa de esa sucursal
    // Como las áreas están asociadas a empresas, necesitamos un endpoint que filtre directamente
    // Por ahora, obtenemos todas y filtramos en el cliente
    const response = await api.get('/areas')
    return response.data.filter(area => area.id_empresa === idEmpresa)
  }
}

export default new CatalogosService()
