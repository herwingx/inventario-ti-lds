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
const isAnalystUser = (req) => req.user?.roleId === 3;

const ensureOwnTicket = (req, ticket) => {
        if (isRestrictedUser(req) && ticket?.id_usuario_reporta !== req.user?.userId) {
                const error = new Error('No tienes permisos para ver este ticket.');
                error.statusCode = 403;
                error.isOperational = true;
                throw error;
        }
};

const ensureAnalystAssignedTicket = (req, ticket) => {
    if (isAnalystUser(req) && ticket?.id_asignado_a !== req.user?.userId) {
        const error = new Error('Solo puedes acceder a tickets asignados a tu usuario.');
        error.statusCode = 403;
        error.isOperational = true;
        throw error;
    }
};

const ensureChatParticipantsOnly = (req, ticket) => {
    // Si el ticket ya tiene asignación, el chat queda solo entre creador y asignado.
    if (!ticket?.id_asignado_a) return;

    const userId = req.user?.userId;
    const isReporter = ticket.id_usuario_reporta === userId;
    const isAssignee = ticket.id_asignado_a === userId;

    if (!isReporter && !isAssignee) {
        const error = new Error('Este chat solo permite participación del creador y la persona asignada.');
        error.statusCode = 403;
        error.isOperational = true;
        throw error;
    }
};

