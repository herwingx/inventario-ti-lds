/**
 * @module Controllers/Profile
 * @description Controlador para el perfil del usuario autenticado.
 * Refactorizado con asyncHandler y validación Zod.
 */
const ProfileService = require('../services/profile.service');
const { z } = require('zod');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

// Esquema de validación inline (o mover a schema file si crece)
const updateProfileSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida para cambios sensibles').optional(),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional()
}).refine(data => {
  // Si se envía newPassword, se requiere currentPassword
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Para cambiar la contraseña, debe proporcionar la contraseña actual.',
  path: ['currentPassword']
});

/**
 * Obtiene el perfil del usuario actual.
 * @route GET /api/profile
 */
const getProfile = asyncHandler(async (req, res) => {
    // req.user viene del middleware de autenticación (JWT)
    const user = await ProfileService.getProfile(req.user.userId);
    
    if (!user) {
        const error = new Error('Perfil de usuario no encontrado.');
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(user);
});

/**
 * Actualiza el perfil del usuario.
 * @route PUT /api/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    const validation = updateProfileSchema.safeParse(req.body);

    if (!validation.success) {
        const error = new Error('Datos de perfil inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    try {
        await ProfileService.updateProfile(req.user.userId, validation.data);
        logger.info(`Perfil actualizado para usuario ID ${req.user.userId}`);
        res.status(200).json({ 
            status: 'success',
            message: 'Perfil actualizado exitosamente' 
        });
    } catch (error) {
        if (error.message.includes('INVALID_PASSWORD')) {
            const authError = new Error('La contraseña actual es incorrecta.');
            authError.statusCode = 401;
            authError.isOperational = true;
            throw authError;
        }
        if (error.message.includes('DUPLICATE_ENTRY')) {
             const conflictError = new Error('El nombre de usuario o email ya está en uso.');
             conflictError.statusCode = 409;
             conflictError.isOperational = true;
             throw conflictError;
        }
        throw error;
    }
});

module.exports = {
    getProfile,
    updateProfile
};
