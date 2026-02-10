/**
 * @module Controllers/TiposSucursal
 * @description Controlador para la gestión de tipos de sucursal.
 */
const TipoSucursalService = require('../services/tipos_sucursal.service');
const { tipoSucursalSchema, updateTipoSucursalSchema } = require('../schemas/tipo_sucursal.schema');

const getAllTiposSucursal = async (req, res) => {
  const tipos = await TipoSucursalService.findAll();
  res.status(200).json(tipos);
};

const getTipoSucursalById = async (req, res) => {
  const t = await TipoSucursalService.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Tipo de sucursal no encontrado' });
  res.status(200).json(t);
};

const createTipoSucursal = async (req, res) => {
  const validation = tipoSucursalSchema.parse({ body: req.body });
  try {
    const newTipo = await TipoSucursalService.create(validation.body);
    res.status(201).json(newTipo);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const updateTipoSucursal = async (req, res) => {
  const validation = updateTipoSucursalSchema.parse({ params: req.params, body: req.body });
  try {
    const updated = await TipoSucursalService.update(validation.params.id, validation.body);
    if (!updated) return res.status(404).json({ message: 'Tipo de sucursal no encontrado' });
    res.status(200).json({ message: 'Tipo de sucursal actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const deleteTipoSucursal = async (req, res) => {
  const deleted = await TipoSucursalService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Tipo de sucursal no encontrado' });
  res.status(200).json({ message: 'Tipo de sucursal eliminado exitosamente' });
};

module.exports = {
  getAllTiposSucursal,
  getTipoSucursalById,
  createTipoSucursal,
  updateTipoSucursal,
  deleteTipoSucursal
};