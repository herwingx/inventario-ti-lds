/**
 * @module Controllers/Empleados
 * @description Controlador para la gestión de empleados.
 */
const EmpleadoService = require('../services/empleados.service');
const { createEmpleadoSchema, updateEmpleadoSchema } = require('../schemas/empleado.schema');
const logger = require('../utils/logger');

const getAllEmpleados = async (req, res) => {
  const empleados = await EmpleadoService.findAll();
  res.status(200).json(empleados);
};

const getEmpleadoById = async (req, res) => {
  const { id } = req.params;
  const empleado = await EmpleadoService.findById(id);

  if (!empleado) {
    return res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
  }

  res.status(200).json(empleado);
};

const createEmpleado = async (req, res) => {
  const validation = createEmpleadoSchema.parse({ body: req.body });

  try {
    const newEmpleado = await EmpleadoService.create(validation.body);
    logger.info(`Empleado creado: ${newEmpleado.nombres} ${newEmpleado.apellidos} (ID: ${newEmpleado.id})`);
    res.status(201).json({
      message: 'Empleado creado exitosamente',
      id: newEmpleado.id
    });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const updateEmpleado = async (req, res) => {
  const validation = updateEmpleadoSchema.parse({ params: req.params, body: req.body });

  try {
    const updated = await EmpleadoService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: `Empleado con ID ${validation.params.id} no encontrado.` });
    }
    logger.info(`Empleado ID ${validation.params.id} actualizado.`);
    res.status(200).json({ message: 'Empleado actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const deleteEmpleado = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await EmpleadoService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: `Empleado con ID ${id} no encontrado.` });
    }
    logger.info(`Empleado ID ${id} eliminado.`);
    res.status(200).json({ message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  getAllEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
};