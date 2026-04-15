/**
 * @module Controllers/Areas
 * @description Controlador para la gestión de áreas.
 * Implementa validación estricta y manejo de errores asíncrono.
 */
const AreaService = require('../services/areas.service');
const { createAreaSchema, updateAreaSchema } = require('../schemas/area.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las áreas, opcionalmente filtradas por sucursal.
 * @route GET /api/areas
 */
const getAllAreas = asyncHandler(async (req, res) => {
    const { id_sucursal } = req.query;
    const areas = await AreaService.findAll(id_sucursal);
    res.status(200).json(areas);
});

/**
 * Obtiene un área por ID.
 * @route GET /api/areas/:id
 */
const getAreaById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const area = await AreaService.findById(id);

    if (!area) {
        const error = new Error(`Área con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(area);
});

/**
 * Crea una nueva área.
 * @route POST /api/areas
 */
const createArea = asyncHandler(async (req, res) => {
    const validation = createAreaSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de área inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newArea = await AreaService.create(validation.data.body);
    logger.info(`Área creada: ${newArea.nombre} (ID: ${newArea.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Área creada exitosamente',
        data: newArea
    });
});

/**
 * Actualiza un área existente.
 * @route PUT /api/areas/:id
 */
const updateArea = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateAreaSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await AreaService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Área con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Área ID ${id} actualizada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Área actualizada exitosamente' 
    });
});

/**
 * Elimina (o desactiva) un área.
 * @route DELETE /api/areas/:id
 */
const deleteArea = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await AreaService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Área con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Área ID ${id} eliminada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Área eliminada exitosamente' 
    });
});

module.exports = {
    getAllAreas,
    getAreaById,
    createArea,
    updateArea,
    deleteArea
};
