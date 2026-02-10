/**
 * @module Controllers/Status
 * @description Controlador para la gestión de estados (status).
 */
const StatusService = require('../services/status.service');
const { statusSchema, updateStatusSchema } = require('../schemas/status.schema');

const getAllStatus = async (req, res) => {
  const status = await StatusService.findAll();
  res.status(200).json(status);
};

const getStatusById = async (req, res) => {
  const { id } = req.params;
  const s = await StatusService.findById(id);
  if (!s) return res.status(404).json({ message: 'Status no encontrado' });
  res.status(200).json(s);
};

const createStatus = async (req, res) => {
  const validation = statusSchema.parse({ body: req.body });
  try {
    const newStatus = await StatusService.create(validation.body);
    res.status(201).json(newStatus);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const updateStatus = async (req, res) => {
  const validation = updateStatusSchema.parse({ params: req.params, body: req.body });
  try {
    const updated = await StatusService.update(validation.params.id, validation.body);
    if (!updated) return res.status(404).json({ message: 'Status no encontrado' });
    res.status(200).json({ message: 'Status actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const deleteStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await StatusService.delete(id);
    if (!deleted) return res.status(404).json({ message: 'Status no encontrado' });
    res.status(200).json({ message: 'Status eliminado exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

module.exports = {
  getAllStatus,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus
};