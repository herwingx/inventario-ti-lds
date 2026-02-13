/**
 * @module Controllers/Empresas
 * @description Controlador para la gestión de empresas.
 * Refactorizado con asyncHandler y validación Zod.
 */
const EmpresaService = require('../services/empresas.service');
const { createEmpresaSchema, updateEmpresaSchema } = require('../schemas/empresa.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las empresas.
 * @route GET /api/empresas
 */
const getAllEmpresas = asyncHandler(async (req, res) => {
    const empresas = await EmpresaService.findAll();
    res.status(200).json(empresas);
});

/**
 * Obtiene una empresa por ID.
 * @route GET /api/empresas/:id
 */
const getEmpresaById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const empresa = await EmpresaService.findById(id);

    if (!empresa) {
        const error = new Error(`Empresa con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(empresa);
});

/**
 * Crea una nueva empresa.
 * @route POST /api/empresas
 */
const createEmpresa = asyncHandler(async (req, res) => {
    const validation = createEmpresaSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de empresa inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const newEmpresa = await EmpresaService.create(validation.data.body);
    logger.info(`Empresa creada: ${newEmpresa.nombre} (ID: ${newEmpresa.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Empresa creada exitosamente',
        data: newEmpresa
    });
});

/**
 * Actualiza una empresa existente.
 * @route PUT /api/empresas/:id
 */
const updateEmpresa = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateEmpresaSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await EmpresaService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Empresa con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Empresa ID ${id} actualizada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Empresa actualizada exitosamente' 
    });
});

/**
 * Elimina una empresa.
 * @route DELETE /api/empresas/:id
 */
const deleteEmpresa = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await EmpresaService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Empresa con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Empresa ID ${id} eliminada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Empresa eliminada exitosamente' 
    });
});

module.exports = {
    getAllEmpresas,
    getEmpresaById,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa
};
