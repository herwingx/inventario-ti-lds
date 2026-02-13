/**
 * @module Routes/QrPublic
 * @description Rutas públicas para acceso rápido vía QR.
 */
const express = require('express');
const router = express.Router();
const qrPublicController = require('../controllers/qr-public.controller');
// Multer middleware
const { uploadTickets, handleMulterError } = require('../config/upload.config');

/**
 * @openapi
 * tags:
 *   name: QR Publico
 *   description: Acceso rápido para reporte de incidentes (Sin login)
 */

/**
 * @openapi
 * /api/q/equipo/{token}:
 *   get:
 *     summary: Obtener info básica de equipo por QR
 *     tags: [QR Publico]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Info del equipo (Serie, Nombre, Ubicación).
 *       404:
 *         description: Token inválido.
 */
router.get('/equipo/:token', qrPublicController.getEquipoByQrToken);

/**
 * @openapi
 * /api/q/ticket/{token}:
 *   post:
 *     summary: Crear reporte de incidente
 *     tags: [QR Publico]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descripcion]
 *             properties:
 *               descripcion: { type: string }
 *               email_reporta: { type: string, format: email }
 *               nombre_reporta: { type: string }
 *               prioridad: { type: string, enum: [BAJA, MEDIA, ALTA, URGENTE], default: MEDIA }
 *     responses:
 *       201:
 *         description: Ticket creado. Retorna token de seguimiento.
 */
router.post('/ticket/:token', qrPublicController.createPublicTicket);

/**
 * @openapi
 * /api/q/status/{ticketToken}:
 *   get:
 *     summary: Consultar estado de ticket público
 *     tags: [QR Publico]
 *     parameters:
 *       - in: path
 *         name: ticketToken
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Estado del ticket y comentarios públicos.
 */
router.get('/status/:ticketToken', qrPublicController.getTicketStatus);

/**
 * @openapi
 * /api/q/comment/{ticketToken}:
 *   post:
 *     summary: Agregar comentario a ticket público
 *     tags: [QR Publico]
 *     parameters:
 *       - in: path
 *         name: ticketToken
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido: { type: string }
 *               nombre: { type: string }
 *     responses:
 *       201:
 *         description: Comentario agregado.
 */
router.post('/comment/:ticketToken', qrPublicController.addPublicComment);

/**
 * @openapi
 * /api/q/attachment/{ticketToken}:
 *   post:
 *     summary: Subir adjunto a ticket público
 *     tags: [QR Publico]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: ticketToken
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Archivo subido.
 */
router.post('/attachment/:ticketToken', qrPublicController.uploadPublicAttachment);

// Legacy endpoint support
router.post('/ticket/:ticketToken/evidence', qrPublicController.uploadTicketEvidence);

module.exports = router;
