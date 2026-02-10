/**
 * @module Controllers/Mantenimientos
 * @description Controlador para la gestión de mantenimientos.
 */
const MantenimientoService = require('../services/mantenimientos.service');
const { createMantenimientoSchema, updateMantenimientoSchema } = require('../schemas/mantenimiento.schema');
const logger = require('../utils/logger');

const getAllMantenimientos = async (req, res, next) => {
  try {
    const mantenimientos = await MantenimientoService.findAll(req.query);
    res.status(200).json(mantenimientos);
  } catch (error) {
    next(error);
  }
};

const getMantenimientoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mantenimiento = await MantenimientoService.findById(id);

    if (!mantenimiento) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    res.status(200).json(mantenimiento);
  } catch (error) {
    next(error);
  }
};

const createMantenimiento = async (req, res, next) => {
  try {
    const validation = createMantenimientoSchema.parse({ body: req.body });
    const userId = req.user ? req.user.userId : null;

    const newManto = await MantenimientoService.create(validation.body, userId);

    logger.info(`Mantenimiento programado: ${newManto.titulo} (ID: ${newManto.id})`);

    res.status(201).json({
      id: newManto.id,
      message: 'Mantenimiento programado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const updateMantenimiento = async (req, res, next) => {
  try {
    const validation = updateMantenimientoSchema.parse({ params: req.params, body: req.body });

    const updated = await MantenimientoService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    logger.info(`Mantenimiento ID ${validation.params.id} actualizado.`);
    res.status(200).json({ message: 'Mantenimiento actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const deleteMantenimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await MantenimientoService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    logger.info(`Mantenimiento ID ${id} eliminado.`);
    res.status(200).json({ message: 'Mantenimiento eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({ message: 'No se puede eliminar el mantenimiento porque tiene registros vinculados (auditorías, archivos, etc.)' });
    }
    next(error);
  }
};

module.exports = {
  getAllMantenimientos,
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento
};