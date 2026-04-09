/**
 * @fileoverview Servicio para endpoints públicos de QR.
 * No requiere autenticación - usado para vistas públicas de escaneo y seguimiento.
 */
import axios from 'axios';

/**
 * Instancia Axios configurada para peticiones públicas.
 * Apunta directamente al prefijo /api/q definido en el servidor.
 */
const publicApi = axios.create({
  // Usamos ruta relativa para que el navegador resuelva el host/IP automáticamente
  baseURL: '/api/q',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

/**
 * Servicio para flujo público de Soporte.
 */
export default {
  /**
   * Obtiene información de un equipo por token QR.
   */
  getEquipoByToken(token) {
    return publicApi.get(`/equipo/${token}`).then(res => res.data);
  },

  /**
   * Reporta una falla desde escaneo QR o entrada manual.
   */
  reportFalla(token, data) {
    // Coincide con router.post('/ticket/:token', ...) en el backend
    return publicApi.post(`/ticket/${token}`, data).then(res => res.data);
  },

  /**
   * Obtiene el estado de un ticket por token de seguimiento.
   */
  getTicketStatus(ticketToken) {
    // Coincide con router.get('/status/:ticketToken', ...) en el backend
    return publicApi.get(`/status/${ticketToken}`).then(res => res.data);
  },

  /**
   * Agrega un comentario público a un ticket.
   */
  addComment(ticketToken, contenido, nombre = '') {
    return publicApi.post(`/comment/${ticketToken}`, {
      contenido,
      nombre
    }).then(res => res.data);
  },

  /**
   * Sube evidencia a un ticket.
   */
  uploadEvidence(ticketToken, archivo) {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return publicApi.post(`/attachment/${ticketToken}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data);
  },

  /**
   * Sube un adjunto al chat público.
   */
  uploadAttachment(ticketToken, file) {
    const formData = new FormData();
    formData.append('file', file);
    return publicApi.post(`/attachment/${ticketToken}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  }
};