/**
 * @module Controllers/Empleados
 * @description Controlador para la gestión de empleados.
 * Implementa validación estricta y manejo de errores asíncrono.
 */
const EmpleadoService = require('../services/empleados.service');
const { createEmpleadoSchema, updateEmpleadoSchema } = require('../schemas/empleado.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene la lista de todos los empleados.
 * @route GET /api/empleados
 */
const getAllEmpleados = asyncHandler(async (req, res) => {
    const empleados = await EmpleadoService.findAll();
    res.status(200).json(empleados);
});

/**
 * Obtiene un empleado por su ID.
 * @route GET /api/empleados/:id
 */
const getEmpleadoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const empleado = await EmpleadoService.findById(id);

    if (!empleado) {
        const error = new Error(`Empleado con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(empleado);
});

/**
 * Crea un nuevo empleado.
 * @route POST /api/empleados
 */
const createEmpleado = asyncHandler(async (req, res) => {
    const validation = createEmpleadoSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de empleado inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newEmpleado = await EmpleadoService.create(validation.data.body);
    
    logger.info(`Empleado creado: ${newEmpleado.nombres} ${newEmpleado.apellidos} (ID: ${newEmpleado.id})`);
    res.status(201).json({
        status: 'success',
        message: 'Empleado creado exitosamente',
        data: { id: newEmpleado.id }
    });
});

/**
 * Actualiza un empleado existente.
 * @route PUT /api/empleados/:id
 */
const updateEmpleado = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateEmpleadoSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await EmpleadoService.update(id, validation.data.body);
    
    if (!updated) {
        const error = new Error(`Empleado con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Empleado ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Empleado actualizado exitosamente' 
    });
});

/**
 * Elimina (o desactiva) un empleado.
 * @route DELETE /api/empleados/:id
 */
const deleteEmpleado = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await EmpleadoService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Empleado con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Empleado ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Empleado eliminado exitosamente' 
    });
});

module.exports = {
    getAllEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado
};
