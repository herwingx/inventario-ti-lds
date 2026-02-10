/**
 * @module Controllers/Sucursales
 * @description Controlador para la gestión de sucursales.
 */
const SucursalService = require('../services/sucursales.service');
const { createSucursalSchema, updateSucursalSchema } = require('../schemas/sucursal.schema');
const logger = require('../utils/logger');

const getAllSucursales = async (req, res) => {
  const sucursales = await SucursalService.findAll();
  res.status(200).json(sucursales);
};

const getSucursalById = async (req, res) => {
  const { id } = req.params;
  const sucursal = await SucursalService.findById(id);

  if (!sucursal) {
    return res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
  }

  res.status(200).json(sucursal);
};

const createSucursal = async (req, res) => {
  const validation = createSucursalSchema.parse({ body: req.body });

  try {
    const newSucursal = await SucursalService.create(validation.body);
    logger.info(`Sucursal creada: ${newSucursal.nombre} (ID: ${newSucursal.id})`);
    res.status(201).json(newSucursal);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const updateSucursal = async (req, res) => {
  const validation = updateSucursalSchema.parse({ params: req.params, body: req.body });

  try {
    const updated = await SucursalService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: `Sucursal con ID ${validation.params.id} no encontrada.` });
    }
    logger.info(`Sucursal ID ${validation.params.id} actualizada.`);
    res.status(200).json({ message: 'Sucursal actualizada exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const deleteSucursal = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await SucursalService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: `Sucursal con ID ${id} no encontrada.` });
    }
    logger.info(`Sucursal ID ${id} eliminada.`);
    res.status(200).json({ message: 'Sucursal eliminada exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  getAllSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal
};