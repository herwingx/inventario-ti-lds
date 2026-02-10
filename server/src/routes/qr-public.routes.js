/**
 * @module Routes/QrPublic
 * @description Rutas públicas para flujo QR (sin autenticación JWT).
 * Permite a usuarios externos reportar fallas y dar seguimiento a tickets.
 */
const router = require('express').Router();
const qrController = require('../controllers/qr-public.controller');
const { uploadTickets, handleMulterError } = require('../config/upload.config');

/**
 * @openapi
 * tags:
 *   name: Público (QR)
 *   description: Endpoints accesibles sin autenticación para escaneo de equipos y reportes
 */

/**
 * @openapi
 * /q/{token}:
 *   get:
 *     summary: Obtener información del equipo por token QR
 *     tags: [Público (QR)]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Información limitada del equipo.
 */
router.get('/:token', qrController.getEquipoByQrToken);

/**
 * @openapi
 * /q/{token}/report:
 *   post:
 *     summary: Reportar una falla desde escaneo QR
 *     tags: [Público (QR)]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Ticket creado desde flujo público.
 */
router.post('/:token', qrController.createPublicTicket);

/**
 * @openapi
 * /q/ticket/{ticketToken}:
 *   get:
 *     summary: Consultar estado de ticket público
 *     tags: [Público (QR)]
 *     parameters:
 *       - in: path
 *         name: ticketToken
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Estado y comentarios del ticket.
 */
router.get('/ticket/:ticketToken', qrController.getTicketStatus);

/**
 * @openapi
 * /q/ticket/{ticketToken}/comment:
 *   post:
 *     summary: Agregar comentario a un ticket público
 *     tags: [Público (QR)]
 *     responses:
 *       201:
 *         description: Comentario agregado.
 */
router.post('/ticket/:ticketToken/comment', qrController.addPublicComment);

/**
 * @openapi
 * /q/ticket/{ticketToken}/evidence:
 *   post:
 *     summary: Subir foto de evidencia a un ticket público
 *     tags: [Público (QR)]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Evidencia subida.
 */
router.post(
  '/ticket/:ticketToken/evidence',
  uploadTickets.single('archivo'),
  handleMulterError,
  qrController.uploadTicketEvidence
);

module.exports = router;
