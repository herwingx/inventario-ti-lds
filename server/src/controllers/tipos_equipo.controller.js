/**
 * @module Controllers/TiposEquipo
 * @description Controlador para la gestión de tipos de equipo.
 * Refactorizado con asyncHandler y validación Zod.
 */
const TipoEquipoService = require('../services/tipos_equipo.service');
const { tipoEquipoSchema, updateTipoEquipoSchema } = require('../schemas/tipo_equipo.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todos los tipos de equipo.
 * @route GET /api/tipos-equipo
 */
const getAllTiposEquipo = asyncHandler(async (req, res) => {
    const tipos = await TipoEquipoService.findAll();
    res.status(200).json(tipos);
});

/**
 * Obtiene un tipo de equipo por ID.
 * @route GET /api/tipos-equipo/:id
 */
const getTipoEquipoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tipo = await TipoEquipoService.findById(id);

    if (!tipo) {
        const error = new Error(`Tipo de equipo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(tipo);
});

/**
 * Crea un nuevo tipo de equipo.
 * @route POST /api/tipos-equipo
 */
const createTipoEquipo = asyncHandler(async (req, res) => {
    const validation = tipoEquipoSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de tipo de equipo inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const newTipo = await TipoEquipoService.create(validation.data.body);
    logger.info(`Tipo de equipo creado: ID ${newTipo.id}`);
    
    res.status(201).json({
        status: 'success',
        message: 'Tipo de equipo creado exitosamente',
        data: newTipo
    });
});

/**
 * Actualiza un tipo de equipo.
 * @route PUT /api/tipos-equipo/:id
 */
const updateTipoEquipo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateTipoEquipoSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await TipoEquipoService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Tipo de equipo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Tipo de equipo ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Tipo de equipo actualizado exitosamente' 
    });
});

/**
 * Elimina un tipo de equipo.
 * @route DELETE /api/tipos-equipo/:id
 */
const deleteTipoEquipo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await TipoEquipoService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Tipo de equipo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Tipo de equipo ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Tipo de equipo eliminado exitosamente' 
    });
});

module.exports = {
    getAllTiposEquipo,
    getTipoEquipoById,
    createTipoEquipo,
    updateTipoEquipo,
    deleteTipoEquipo
};
