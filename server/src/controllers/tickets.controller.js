/**
 * @module Controllers/Tickets
 * @description Controlador para la gestión de tickets de soporte (Admin/Técnico).
 * Refactorizado con asyncHandler y validación Zod.
 */
const TicketService = require('../services/tickets.service');
const { ticketSchema, updateTicketSchema } = require('../schemas/ticket.schema');
const logger = require('../utils/logger');
const { uploadTickets, handleMulterError } = require('../config/upload.config');
const asyncHandler = require('../utils/asyncHandler');
// Importación opcional de notificaciones
let TicketNotificationService;
try {
  TicketNotificationService = require('../services/ticketNotification.service');
} catch (e) {}

const isRestrictedUser = (req) => req.user?.roleId === 2;

const ensureOwnTicket = (req, ticket) => {
        if (isRestrictedUser(req) && ticket?.id_usuario_reporta !== req.user?.userId) {
                const error = new Error('No tienes permisos para ver este ticket.');
                error.statusCode = 403;
                error.isOperational = true;
                throw error;
        }
};


/**
 * Obtiene todos los tickets con filtros.
 * @route GET /api/tickets
 */
const getAllTickets = asyncHandler(async (req, res) => {
    const tickets = await TicketService.findAll(req.query, req.user?.userId, req.user?.roleId);
    res.status(200).json(tickets);
});

/**
 * Obtiene un ticket por ID.
 * @route GET /api/tickets/:id
 */
const getTicketById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ticket = await TicketService.findById(id);

    if (!ticket) {
        const error = new Error(`Ticket con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    ensureOwnTicket(req, ticket);

    res.status(200).json(ticket);
});

/**
 * Crea un nuevo ticket interno.
 * @route POST /api/tickets
 */
const createTicket = asyncHandler(async (req, res) => {
    const validation = ticketSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de ticket inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const userId = req.user?.userId;
    const roleId = req.user?.roleId;
    const newTicket = await TicketService.create(validation.data.body, userId, roleId);
    
    logger.info(`Ticket creado: ID ${newTicket.id} por usuario ID ${userId}`);

    // Notificar a soporte también para tickets internos (fire-and-forget).
    if (TicketNotificationService) {
        TicketService.findById(newTicket.id)
            .then(ticketData => {
                if (!ticketData?.equipos) return;
                return TicketNotificationService.notifyNewTicket(ticketData, ticketData.equipos);
            })
            .catch(err => logger.warn(`[EMAIL] Fallo notif ticket interno: ${err}`));
    }

    res.status(201).json({
        status: 'success',
        message: 'Ticket creado exitosamente',
        data: { id: newTicket.id }
    });
});

/**
 * Actualiza un ticket.
 * @route PUT /api/tickets/:id
 */
const updateTicket = asyncHandler(async (req, res) => {
    if (isRestrictedUser(req)) {
        const error = new Error('No tienes permisos para actualizar tickets.');
        error.statusCode = 403;
        error.isOperational = true;
        throw error;
    }

    const { id } = req.params;
    const validation = updateTicketSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await TicketService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Ticket con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Ticket ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Ticket actualizado exitosamente' 
    });
});

/**
 * Elimina un ticket.
 * @route DELETE /api/tickets/:id
 */
const deleteTicket = asyncHandler(async (req, res) => {
    if (isRestrictedUser(req)) {
        const error = new Error('No tienes permisos para eliminar tickets.');
        error.statusCode = 403;
        error.isOperational = true;
        throw error;
    }

    const { id } = req.params;
    const deleted = await TicketService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Ticket con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Ticket ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Ticket eliminado exitosamente' 
    });
});

/**
 * Obtiene lista de técnicos disponibles.
 * @route GET /api/tickets/tecnicos/list
 */
const getTecnicos = asyncHandler(async (req, res) => {
    const tecnicos = await TicketService.getTecnicos();
    res.status(200).json(tecnicos);
});

/**
 * Obtiene comentarios de un ticket.
 * @route GET /api/tickets/:id/comments
 */
const getComments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { incluir_internos } = req.query;
    const ticket = await TicketService.findById(id);

    if (!ticket) {
        const error = new Error('Ticket no encontrado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    ensureOwnTicket(req, ticket);

    const comments = await TicketService.getComments(id, incluir_internos === 'true');
    res.status(200).json(comments);
});

/**
 * Agrega un comentario a un ticket.
 * @route POST /api/tickets/:id/comments
 */
const addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const ticket = await TicketService.findById(id);
    if (!ticket) {
        const error = new Error('Ticket no encontrado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    ensureOwnTicket(req, ticket);
    
    if (['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
         const error = new Error('No se pueden agregar mensajes a un ticket finalizado.');
         error.statusCode = 400;
         error.isOperational = true;
         throw error;
    }

    const comment = await TicketService.addComment(id, userId, req.body);

    // Notificaciones
    if (!req.body.es_interno && ticket.email_reporta && TicketNotificationService) {
        TicketNotificationService.notifyUserComment(ticket, req.body.contenido, ticket.email_reporta)
            .catch(err => logger.warn(`[EMAIL] Fallo notif usuario: ${err}`));
    }

    res.status(201).json(comment);
});

/**
 * Sube un archivo adjunto a un ticket.
 * Pipeline: [CheckID] -> [Multer] -> [UpdateDB]
 */
const uploadTicketAttachment = [
    (req, res, next) => {
        req.ticketId = req.params.id;
        next();
    },
    uploadTickets.single('file'),
    handleMulterError,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user?.userId;
        const file = req.file;

        if (!file) {
            const error = new Error('No se ha subido ningún archivo.');
            error.statusCode = 400;
            error.isOperational = true;
            throw error;
        }

        const ticket = await TicketService.findById(id);
        if (!ticket || ['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
            // Limpiar archivo subido si falla validación lógica
            // fs.unlink(file.path)... (pendiente implementación cleanup)
            const error = new Error('No se pueden adjuntar archivos a un ticket finalizado.');
            error.statusCode = 400;
            error.isOperational = true;
            throw error;
        }

        ensureOwnTicket(req, ticket);

        const fileUrl = `/storage/tickets/${id}/${file.filename}`;
        await TicketService.addAttachment(id, userId, fileUrl, file.originalname);

        res.status(201).json({ 
            status: 'success',
            message: 'Archivo subido', 
            data: { url: fileUrl } 
        });
    })
];

module.exports = {
    getAllTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    getTecnicos,
    getComments,
    addComment,
    uploadAttachment: uploadTicketAttachment
};