const resolveActorName = async (req) => {
    if (!req.user?.userId) return req.user?.username || 'Soporte';

    try {
        return await TicketService.getUserDisplayNameById(req.user.userId);
    } catch (error) {
        logger.warn(`[TicketsController] No se pudo resolver nombre del actor: ${error.message}`);
        return req.user?.username || 'Soporte';
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
    ensureAnalystAssignedTicket(req, ticket);

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

    // Notificar a soporte y confirmar al solicitante (fire-and-forget).
    if (TicketNotificationService) {
        TicketService.findById(newTicket.id)
            .then(ticketData => {
                if (!ticketData) return;

                const reporterEmail =
                    ticketData?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.email ||
                    ticketData?.email_reporta ||
                    null;
                const reporterName =
                    ticketData?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.username ||
                    ticketData?.nombre_reporta ||
                    'Usuario';

                return Promise.all([
                    TicketNotificationService.notifyNewTicket(ticketData, ticketData.equipos),
                    reporterEmail
                        ? TicketNotificationService.notifyTicketCreated(ticketData, ticketData.equipos, reporterEmail, reporterName)
                        : Promise.resolve()
                ]);
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
    const previousTicket = await TicketService.findById(id);

    if (!previousTicket) {
        const error = new Error(`Ticket con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    if (isAnalystUser(req) && previousTicket.id_asignado_a !== req.user?.userId) {
        const error = new Error('Solo puedes actualizar tickets asignados a tu usuario.');
        error.statusCode = 403;
        error.isOperational = true;
        throw error;
    }

    const validation = updateTicketSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    let payload = { ...validation.data.body };

    if (isAnalystUser(req)) {
        const hasRestrictedFields = payload.prioridad !== undefined || payload.id_asignado_a !== undefined;
        if (hasRestrictedFields) {
            const error = new Error('El rol Analista solo puede gestionar estatus del ticket.');
            error.statusCode = 403;
            error.isOperational = true;
            throw error;
        }

        if (payload.estatus === undefined) {
            const error = new Error('Debes enviar el estatus para actualizar el ticket.');
            error.statusCode = 400;
            error.isOperational = true;
            throw error;
        }

        payload = { estatus: payload.estatus };
    }

    const updated = await TicketService.update(id, payload, req.user?.roleId);

    if (!updated) {
        const error = new Error(`Ticket con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // Notificación de reapertura (solo para ADMIN)
    if (
        TicketNotificationService &&
        req.user?.roleId === 1 &&
        payload.estatus === 'ABIERTO' &&
        previousTicket.estatus === 'CERRADO'
    ) {
        const analyst = updated.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema;
        if (analyst?.email) {
            TicketNotificationService.notifyAnalystAssignment(
                {
                    id: updated.id,
                    prioridad: updated.prioridad,
                    tipo_falla: updated.tipo_falla,
                    descripcion: updated.descripcion
                },
                analyst
            ).catch(err => logger.warn(`[EMAIL] Fallo notif reaper ticket: ${err}`));
        }
    }

    if (
        TicketNotificationService &&
        payload.id_asignado_a !== undefined &&
        payload.id_asignado_a !== null &&
        payload.id_asignado_a !== previousTicket.id_asignado_a
    ) {
        const analyst = updated.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema;
        const actorName = await resolveActorName(req);
        const analystName = TicketService.resolveUserDisplayName(analyst);

        if (analyst?.email) {
            TicketNotificationService.notifyAnalystAssignment(
                {
                    id: updated.id,
                    token_acceso: updated.token_acceso,
                    prioridad: updated.prioridad,
                    tipo_falla: updated.tipo_falla,
                    descripcion: updated.descripcion
                },
                analyst,
                actorName
            ).catch(err => logger.warn(`[EMAIL] Fallo notif asignación analista: ${err}`));
        }

        const requesterEmail =
            previousTicket?.email_reporta ||
            previousTicket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.email ||
            null;

        if (requesterEmail) {
            TicketNotificationService.notifyUserTicketAssigned(
                {
                    id: updated.id,
                    token_acceso: updated.token_acceso
                },
                requesterEmail,
                analystName,
                actorName
            ).catch(err => logger.warn(`[EMAIL] Fallo notif asignación solicitante: ${err}`));
        }
    }

    if (
        TicketNotificationService &&
        payload.estatus &&
        payload.estatus !== previousTicket.estatus
    ) {
        const fullTicket = await TicketService.findById(id);
        const recipientEmail =
            fullTicket?.email_reporta ||
            fullTicket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.email ||
            null;

        if (recipientEmail) {
            TicketNotificationService.notifyUserStatusChange(
                {
                    id: fullTicket.id,
                    token_acceso: fullTicket.token_acceso
                },
                payload.estatus,
                recipientEmail,
                req.user?.username || 'Soporte'
            ).catch(err => logger.warn(`[EMAIL] Fallo notif cambio estatus: ${err}`));
        }
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
 * Obtiene métricas de soporte técnico.
 * @route GET /api/tickets/metrics
 */
const getSupportMetrics = asyncHandler(async (req, res) => {
    const metrics = await TicketService.getSupportMetrics({
        userId: req.user?.userId,
        roleId: req.user?.roleId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        days: req.query.days
    });

    res.status(200).json(metrics);
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
    ensureAnalystAssignedTicket(req, ticket);
    ensureChatParticipantsOnly(req, ticket);

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
    const roleId = req.user?.roleId;

    const ticket = await TicketService.findById(id);
    if (!ticket) {
        const error = new Error('Ticket no encontrado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    ensureOwnTicket(req, ticket);
    ensureAnalystAssignedTicket(req, ticket);
    ensureChatParticipantsOnly(req, ticket);
    
    if (['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
         const error = new Error('No se pueden agregar mensajes a un ticket finalizado.');
         error.statusCode = 400;
         error.isOperational = true;
         throw error;
    }

    const comment = await TicketService.addComment(id, userId, req.body);

    // Notificaciones de comentarios solo si se habilitan explícitamente para evitar saturación.
    const allowCommentEmails = Boolean(TicketNotificationService?.isCommentNotificationEnabled?.());

    if (allowCommentEmails && roleId !== 2 && !req.body.es_interno) {
        const recipientEmail = ticket.email_reporta || ticket?.usuarios_sistema_tickets_id_usuario_reportaTousuarios_sistema?.email;
        if (recipientEmail) {
            TicketNotificationService.notifyUserComment(ticket, req.body.contenido, recipientEmail)
                .catch(err => logger.warn(`[EMAIL] Fallo notif usuario: ${err}`));
        }
    }

    if (allowCommentEmails && roleId === 2) {
        const analyst = ticket?.usuarios_sistema_tickets_id_asignado_aTousuarios_sistema;
        if (analyst?.email) {
            TicketNotificationService.notifyAnalystPublicComment(
                { id: ticket.id },
                req.body.contenido,
                req.user?.username || 'Solicitante',
                analyst
            ).catch(err => logger.warn(`[EMAIL] Fallo notif analista comentario viewer: ${err}`));
        }
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
        ensureAnalystAssignedTicket(req, ticket);

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
    getSupportMetrics,
    getComments,
    addComment,
    uploadAttachment: uploadTicketAttachment
};
