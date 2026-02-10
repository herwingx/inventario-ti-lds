/**
 * @module Controllers/Tickets
 * @description Controlador para la gestión de tickets de soporte.
 */
const TicketService = require('../services/tickets.service');
const { ticketSchema, updateTicketSchema } = require('../schemas/ticket.schema');
const logger = require('../utils/logger');

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
  logger.info(`Ticket creado: "${newTicket.titulo}" (ID: ${newTicket.id}) por usuario ID ${userId}`);

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

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};
