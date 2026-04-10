/**
 * @module Routes/Tickets
 * @description Rutas protegidas para gestión de tickets de soporte.
 */
const router = require('express').Router();
const ticketsController = require('../controllers/tickets.controller');

/**
 * @openapi
 * tags:
 *   name: Soporte (Helpdesk)
 *   description: Gestión de incidentes y tickets de servicio
 */

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     summary: Listar todos los tickets
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estatus
 *         schema: { type: string, enum: [ABIERTO, EN_PROGRESO, PENDIENTE, RESUELTO, CERRADO] }
 *       - in: query
 *         name: prioridad
 *         schema: { type: string }
 *       - in: query
 *         name: asignado_a
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de tickets.
 */
router.get('/', ticketsController.getAllTickets);

/**
 * @openapi
 * /api/tickets/tecnicos:
 *   get:
 *     summary: Obtener lista de técnicos
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios con rol soporte/admin.
 */
router.get('/tecnicos', ticketsController.getTecnicos);

/**
 * @openapi
 * /api/tickets/{id}:
 *   get:
 *     summary: Obtener ticket por ID
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del ticket y comentarios.
 *       404:
 *         description: Ticket no encontrado.
 */
router.get('/:id', ticketsController.getTicketById);

/**
 * @openapi
 * /api/tickets:
 *   post:
 *     summary: Crear un ticket desde el panel administrativo
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, categoria, descripcion]
 *             properties:
 *               titulo: { type: string }
 *               categoria: { type: string }
 *               descripcion: { type: string }
 *               prioridad: { type: string, enum: [BAJA, MEDIA, ALTA, CRITICA], default: MEDIA }
 *               # Nota: CRITICA es exclusiva para soporte/admin.
 *               tipo_falla: { type: string, enum: [HARDWARE, SOFTWARE, RED, IMPRESORA, OTRO], default: OTRO }
 *               id_equipo_relacionado: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Ticket creado.
 *       400:
 *         description: Datos inválidos.
 */
router.post('/', ticketsController.createTicket);

/**
 * @openapi
 * /api/tickets/{id}:
 *   put:
 *     summary: Actualizar ticket (Estatus, Prioridad, Asignación)
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estatus: { type: string, enum: [ABIERTO, EN_PROGRESO, PENDIENTE, RESUELTO, CERRADO] }
 *               prioridad: { type: string, enum: [BAJA, MEDIA, ALTA, CRITICA] }
 *               id_asignado_a: { type: integer }
 *               comentarios_tecnicos: { type: string }
 *     responses:
 *       200:
 *         description: Ticket actualizado.
 *       404:
 *         description: Ticket no encontrado.
 */
router.put('/:id', ticketsController.updateTicket);

/**
 * @openapi
 * /api/tickets/{id}/comments:
 *   get:
 *     summary: Obtener comentarios de un ticket
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: incluir_internos
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Historial de comentarios.
 */
router.get('/:id/comments', ticketsController.getComments);

/**
 * @openapi
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Agregar un comentario o nota interna
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido: { type: string }
 *               es_interno: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Comentario agregado.
 */
router.post('/:id/comments', ticketsController.addComment);

/**
 * @openapi
 * /api/tickets/{id}/attachments:
 *   post:
 *     summary: Adjuntar archivo (imagen/pdf) a un ticket
 *     tags: [Soporte (Helpdesk)]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Archivo subido.
 *       400:
 *         description: Ticket cerrado o archivo inválido.
 */
router.post('/:id/attachments', ticketsController.uploadAttachment);

/**
 * @openapi
 * /api/tickets/{id}:
 *   delete:
 *     summary: Eliminar un ticket de forma permanente
 *     tags: [Soporte (Helpdesk)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ticket eliminado exitosamente.
 *       404:
 *         description: Ticket no encontrado.
 */
router.delete('/:id', ticketsController.deleteTicket);

module.exports = router;
