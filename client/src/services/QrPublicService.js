/**
 * @fileoverview Servicio para endpoints públicos de QR.
 * No requiere autenticación - usado para vistas públicas de escaneo.
 */
import axios from 'axios';

/**
 * Instancia Axios sin interceptor de autenticación.
 * Para endpoints públicos que no requieren JWT.
 * Usa URL base SIN /api porque las rutas públicas están en /q/
 */
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  // Remover /api del final si existe
  return apiUrl.replace(/\/api\/?$/, '');
};

const publicApi = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Servicio para flujo público de QR.
 */
export default {
  /**
   * Obtiene información de un equipo por token QR.
   * @param {string} token - Token QR del equipo
   * @returns {Promise<Object>} Información del equipo y tickets activos
   */
  getEquipoByToken(token) {
    return publicApi.get(`/q/${token}`).then(res => res.data);
  },

  /**
   * Reporta una falla desde escaneo QR.
   * @param {string} token - Token QR del equipo
   * @param {Object} data - Datos del reporte
   * @param {string} data.tipo_falla - Tipo de falla
   * @param {string} data.descripcion - Descripción del problema
   * @param {string} [data.nombre_reporta] - Nombre de quien reporta
   * @param {string} [data.email_reporta] - Email de contacto
   * @returns {Promise<Object>} Confirmación con token de seguimiento
   */
  reportFalla(token, data) {
    return publicApi.post(`/q/${token}/report`, data).then(res => res.data);
  },

  /**
   * Obtiene el estado de un ticket por token de seguimiento.
   * @param {string} ticketToken - Token del ticket
   * @returns {Promise<Object>} Estado del ticket y comentarios
   */
  getTicketStatus(ticketToken) {
    return publicApi.get(`/q/ticket/${ticketToken}`).then(res => res.data);
  },

  /**
   * Agrega un comentario público a un ticket.
   * @param {string} ticketToken - Token del ticket
   * @param {string} contenido - Contenido del comentario
   * @param {string} [nombre] - Nombre del comentarista
   * @returns {Promise<Object>}
   */
  addComment(ticketToken, contenido, nombre = '') {
    return publicApi.post(`/q/ticket/${ticketToken}/comment`, {
      contenido,
      nombre
    }).then(res => res.data);
  },

  /**
   * Sube evidencia a un ticket.
   * @param {string} ticketToken - Token del ticket
   * @param {File} archivo - Archivo a subir
   * @returns {Promise<Object>}
   */
  uploadEvidence(ticketToken, archivo) {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return publicApi.post(`/q/ticket/${ticketToken}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data);
  }
};
