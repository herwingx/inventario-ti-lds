/**
 * @module Controllers/QrPublic
 * @description Controlador para acceso público vía QR.
 * Refactorizado con asyncHandler y validación Zod.
 */
const QrPublicService = require('../services/qr-public.service');
// Importar servicios de notificación opcionalmente para no romper si fallan
let TicketNotificationService;
try {
  TicketNotificationService = require('../services/ticketNotification.service');
} catch (e) {
  // Fallback si no existe el servicio
}

const logger = require('../utils/logger');
const { uploadTickets, handleMulterError } = require('../config/upload.config');
const asyncHandler = require('../utils/asyncHandler');
const { publicTicketSchema, publicCommentSchema } = require('../schemas/ticket.schema');

/**
 * Obtiene información básica del equipo por token QR.
 * @route GET /api/q/equipo/:token
 */
const getEquipoByQrToken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await QrPublicService.getEquipoByToken(token);
    
    if (!result) {
        const error = new Error('Equipo no encontrado o token inválido.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(result);
});

/**
 * Crea un ticket público desde el escaneo QR.
 * @route POST /api/q/ticket/:token
 */
const createPublicTicket = asyncHandler(async (req, res) => {
    const { token } = req.params;
    
    // Validar input
    const validation = publicTicketSchema.safeParse({ body: req.body });
    if (!validation.success) {
        const error = new Error('Datos del reporte inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const result = await QrPublicService.createPublicTicket(token, validation.data.body);
    
    if (!result) {
        const error = new Error('Equipo no encontrado o token inválido.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // Notificaciones asíncronas (Fire and Forget)
    if (TicketNotificationService) {
        Promise.allSettled([
            TicketNotificationService.notifyNewTicket(result, result.equipo_info),
            req.body.email_reporta ? TicketNotificationService.notifyTicketCreated(result, result.equipo_info, req.body.email_reporta, req.body.nombre_reporta) : Promise.resolve()
        ]).catch(err => logger.warn(`[EMAIL] Error en notificaciones: ${err}`));
    }

    res.status(201).json({
        success: true,
        ticket_id: result.id,
        token_seguimiento: result.token_acceso,
        message: 'Tu reporte ha sido registrado exitosamente.',
        url_seguimiento: `/q/ticket/${result.token_acceso}`
    });
});

/**
 * Obtiene el estado de un ticket público.
 * @route GET /api/q/status/:ticketToken
 */
const getTicketStatus = asyncHandler(async (req, res) => {
    const { ticketToken } = req.params;
    const status = await QrPublicService.getTicketStatus(ticketToken);
    
    if (!status) {
        const error = new Error('Ticket no encontrado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(status);
});

/**
 * Agrega un comentario público a un ticket.
 * @route POST /api/q/comment/:ticketToken
 */
const addPublicComment = asyncHandler(async (req, res) => {
    const { ticketToken } = req.params;
    
    const validation = publicCommentSchema.safeParse({ body: req.body });
    if (!validation.success) {
        const error = new Error('Comentario inválido');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const comment = await QrPublicService.addPublicComment(ticketToken, validation.data.body);
    
    if (!comment) {
        const error = new Error('Ticket no encontrado o ya finalizado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // Notificar admin
    if (TicketNotificationService) {
        // Recuperar info del ticket para notificación
        QrPublicService.getTicketStatus(ticketToken).then(status => {
            if (status) {
                TicketNotificationService.notifyAdminComment(status.ticket, validation.data.body.contenido, validation.data.body.nombre)
                    .catch(err => logger.warn(`[EMAIL] Error notif comentario: ${err}`));
            }
        });
    }

    res.status(201).json({ 
        success: true, 
        message: 'Comentario agregado exitosamente' 
    });
});

/**
 * Sube una evidencia a un ticket público (Legacy endpoint).
 * @deprecated Use uploadPublicAttachment instead
 */
const uploadTicketEvidence = asyncHandler(async (req, res) => {
    if (!req.file) {
        const error = new Error('No se recibió archivo.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
    }

    const ticket = await QrPublicService.getTicketByTokenAcceso(req.params.ticketToken);
    if (!ticket || ['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
        const error = new Error('Ticket no encontrado o finalizado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    const url = `/storage/tickets/${ticket.id}/${req.file.filename}`;
    const updated = await QrPublicService.uploadEvidence(req.params.ticketToken, url);
    
    if (!updated) {
         const error = new Error('No se pudo actualizar el ticket con la evidencia.');
         error.statusCode = 500;
         error.isOperational = true;
         throw error;
    }

    res.status(200).json({ success: true, url, message: 'Evidencia subida' });
});

/**
 * Controlador Multi-step para subida de adjuntos públicos.
 * No usa asyncHandler directamente porque Multer es un middleware intermedio.
 */
const uploadPublicAttachment = [
    asyncHandler(async (req, res, next) => {
        const ticket = await QrPublicService.getTicketByTokenAcceso(req.params.ticketToken);
        if (!ticket || ['RESUELTO', 'CERRADO'].includes(ticket.estatus)) {
            const error = new Error('Ticket no encontrado o ya finalizado');
            error.statusCode = 404;
            error.isOperational = true;
            throw error;
        }
        req.ticketId = ticket.id;
        next();
    }),
    uploadTickets.single('file'),
    handleMulterError,
    asyncHandler(async (req, res) => {
        const { ticketToken } = req.params;
        const { nombre } = req.body;
        const file = req.file;

        if (!file) {
            const error = new Error('No se ha subido ningún archivo');
            error.statusCode = 400;
            error.isOperational = true;
            throw error;
        }

        const fileUrl = `/storage/tickets/${req.ticketId}/${file.filename}`;
        await QrPublicService.addPublicAttachment(ticketToken, fileUrl, file.originalname, nombre);

        res.status(201).json({ 
            success: true, 
            url: fileUrl, 
            message: 'Archivo subido' 
        });
    })
];

module.exports = {
    getEquipoByQrToken,
    createPublicTicket,
    getTicketStatus,
    addPublicComment,
    uploadTicketEvidence,
    uploadPublicAttachment
};
