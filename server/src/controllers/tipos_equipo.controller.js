/**
 * @module Controllers/TiposEquipo
 * @description Controlador para la gestión de tipos de equipo.
 */
const TipoEquipoService = require('../services/tipos_equipo.service');
const { tipoEquipoSchema, updateTipoEquipoSchema } = require('../schemas/tipo_equipo.schema');

const getAllTiposEquipo = async (req, res) => {
  const tipos = await TipoEquipoService.findAll();
  res.status(200).json(tipos);
};

const getTipoEquipoById = async (req, res) => {
  const { id } = req.params;
  const t = await TipoEquipoService.findById(id);
  if (!t) return res.status(404).json({ message: 'Tipo de equipo no encontrado' });
  res.status(200).json(t);
};

const createTipoEquipo = async (req, res) => {
  const validation = tipoEquipoSchema.parse({ body: req.body });
  try {
    const newTipo = await TipoEquipoService.create(validation.body);
    res.status(201).json(newTipo);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const updateTipoEquipo = async (req, res) => {
  const validation = updateTipoEquipoSchema.parse({ params: req.params, body: req.body });
  try {
    const updated = await TipoEquipoService.update(validation.params.id, validation.body);
    if (!updated) return res.status(404).json({ message: 'Tipo de equipo no encontrado' });
    res.status(200).json({ message: 'Tipo de equipo actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const deleteTipoEquipo = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await TipoEquipoService.delete(id);
    if (!deleted) return res.status(404).json({ message: 'Tipo de equipo no encontrado' });
    res.status(200).json({ message: 'Tipo de equipo eliminado exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

module.exports = {
  getAllTiposEquipo,
  getTipoEquipoById,
  createTipoEquipo,
  updateTipoEquipo,
  deleteTipoEquipo
};