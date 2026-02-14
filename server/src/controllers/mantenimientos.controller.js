/**
 * @module Controllers/Mantenimientos
 * @description Controlador para la gestión de mantenimientos.
 * Refactorizado con asyncHandler y validación Zod.
 */
const MantenimientoService = require('../services/mantenimientos.service');
const { createMantenimientoSchema, updateMantenimientoSchema } = require('../schemas/mantenimiento.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma'); // Usado para consultas directas de evidencia si es necesario, o mover a servicio

/**
 * Obtiene todos los mantenimientos.
 * @route GET /api/mantenimientos
 */
const getAllMantenimientos = asyncHandler(async (req, res) => {
    const mantenimientos = await MantenimientoService.findAll(req.query);
    res.status(200).json(mantenimientos);
});

/**
 * Obtiene un mantenimiento por ID.
 * @route GET /api/mantenimientos/:id
 */
const getMantenimientoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const mantenimiento = await MantenimientoService.findById(id);

    if (!mantenimiento) {
        const error = new Error(`Mantenimiento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(mantenimiento);
});

/**
 * Crea un nuevo mantenimiento.
 * @route POST /api/mantenimientos
 */
const createMantenimiento = asyncHandler(async (req, res) => {
    const validation = createMantenimientoSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de mantenimiento inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const userId = req.user ? req.user.userId : null;
    
    try {
        const newManto = await MantenimientoService.create(validation.data.body, userId);

        logger.info(`Mantenimiento programado: ${newManto.titulo} (ID: ${newManto.id})`);

        res.status(201).json({
            status: 'success',
            message: 'Mantenimiento programado exitosamente',
            data: { id: newManto.id }
        });
    } catch (error) {
        if (error.code === 'P2003') {
            const field = error.meta?.field_name || 'un campo relacionado';
            const errorMsg = field.includes('id_equipo') 
                ? 'El ID del equipo proporcionado no existe.' 
                : 'No se puede crear el mantenimiento debido a una referencia inválida (equipo o técnico no encontrado).';
            
            const conflictError = new Error(errorMsg);
            conflictError.statusCode = 400; // Bad Request because the input ID is wrong
            conflictError.isOperational = true;
            throw conflictError;
        }
        throw error;
    }
});

/**
 * Actualiza un mantenimiento existente.
 * @route PUT /api/mantenimientos/:id
 */
const updateMantenimiento = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateMantenimientoSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const updated = await MantenimientoService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Mantenimiento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Mantenimiento ID ${id} actualizado.`);
    res.status(200).json({
        status: 'success',
        message: 'Mantenimiento actualizado exitosamente'
    });
});

/**
 * Elimina un mantenimiento.
 * @route DELETE /api/mantenimientos/:id
 */
const deleteMantenimiento = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await MantenimientoService.delete(id);
        if (!deleted) {
            const error = new Error(`Mantenimiento con ID ${id} no encontrado.`);
            error.statusCode = 404;
            error.isOperational = true;
            throw error;
        }

        logger.info(`Mantenimiento ID ${id} eliminado.`);
        res.status(200).json({
            status: 'success',
            message: 'Mantenimiento eliminado exitosamente'
        });
    } catch (error) {
        if (error.code === 'P2003') { // Prisma foreign key constraint code
            const conflictError = new Error('No se puede eliminar porque tiene registros vinculados (evidencias, auditoría).');
            conflictError.statusCode = 409;
            conflictError.isOperational = true;
            throw conflictError;
        }
        throw error;
    }
});

// =============================================
// FASE 2B: GESTIÓN DE EVIDENCIAS
// =============================================

/**
 * Obtiene todas las evidencias de un mantenimiento.
 * @route GET /api/mantenimientos/:id/evidencias
 */
const getEvidencias = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el mantenimiento existe (Idealmente mover a servicio)
    const maintenance = await prisma.mantenimientos.findUnique({ where: { id: parseInt(id) } });
    if (!maintenance) {
        const error = new Error(`Mantenimiento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    const evidencias = await prisma.mantenimiento_evidencias.findMany({
        where: { id_mantenimiento: parseInt(id) },
        orderBy: { fecha_subida: 'desc' },
        select: {
            id: true,
            tipo: true,
            url_archivo: true,
            descripcion: true,
            nombre_original: true,
            mime_type: true,
            tamano_bytes: true,
            fecha_subida: true
        }
    });

    res.json(evidencias);
});

/**
 * Agrega una evidencia a un mantenimiento.
 * @route POST /api/mantenimientos/:id/evidencias
 */
const addEvidencia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tipo, descripcion } = req.body;

    const maintenance = await prisma.mantenimientos.findUnique({ where: { id: parseInt(id) } });
    if (!maintenance) {
        const error = new Error(`Mantenimiento con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    if (!req.file) {
        const error = new Error('No se proporcionó ningún archivo.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
    }

    const urlArchivo = `/storage/evidencias/${req.file.filename}`;

    const newEvidencia = await prisma.mantenimiento_evidencias.create({
        data: {
            id_mantenimiento: parseInt(id),
            url_archivo: urlArchivo,
            tipo: tipo || 'DIAGNOSTICO',
            descripcion: descripcion || null,
            nombre_original: req.file.originalname,
            mime_type: req.file.mimetype,
            tamano_bytes: req.file.size
        }
    });

    res.status(201).json({
        status: 'success',
        message: 'Evidencia subida exitosamente',
        data: newEvidencia
    });
});

/**
 * Elimina una evidencia.
 * @route DELETE /api/mantenimientos/:id/evidencias/:evidenciaId
 */
const deleteEvidencia = asyncHandler(async (req, res) => {
    const { id, evidenciaId } = req.params;
    const path = require('path');
    const fs = require('fs').promises;

    const evidencia = await prisma.mantenimiento_evidencias.findFirst({
        where: {
            id: parseInt(evidenciaId),
            id_mantenimiento: parseInt(id)
        }
    });

    if (!evidencia) {
        const error = new Error('Evidencia no encontrada.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // Eliminar archivo físico (Soft fail)
    try {
        // En Express server.js: app.use('/storage', express.static(path.join(__dirname, 'storage')));
        // url_archivo se guarda como: /storage/evidencias/filename
        
        // Quitar el slash inicial y convertir a ruta absoluta del sistema
        const relativePath = evidencia.url_archivo.replace(/^\//, ''); // e.g. "storage/evidencias/file.jpg"
        
        // El CWD debería ser la raíz del proyecto (donde está server/ o server.js se ejecuta desde dentro)
        // PERO aquí estamos asumiendo que server.js se ejecuta desde "server/".
        // Si usamos process.cwd() al lanzar "npm start" dentro de server, será /path/to/server
        // Si url_archivo es "storage/evidencias/...", entonces:
        // /path/to/server/storage/evidencias/... CORRECTO
        
        const absolutePath = path.join(process.cwd(), relativePath); 
        
        await fs.unlink(absolutePath);
    } catch (fileError) {
        logger.warn(`[EVIDENCIAS] No se pudo eliminar archivo físico: ${fileError.message}`);
    }

    await prisma.mantenimiento_evidencias.delete({
        where: { id: parseInt(evidenciaId) }
    });

    res.json({
        status: 'success',
        message: 'Evidencia eliminada correctamente'
    });
});

module.exports = {
    getAllMantenimientos,
    getMantenimientoById,
    createMantenimiento,
    updateMantenimiento,
    deleteMantenimiento,
    getEvidencias,
    addEvidencia,
    deleteEvidencia
};
