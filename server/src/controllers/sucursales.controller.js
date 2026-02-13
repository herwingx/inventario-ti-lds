/**
 * @module Controllers/Sucursales
 * @description Controlador para la gestión de sucursales.
 * Refactorizado con asyncHandler y validación Zod.
 */
const SucursalService = require('../services/sucursales.service');
const { createSucursalSchema, updateSucursalSchema } = require('../schemas/sucursal.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las sucursales.
 * @route GET /api/sucursales
 */
const getAllSucursales = asyncHandler(async (req, res) => {
    const sucursales = await SucursalService.findAll();
    res.status(200).json(sucursales);
});

/**
 * Obtiene una sucursal por ID.
 * @route GET /api/sucursales/:id
 */
const getSucursalById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sucursal = await SucursalService.findById(id);

    if (!sucursal) {
        const error = new Error(`Sucursal con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(sucursal);
});

/**
 * Crea una nueva sucursal.
 * @route POST /api/sucursales
 */
const createSucursal = asyncHandler(async (req, res) => {
    const validation = createSucursalSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de sucursal inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const newSucursal = await SucursalService.create(validation.data.body);
    logger.info(`Sucursal creada: ${newSucursal.nombre} (ID: ${newSucursal.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Sucursal creada exitosamente',
        data: newSucursal
    });
});

/**
 * Actualiza una sucursal existente.
 * @route PUT /api/sucursales/:id
 */
const updateSucursal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateSucursalSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await SucursalService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Sucursal con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Sucursal ID ${id} actualizada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Sucursal actualizada exitosamente' 
    });
});

/**
 * Elimina una sucursal.
 * @route DELETE /api/sucursales/:id
 */
const deleteSucursal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await SucursalService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Sucursal con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Sucursal ID ${id} eliminada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Sucursal eliminada exitosamente' 
    });
});

module.exports = {
    getAllSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    deleteSucursal
};
