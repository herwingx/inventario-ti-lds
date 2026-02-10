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
 *         schema: { type: string }
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
 *             required: [id_equipo, tipo_falla, descripcion]
 *             properties:
 *               id_equipo: { type: integer }
 *               tipo_falla: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Ticket creado.
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
 *     responses:
 *       200:
 *         description: Ticket actualizado.
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
 *     responses:
 *       201:
 *         description: Comentario agregado.
 */
router.post('/:id/comments', ticketsController.addComment);

module.exports = router;
