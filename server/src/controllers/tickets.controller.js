const TicketService = require('../services/tickets.service');
const { ticketSchema, updateTicketSchema } = require('../schemas/ticket.schema');
const logger = require('../utils/logger');
const { uploadTickets, handleMulterError } = require('../config/upload.config');

const getAllTickets = async (req, res) => {
  const tickets = await TicketService.findAll(req.query);
  res.status(200).json(tickets);
};

const getTicketById = async (req, res) => {
  const ticket = await TicketService.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });
  res.status(200).json(ticket);
};

const createTicket = async (req, res) => {
  const validation = ticketSchema.parse({ body: req.body });
  const userId = req.user?.userId;

  const newTicket = await TicketService.create(validation.body, userId);
  logger.info(`Ticket creado: ID ${newTicket.id} por usuario ID ${userId}`);

  res.status(201).json({
    message: 'Ticket creado exitosamente',
    id: newTicket.id
  });
};

const updateTicket = async (req, res) => {
  const validation = updateTicketSchema.parse({ params: req.params, body: req.body });

  const updated = await TicketService.update(validation.params.id, validation.body);
  if (!updated) return res.status(404).json({ message: 'Ticket no encontrado' });

  logger.info(`Ticket ID ${validation.params.id} actualizado.`);
  res.status(200).json({ message: 'Ticket actualizado exitosamente' });
};

const deleteTicket = async (req, res) => {
  const deleted = await TicketService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Ticket no encontrado' });

  logger.info(`Ticket ID ${req.params.id} eliminado.`);
  res.status(200).json({ message: 'Ticket eliminado exitosamente' });
};

const getTecnicos = async (req, res) => {
  const tecnicos = await TicketService.getTecnicos();
  res.status(200).json(tecnicos);
};

const getComments = async (req, res) => {
  const { id } = req.params;
  const { incluir_internos } = req.query;
  const comments = await TicketService.getComments(id, incluir_internos === 'true');
  res.status(200).json(comments);
};

const addComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  // Buscar el ticket para notificaciones y validación extra
  const ticket = await TicketService.findById(id);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });
  if (ticket.estatus === 'CERRADO') return res.status(400).json({ message: 'No se pueden agregar mensajes a un ticket cerrado' });

  const comment = await TicketService.addComment(id, userId, req.body);

  // Si no es interno, notificar al usuario
  if (!req.body.es_interno && ticket.email_reporta) {
    const { notifyUserComment } = require('../services/ticketNotification.service');
    notifyUserComment(ticket, req.body.contenido, ticket.email_reporta)
      .catch(err => logger.error('[EMAIL] Notificación a usuario fallida:', err));
  }

  res.status(201).json(comment);
};

// Nuevo controlador para manejar la subida de adjuntos
const uploadTicketAttachment = [
  (req, res, next) => {
    req.ticketId = req.params.id; // Asignar el ID del ticket a req.ticketId para Multer
    next();
  },
  uploadTickets.single('file'), // 'file' es el nombre del campo en el formulario
  handleMulterError, // Manejador de errores de Multer
  async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Validación extra: Ticket no cerrado
    const ticket = await TicketService.findById(id);
    if (!ticket || ticket.estatus === 'CERRADO') {
      return res.status(400).json({ message: 'No se pueden adjuntar archivos a un ticket cerrado' });
    }

    // La URL relativa debe coincidir con la forma en que Express sirve los archivos estáticos
    // y cómo Multer los guarda.
    // Multer los guarda en /storage/tickets/ID_TICKET/nombre_generado.ext
    const fileUrl = `/storage/tickets/${id}/${file.filename}`; // CAMBIO AQUÍ: '/storage' en lugar de '/uploads'

    await TicketService.addAttachment(id, userId, fileUrl, file.originalname);

    res.status(201).json({ message: 'Archivo subido', url: fileUrl });
  }
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
  uploadAttachment: uploadTicketAttachment // Exportar el nuevo controlador
};
