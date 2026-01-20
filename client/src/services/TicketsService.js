/**
 * @fileoverview Servicio para gestión de tickets de soporte.
 * Proporciona métodos para CRUD de tickets, comentarios y asignación de técnicos.
 */
import api from './api';

/**
 * Servicio de Tickets de Soporte.
 */
export default {
  /**
   * Obtiene todos los tickets con filtros opcionales.
   * @param {Object} [filters] - Filtros opcionales
   * @param {string} [filters.estatus] - Filtrar por estatus
   * @param {string} [filters.prioridad] - Filtrar por prioridad
   * @param {number} [filters.id_equipo] - Filtrar por equipo
   * @returns {Promise<Array>}
   */
  getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.estatus) params.append('estatus', filters.estatus);
    if (filters.prioridad) params.append('prioridad', filters.prioridad);
    if (filters.id_equipo) params.append('id_equipo', filters.id_equipo);

    const queryString = params.toString();
    return api.get(`/tickets${queryString ? `?${queryString}` : ''}`).then(res => res.data);
  },

  /**
   * Obtiene un ticket por ID con sus comentarios.
   * @param {number} id - ID del ticket
   * @returns {Promise<Object>}
   */
  getById(id) {
    return api.get(`/tickets/${id}`).then(res => res.data);
  },

  /**
   * Crea un nuevo ticket.
   * @param {Object} data - Datos del ticket
   * @param {number} data.id_equipo - ID del equipo
   * @param {string} data.tipo_falla - Tipo de falla
   * @param {string} data.descripcion - Descripción del problema
   * @param {string} [data.prioridad] - Prioridad del ticket
   * @returns {Promise<Object>}
   */
  create(data) {
    return api.post('/tickets', data).then(res => res.data);
  },

  /**
   * Actualiza un ticket existente.
   * @param {number} id - ID del ticket
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>}
   */
  update(id, data) {
    return api.put(`/tickets/${id}`, data).then(res => res.data);
  },

  /**
   * Elimina un ticket.
   * @param {number} id - ID del ticket
   * @returns {Promise<Object>}
   */
  delete(id) {
    return api.delete(`/tickets/${id}`).then(res => res.data);
  },

  /**
   * Obtiene comentarios de un ticket.
   * @param {number} id - ID del ticket
   * @param {boolean} [incluirInternos=false] - Incluir notas internas
   * @returns {Promise<Array>}
   */
  getComments(id, incluirInternos = false) {
    return api.get(`/tickets/${id}/comments`, {
      params: { incluir_internos: incluirInternos }
    }).then(res => res.data);
  },

  /**
   * Agrega un comentario a un ticket.
   * @param {number} id - ID del ticket
   * @param {string} contenido - Contenido del comentario
   * @param {boolean} [esInterno=false] - Si es nota interna
   * @returns {Promise<Object>}
   */
  addComment(id, contenido, esInterno = false) {
    return api.post(`/tickets/${id}/comments`, {
      contenido,
      es_interno: esInterno
    }).then(res => res.data);
  },

  /**
   * Obtiene técnicos disponibles para asignación.
   * @returns {Promise<Array>}
   */
  getTecnicos() {
    return api.get('/tickets/tecnicos').then(res => res.data);
  }
};
