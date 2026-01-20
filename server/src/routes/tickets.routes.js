/**
 * @module Routes/Tickets
 * @description Rutas protegidas para gestión de tickets de soporte.
 */
const router = require('express').Router();
const ticketsController = require('../controllers/tickets.controller');

/**
 * @route GET /api/tickets
 * @description Obtiene todos los tickets con filtros opcionales
 * @query {string} [estatus] - Filtrar por estatus
 * @query {string} [prioridad] - Filtrar por prioridad
 * @query {number} [id_equipo] - Filtrar por equipo
 */
router.get('/', ticketsController.getAllTickets);

/**
 * @route GET /api/tickets/tecnicos
 * @description Obtiene técnicos disponibles para asignación
 */
router.get('/tecnicos', ticketsController.getTecnicos);

/**
 * @route GET /api/tickets/:id
 * @description Obtiene un ticket por ID con comentarios
 */
router.get('/:id', ticketsController.getTicketById);

/**
 * @route POST /api/tickets
 * @description Crea un nuevo ticket
 * @body {number} id_equipo - ID del equipo
 * @body {string} tipo_falla - HARDWARE|SOFTWARE|RED|IMPRESORA|OTRO
 * @body {string} descripcion - Descripción del problema
 * @body {string} [prioridad] - BAJA|MEDIA|ALTA|CRITICA
 */
router.post('/', ticketsController.createTicket);

/**
 * @route PUT /api/tickets/:id
 * @description Actualiza un ticket (estado, asignación, prioridad)
 */
router.put('/:id', ticketsController.updateTicket);

/**
 * @route DELETE /api/tickets/:id
 * @description Elimina un ticket
 */
router.delete('/:id', ticketsController.deleteTicket);

/**
 * @route GET /api/tickets/:id/comments
 * @description Obtiene comentarios de un ticket
 * @query {boolean} [incluir_internos] - Incluir notas internas
 */
router.get('/:id/comments', ticketsController.getComments);

/**
 * @route POST /api/tickets/:id/comments
 * @description Agrega un comentario a un ticket
 * @body {string} contenido - Contenido del comentario
 * @body {boolean} [es_interno] - Si es nota interna
 */
router.post('/:id/comments', ticketsController.addComment);

module.exports = router;
