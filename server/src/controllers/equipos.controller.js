/**
 * @module Controllers/Equipos
 * @description Controlador para la gestión de equipos.
 * Implementa el patrón asyncHandler para limpieza de código y manejo centralizado de errores.
 */
const EquipoService = require('../services/equipos.service');
const { createEquipoSchema, updateEquipoSchema } = require('../schemas/equipo.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene la lista completa de equipos.
 * @route GET /api/equipos
 */
const getAllEquipos = asyncHandler(async (req, res) => {
    const equipos = await EquipoService.findAll();
    res.status(200).json(equipos);
});

/**
 * Busca un equipo por ID.
 * @route GET /api/equipos/:id
 */
const getEquipoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const equipo = await EquipoService.findById(id);

    if (!equipo) {
        const error = new Error(`Equipo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(equipo);
});

/**
 * Crea un nuevo equipo con validación estricta Zod.
 * @route POST /api/equipos
 */
const createEquipo = asyncHandler(async (req, res) => {
    const validation = createEquipoSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de entrada inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const newEquipo = await EquipoService.create(validation.data.body);

    logger.info(`Equipo creado: ID ${newEquipo.id} (${newEquipo.numero_serie})`);
    res.status(201).json({ 
        status: 'success',
        message: 'Equipo creado exitosamente', 
        data: newEquipo 
    });
});

/**
 * Actualiza un equipo existente.
 * @route PUT /api/equipos/:id
 */
const updateEquipo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateEquipoSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await EquipoService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`No se pudo actualizar. Equipo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Equipo ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: `Equipo con ID ${id} actualizado exitosamente.` 
    });
});

/**
 * Elimina un equipo.
 * @route DELETE /api/equipos/:id
 */
const deleteEquipo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await EquipoService.delete(id);

    if (!deleted) {
        const error = new Error(`No se pudo eliminar. Equipo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Equipo ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: `Equipo con ID ${id} eliminado exitosamente.` 
    });
});

/**
 * Obtiene componentes disponibles para ensamble.
 * @route GET /api/equipos/disponibles-componentes
 */
const getEquiposDisponiblesParaComponentes = asyncHandler(async (req, res) => {
    const components = await EquipoService.getAvailableComponents();
    res.status(200).json(components);
});

module.exports = {
    getAllEquipos,
    getEquipoById,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    getEquiposDisponiblesParaComponentes
};
