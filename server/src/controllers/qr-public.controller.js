/**
 * @module Controllers/QrPublic
 * @description Controlador para acceso público vía QR.
 */
const QrPublicService = require('../services/qr-public.service');
const { notifyNewTicket, notifyTicketCreated, notifyAdminComment } = require('../services/ticketNotification.service');
const logger = require('../utils/logger');
const { uploadTickets, handleMulterError } = require('../config/upload.config'); // Importar Multer y su manejador de errores

const getEquipoByQrToken = async (req, res) => {
  const result = await QrPublicService.getEquipoByToken(req.params.token);
  if (!result) return res.status(404).json({ message: 'Equipo no encontrado' });
  res.status(200).json(result);
};

const createPublicTicket = async (req, res) => {
  const result = await QrPublicService.createPublicTicket(req.params.token, req.body);
  if (!result) return res.status(404).json({ message: 'Equipo no encontrado' });

  // Notificar por email (Se envuelven en try/catch silencioso para no bloquear la respuesta)
  try {
    const { notifyNewTicket, notifyTicketCreated } = require('../services/ticketNotification.service');
    notifyNewTicket(result, result.equipo_info).catch(err => logger.error('[EMAIL] Notificación admin fallida:', err));
    if (req.body.email_reporta) {
      notifyTicketCreated(result, result.equipo_info, req.body.email_reporta, req.body.nombre_reporta)
        .catch(err => logger.error('[EMAIL] Confirmación usuario fallida:', err));
    }
  } catch (emailError) {
    logger.warn('[SOPORTE] Servicio de email no disponible, ticket creado sin notificaciones.');
  }

  res.status(201).json({
    success: true,
    ticket_id: result.id,
    token_seguimiento: result.token_acceso,
    message: 'Tu reporte ha sido registrado exitosamente.',
    url_seguimiento: `/q/ticket/${result.token_acceso}`
  });
};

const getTicketStatus = async (req, res) => {
  const status = await QrPublicService.getTicketStatus(req.params.ticketToken);
  if (!status) return res.status(404).json({ message: 'Ticket no encontrado' });
  res.status(200).json(status);
};

const addPublicComment = async (req, res) => {
  const { contenido, nombre } = req.body;
  if (!contenido) return res.status(400).json({ message: 'El contenido es requerido' });

  const comment = await QrPublicService.addPublicComment(req.params.ticketToken, req.body);
  if (!comment) return res.status(404).json({ message: 'Ticket no encontrado o cerrado' });

  // Notificar al admin (opcional pero recomendado en el original)
  // Para simplificar, obtenemos el ticket de nuevo si es necesario
  const status = await QrPublicService.getTicketStatus(req.params.ticketToken);
  if (status) {
    notifyAdminComment(status.ticket, contenido, nombre || 'Usuario')
      .catch(err => logger.error('[EMAIL] Notificación comentario fallida:', err));
  }

  res.status(201).json({ success: true, message: 'Comentario agregado exitosamente' });
};

const uploadTicketEvidence = async (req, res) => { // Asegurado que es async
  if (!req.file) return res.status(400).json({ message: 'No se recibió archivo' });

  // Necesitamos el ticket ID para construir la URL correctamente
  const ticket = await QrPublicService.getTicketByTokenAcceso(req.params.ticketToken);
  if (!ticket || ticket.estatus === 'CERRADO') {
    return res.status(404).json({ message: 'Ticket no encontrado o cerrado para subir evidencia.' });
  }

  // La URL debe coincidir con la nueva estructura de Multer (si usa ticketId)
  const url = `/storage/tickets/${ticket.id}/${req.file.filename}`; // CAMBIO AQUÍ: '/storage' en lugar de '/uploads'
  const updated = await QrPublicService.uploadEvidence(req.params.ticketToken, url);
  if (!updated) return res.status(404).json({ message: 'Ticket no encontrado o cerrado' });

  res.status(200).json({ success: true, url, message: 'Evidencia subida' });
};

// Nuevo controlador para manejar la subida de adjuntos públicos
const uploadPublicAttachmentController = [
  async (req, res, next) => {
    // Buscar el ticket para obtener su ID real
    const ticket = await QrPublicService.getTicketByTokenAcceso(req.params.ticketToken);
    if (!ticket || ticket.estatus === 'CERRADO') {
      return res.status(404).json({ message: 'Ticket no encontrado o cerrado' });
    }
    req.ticketId = ticket.id; // Asignar el ID del ticket para Multer
    req.ticketObj = ticket; // También pasamos el objeto ticket completo para notificaciones si es necesario
    next();
  },
  uploadTickets.single('file'), // 'file' es el nombre del campo en el formulario
  handleMulterError, // Manejador de errores de Multer
  async (req, res) => {
    const { ticketToken } = req.params;
    const { nombre } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // La URL relativa debe coincidir con la forma en que Express sirve los archivos estáticos
    // y cómo Multer los guarda.
    // Multer los guarda en /storage/tickets/ID_TICKET/nombre_generado.ext
    const fileUrl = `/storage/tickets/${req.ticketId}/${file.filename}`; // CAMBIO AQUÍ: '/storage' en lugar de '/uploads'

    await QrPublicService.addPublicAttachment(ticketToken, fileUrl, file.originalname, nombre);

    res.status(201).json({ success: true, url: fileUrl, message: 'Archivo subido' });
  }
];


module.exports = {
  getEquipoByQrToken,
  createPublicTicket,
  getTicketStatus,
  addPublicComment,
  uploadTicketEvidence,
  uploadPublicAttachment: uploadPublicAttachmentController // Exportar el nuevo controlador
};