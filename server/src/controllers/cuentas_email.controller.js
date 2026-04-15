/**
 * @module Controllers/CuentasEmail
 * @description Controlador para la gestión de cuentas de correo corporativo.
 * Refactorizado con asyncHandler y validación Zod.
 */
const EmailService = require('../services/emails.service');
const { emailSchema, updateEmailSchema } = require('../schemas/email.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todas las cuentas de email.
 * @route GET /api/cuentas-email
 */
const getAllCuentasEmail = asyncHandler(async (req, res) => {
    const emails = await EmailService.findAll();
    res.status(200).json(emails);
});

/**
 * Obtiene una cuenta de email por ID.
 * @route GET /api/cuentas-email/:id
 */
const getCuentaEmailById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const email = await EmailService.findById(id);

    if (!email) {
        const error = new Error(`Cuenta de correo con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(email);
});

/**
 * Crea una nueva cuenta de email.
 * @route POST /api/cuentas-email
 */
const createCuentaEmail = asyncHandler(async (req, res) => {
    const validation = emailSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de cuenta de email inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newEmail = await EmailService.create(validation.data.body);
    logger.info(`Cuenta de email creada: ${newEmail.email} (ID: ${newEmail.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Cuenta de correo creada exitosamente',
        data: newEmail
    });
});

/**
 * Actualiza una cuenta de email existente.
 * @route PUT /api/cuentas-email/:id
 */
const updateCuentaEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateEmailSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await EmailService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Cuenta de correo con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Cuenta de email ID ${id} actualizada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Cuenta de correo actualizada exitosamente' 
    });
});

/**
 * Elimina una cuenta de email.
 * @route DELETE /api/cuentas-email/:id
 */
const deleteCuentaEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await EmailService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Cuenta de correo con ID ${id} no encontrada.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Cuenta de email ID ${id} eliminada.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Cuenta de correo eliminada exitosamente' 
    });
});

module.exports = {
    getAllCuentasEmail,
    getCuentaEmailById,
    createCuentaEmail,
    updateCuentaEmail,
    deleteCuentaEmail
};
