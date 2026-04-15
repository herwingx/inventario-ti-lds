/**
 * @module Controllers/Status
 * @description Controlador para la gestión de estados (status).
 * Refactorizado con asyncHandler y validación Zod.
 */
const StatusService = require('../services/status.service');
const { statusSchema, updateStatusSchema } = require('../schemas/status.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todos los estados.
 * @route GET /api/status
 */
const getAllStatus = asyncHandler(async (req, res) => {
    const status = await StatusService.findAll();
    res.status(200).json(status);
});

/**
 * Obtiene un estado por ID.
 * @route GET /api/status/:id
 */
const getStatusById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const s = await StatusService.findById(id);

    if (!s) {
        const error = new Error(`Status con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(s);
});

/**
 * Crea un nuevo estado.
 * @route POST /api/status
 */
const createStatus = asyncHandler(async (req, res) => {
    const validation = statusSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de status inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newStatus = await StatusService.create(validation.data.body);
    logger.info(`Status creado: ${newStatus.nombre_status} (ID: ${newStatus.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Status creado exitosamente',
        data: newStatus
    });
});

/**
 * Actualiza un estado existente.
 * @route PUT /api/status/:id
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateStatusSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await StatusService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Status con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Status ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Status actualizado exitosamente' 
    });
});

/**
 * Elimina un estado.
 * @route DELETE /api/status/:id
 */
const deleteStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await StatusService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Status con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Status ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Status eliminado exitosamente' 
    });
});

module.exports = {
    getAllStatus,
    getStatusById,
    createStatus,
    updateStatus,
    deleteStatus
};
