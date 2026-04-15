/**
 * @module Controllers/DireccionesIp
 * @description Controlador para la gestión de direcciones IP.
 * Refactorizado con asyncHandler y validación Zod.
 */
const IpService = require('../services/ips.service');
const { ipSchema, updateIpSchema } = require('../schemas/ip.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las direcciones IP.
 * @route GET /api/direcciones-ip
 */
const getAllDireccionesIp = asyncHandler(async (req, res) => {
    const ips = await IpService.findAll(req.query);
    res.status(200).json(ips);
});

/**
 * Obtiene un resumen de uso por segmento.
 * @route GET /api/direcciones-ip/resumen
 */
const getSegmentosResumen = asyncHandler(async (req, res) => {
    const resumen = await IpService.getResumenBySegmento();
    res.status(200).json(resumen);
});

/**
 * Obtiene una dirección IP por ID.
 * @route GET /api/direcciones-ip/:id
 */
const getDireccionIpById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ip = await IpService.findById(id);

    if (!ip) {
        const error = new Error(`IP con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(ip);
});

/**
 * Crea una nueva dirección IP.
 * @route POST /api/direcciones-ip
 */
const createDireccionIp = asyncHandler(async (req, res) => {
    const validation = ipSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de IP inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newIp = await IpService.create(validation.data.body);
    logger.info(`IP creada: ${newIp.direccion_ip} (ID: ${newIp.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'IP creada exitosamente',
        data: newIp
    });
});

/**
 * Actualiza una dirección IP.
 * @route PUT /api/direcciones-ip/:id
 */
const updateDireccionIp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateIpSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await IpService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`IP con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`IP ID ${id} actualizada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'IP actualizada exitosamente' 
    });
});

/**
 * Elimina una dirección IP.
 * @route DELETE /api/direcciones-ip/:id
 */
const deleteDireccionIp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await IpService.delete(id);
    
    if (!deleted) {
        const error = new Error(`IP con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`IP ID ${id} eliminada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'IP eliminada exitosamente' 
    });
});

module.exports = {
    getAllDireccionesIp,
    getSegmentosResumen,
    getDireccionIpById,
    createDireccionIp,
    updateDireccionIp,
    deleteDireccionIp
};
