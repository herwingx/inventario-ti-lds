/**
 * @module Controllers/Documentacion
 * @description Controlador para la gestión de documentación.
 * Refactorizado con asyncHandler y validación Zod.
 */
const DocumentoService = require('../services/documentacion.service');
const { documentoSchema, updateDocumentoSchema } = require('../schemas/documentacion.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todos los documentos.
 * @route GET /api/documentacion
 */
const getAllDocumentos = asyncHandler(async (req, res) => {
    const docs = await DocumentoService.findAll();
    res.status(200).json(docs);
});

/**
 * Obtiene un documento por ID.
 * @route GET /api/documentacion/:id
 */
const getDocumentoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await DocumentoService.findById(id);

    if (!doc) {
        const error = new Error(`Documento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(doc);
});

/**
 * Crea un nuevo registro de documento.
 * @route POST /api/documentacion
 */
const createDocumento = asyncHandler(async (req, res) => {
    const validation = documentoSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de documento inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newDoc = await DocumentoService.create(validation.data.body);
    logger.info(`Documento registrado: ${newDoc.titulo} (ID: ${newDoc.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Documento registrado correctamente',
        data: { id: newDoc.id }
    });
});

/**
 * Actualiza un documento.
 * @route PUT /api/documentacion/:id
 */
const updateDocumento = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateDocumentoSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await DocumentoService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Documento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json({ 
        status: 'success',
        message: 'Documento actualizado correctamente' 
    });
});

/**
 * Elimina un documento.
 * @route DELETE /api/documentacion/:id
 */
const deleteDocumento = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await DocumentoService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Documento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Documento ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Documento eliminado correctamente' 
    });
});

module.exports = {
    getAllDocumentos,
    getDocumentoById,
    createDocumento,
    updateDocumento,
    deleteDocumento
};
