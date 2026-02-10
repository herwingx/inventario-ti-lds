/**
 * @module Controllers/QrPublic
 * @description Controlador para acceso público vía QR.
 */
const QrPublicService = require('../services/qr-public.service');

const getEquipoByQrToken = async (req, res) => {
  const result = await QrPublicService.getEquipoByToken(req.params.token);
  if (!result) return res.status(404).json({ message: 'Equipo no encontrado' });
  res.status(200).json(result);
};

const createPublicTicket = async (req, res) => {
  const result = await QrPublicService.createPublicTicket(req.params.token, req.body);
  if (!result) return res.status(404).json({ message: 'Equipo no encontrado' });

  res.status(201).json({
    success: true,
    ticket_id: result.ticketId,
    message: 'Tu reporte ha sido registrado exitosamente.'
  });
};

module.exports = {
  getEquipoByQrToken,
  createPublicTicket,
  getTicketStatus: (req, res) => res.status(501).json({ message: 'Seguimiento por token no implementado en esta fase.' }),
  addPublicComment: (req, res) => res.status(501).json({ message: 'Comentarios públicos no implementados.' }),
  uploadTicketEvidence: (req, res) => res.status(501).json({ message: 'Carga de evidencia no implementada.' })
};
