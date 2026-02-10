/**
 * @module Controllers/Areas
 * @description Controlador para la gestión de áreas.
 */
const AreaService = require('../services/areas.service');
const { createAreaSchema, updateAreaSchema } = require('../schemas/area.schema');
const logger = require('../utils/logger');

const getAllAreas = async (req, res) => {
  const { id_sucursal } = req.query;
  const areas = await AreaService.findAll(id_sucursal);
  res.status(200).json(areas);
};

const getAreaById = async (req, res) => {
  const { id } = req.params;
  const area = await AreaService.findById(id);

  if (!area) {
    return res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
  }

  res.status(200).json(area);
};

const createArea = async (req, res) => {
  const validation = createAreaSchema.parse({ body: req.body });

  try {
    const newArea = await AreaService.create(validation.body);
    logger.info(`Área creada: ${newArea.nombre} (ID: ${newArea.id})`);
    res.status(201).json({
      message: 'Área creada exitosamente',
      id: newArea.id,
      nombre: newArea.nombre,
      id_sucursal: validation.body.id_sucursal
    });
  } catch (error) {
    if (error.message.includes('NOT_FOUND')) return res.status(404).json({ message: error.message });
    if (error.message.includes('BUSINESS_RULE') || error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const updateArea = async (req, res) => {
  const validation = updateAreaSchema.parse({ params: req.params, body: req.body });

  try {
    const updated = await AreaService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: `Área con ID ${validation.params.id} no encontrada.` });
    }
    logger.info(`Área ID ${validation.params.id} actualizada.`);
    res.status(200).json({ message: 'Área actualizada exitosamente' });
  } catch (error) {
    if (error.message.includes('NOT_FOUND')) return res.status(404).json({ message: error.message });
    if (error.message.includes('BUSINESS_RULE') || error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const deleteArea = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await AreaService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: `Área con ID ${id} no encontrada.` });
    }
    logger.info(`Área ID ${id} eliminada.`);
    res.status(200).json({ message: 'Área eliminada exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea
};