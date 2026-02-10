/**
 * @module Controllers/Notas
 * @description Controlador para la gestión de notas.
 */
const NotaService = require('../services/notas.service');
const { notaSchema, updateNotaSchema } = require('../schemas/nota.schema');

const getAllNotas = async (req, res) => {
  const notas = await NotaService.findAll();
  res.status(200).json(notas);
};

const getNotaById = async (req, res) => {
  const { id } = req.params;
  const nota = await NotaService.findById(id);
  if (!nota) return res.status(404).json({ message: 'Nota no encontrada' });
  res.status(200).json(nota);
};

const getNotasByEquipo = async (req, res) => {
  const { equipoId } = req.params;
  const notas = await NotaService.findAllByEquipo(equipoId);
  res.status(200).json(notas);
};

const createNota = async (req, res) => {
  const validation = notaSchema.parse({ body: req.body });
  const userId = req.user?.userId;

  const newNota = await NotaService.create(validation.body, userId);
  res.status(201).json(newNota);
};

const updateNota = async (req, res) => {
  const validation = updateNotaSchema.parse({ params: req.params, body: req.body });
  const updated = await NotaService.update(validation.params.id, validation.body);
  if (!updated) return res.status(404).json({ message: 'Nota no encontrada' });
  res.status(200).json({ message: 'Nota actualizada exitosamente' });
};

const deleteNota = async (req, res) => {
  const deleted = await NotaService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Nota no encontrada' });
  res.status(200).json({ message: 'Nota eliminada exitosamente' });
};

module.exports = {
  getAllNotas,
  getNotaById,
  getNotasByEquipo,
  createNota,
  updateNota,
  deleteNota
};