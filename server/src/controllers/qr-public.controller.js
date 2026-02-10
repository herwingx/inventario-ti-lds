/**
 * @module Controllers/QrPublic
 * @description Controlador para acceso público vía QR.
 */
const QrPublicService = require('../services/qr-public.service');
const { notifyNewTicket, notifyTicketCreated, notifyAdminComment } = require('../services/ticketNotification.service');
const logger = require('../utils/logger');

const getEquipoByQrToken = async (req, res) => {
  const result = await QrPublicService.getEquipoByToken(req.params.token);
  if (!result) return res.status(404).json({ message: 'Equipo no encontrado' });
  res.status(200).json(result);
};

const createPublicTicket = async (req, res) => {
  const result = await QrPublicService.createPublicTicket(req.params.token, req.body);
  if (!result) return res.status(404).json({ message: 'Equipo no encontrado' });

  // Notificar por email
  notifyNewTicket(result, result.equipo_info).catch(err => logger.error('[EMAIL] Notificación admin fallida:', err));
  if (req.body.email_reporta) {
    notifyTicketCreated(result, result.equipo_info, req.body.email_reporta, req.body.nombre_reporta)
      .catch(err => logger.error('[EMAIL] Confirmación usuario fallida:', err));
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

const uploadTicketEvidence = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió archivo' });

  const url = `/uploads/tickets/${req.file.filename}`;
  const updated = await QrPublicService.uploadEvidence(req.params.ticketToken, url);
  if (!updated) return res.status(404).json({ message: 'Ticket no encontrado o cerrado' });

  res.status(200).json({ success: true, url, message: 'Evidencia subida' });
};

module.exports = {
  getEquipoByQrToken,
  createPublicTicket,
  getTicketStatus,
  addPublicComment,
  uploadTicketEvidence
};
