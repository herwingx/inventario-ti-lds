/**
 * @module Routes/QrPublic
 * @description Rutas públicas para flujo QR (sin autenticación JWT).
 * Permite a usuarios externos reportar fallas y dar seguimiento a tickets.
 */
const router = require('express').Router();
const qrController = require('../controllers/qr-public.controller');
const { uploadTickets, handleMulterError } = require('../config/upload.config');

/**
 * @route GET /q/:token
 * @description Obtiene información del equipo por token QR
 * @public
 */
router.get('/:token', qrController.getEquipoByQrToken);

/**
 * @route POST /q/:token/report
 * @description Crea un ticket desde escaneo QR
 * @public
 * @body {string} tipo_falla - HARDWARE|SOFTWARE|RED|IMPRESORA|OTRO
 * @body {string} descripcion - Descripción del problema
 * @body {string} [nombre_reporta] - Nombre de quien reporta
 * @body {string} [email_reporta] - Email de contacto
 */
router.post('/:token/report', qrController.createPublicTicket);

/**
 * @route GET /q/ticket/:ticketToken
 * @description Obtiene el estado de un ticket por token de seguimiento
 * @public
 */
router.get('/ticket/:ticketToken', qrController.getTicketStatus);

/**
 * @route POST /q/ticket/:ticketToken/comment
 * @description Agrega un comentario público a un ticket
 * @public
 * @body {string} contenido - Contenido del comentario
 * @body {string} [nombre] - Nombre del comentarista
 */
router.post('/ticket/:ticketToken/comment', qrController.addPublicComment);

/**
 * @route POST /q/ticket/:ticketToken/evidence
 * @description Sube evidencia (foto) a un ticket
 * @public
 * @file archivo - Imagen JPG/PNG o PDF (max 5MB)
 */
router.post(
  '/ticket/:ticketToken/evidence',
  uploadTickets.single('archivo'),
  handleMulterError,
  qrController.uploadTicketEvidence
);

module.exports = router;
