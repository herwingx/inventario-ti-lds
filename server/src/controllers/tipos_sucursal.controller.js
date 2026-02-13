/**
 * @module Controllers/TiposSucursal
 * @description Controlador para la gestión de tipos de sucursal.
 * Refactorizado con asyncHandler y validación Zod.
 */
const TipoSucursalService = require('../services/tipos_sucursal.service');
const { tipoSucursalSchema, updateTipoSucursalSchema } = require('../schemas/tipo_sucursal.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todos los tipos de sucursal.
 * @route GET /api/tipos-sucursal
 */
const getAllTiposSucursal = asyncHandler(async (req, res) => {
    const tipos = await TipoSucursalService.findAll();
    res.status(200).json(tipos);
});

/**
 * Obtiene un tipo de sucursal por ID.
 * @route GET /api/tipos-sucursal/:id
 */
const getTipoSucursalById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tipo = await TipoSucursalService.findById(id);

    if (!tipo) {
        const error = new Error(`Tipo de sucursal con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(tipo);
});

/**
 * Crea un nuevo tipo de sucursal.
 * @route POST /api/tipos-sucursal
 */
const createTipoSucursal = asyncHandler(async (req, res) => {
    const validation = tipoSucursalSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de tipo de sucursal inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const newTipo = await TipoSucursalService.create(validation.data.body);
    logger.info(`Tipo de sucursal creado: ID ${newTipo.id}`);
    
    res.status(201).json({
        status: 'success',
        message: 'Tipo de sucursal creado exitosamente',
        data: newTipo
    });
});

/**
 * Actualiza un tipo de sucursal.
 * @route PUT /api/tipos-sucursal/:id
 */
const updateTipoSucursal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateTipoSucursalSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await TipoSucursalService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Tipo de sucursal con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Tipo de sucursal ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Tipo de sucursal actualizado exitosamente' 
    });
});

/**
 * Elimina un tipo de sucursal.
 * @route DELETE /api/tipos-sucursal/:id
 */
const deleteTipoSucursal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await TipoSucursalService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Tipo de sucursal con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Tipo de sucursal ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Tipo de sucursal eliminado exitosamente' 
    });
});

module.exports = {
    getAllTiposSucursal,
    getTipoSucursalById,
    createTipoSucursal,
    updateTipoSucursal,
    deleteTipoSucursal
};
