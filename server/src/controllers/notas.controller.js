/**
 * @module Controllers/Notas
 * @description Controlador para la gestión de notas.
 * Refactorizado con asyncHandler y validación Zod.
 */
const NotaService = require('../services/notas.service');
const { notaSchema, updateNotaSchema } = require('../schemas/nota.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las notas.
 * @route GET /api/notas
 */
const getAllNotas = asyncHandler(async (req, res) => {
    const notas = await NotaService.findAll();
    res.status(200).json(notas);
});

/**
 * Obtiene una nota por ID.
 * @route GET /api/notas/:id
 */
const getNotaById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const nota = await NotaService.findById(id);

    if (!nota) {
        const error = new Error(`Nota con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(nota);
});

/**
 * Obtiene notas asociadas a un equipo.
 * @route GET /api/notas/equipo/:equipoId
 */
const getNotasByEquipo = asyncHandler(async (req, res) => {
    const { equipoId } = req.params;
    const notas = await NotaService.findAllByEquipo(equipoId);
    res.status(200).json(notas);
});

/**
 * Crea una nueva nota.
 * @route POST /api/notas
 */
const createNota = asyncHandler(async (req, res) => {
    const validation = notaSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de nota inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const userId = req.user?.userId;
    const newNota = await NotaService.create(validation.data.body, userId);
    
    logger.info(`Nota creada ID ${newNota.id} por Usuario ${userId}`);
    res.status(201).json({
        status: 'success',
        message: 'Nota creada exitosamente',
        data: newNota
    });
});

/**
 * Actualiza una nota existente.
 * @route PUT /api/notas/:id
 */
const updateNota = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateNotaSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await NotaService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Nota con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json({ 
        status: 'success',
        message: 'Nota actualizada exitosamente' 
    });
});

/**
 * Elimina una nota.
 * @route DELETE /api/notas/:id
 */
const deleteNota = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await NotaService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Nota con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json({ 
        status: 'success',
        message: 'Nota eliminada exitosamente' 
    });
});

module.exports = {
    getAllNotas,
    getNotaById,
    getNotasByEquipo,
    createNota,
    updateNota,
    deleteNota
};
