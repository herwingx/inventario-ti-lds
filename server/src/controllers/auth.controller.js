/**
 * @module Controllers/Auth
 * @description Controlador de autenticación.
 */
const AuthService = require('../services/auth.service');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas/auth.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @function login
 * @description Inicia sesión y genera un token JWT.
 */
const login = asyncHandler(async (req, res) => {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        const error = new Error('Datos de entrada inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const { username, password } = validation.data;
    const result = await AuthService.login(username, password);

    if (!result) {
        logger.warn(`Intento de login fallido: "${username}"`);
        const error = new Error('Credenciales inválidas o cuenta inactiva');
        error.statusCode = 401;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Login exitoso: "${username}"`);
    res.status(200).json({
        status: 'success',
        message: 'Inicio de sesión exitoso.',
        data: result
    });
});

/**
 * @function forgotPassword
 * @description Inicia el proceso de recuperación de contraseña.
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        const error = new Error('Correo electrónico inválido');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
    }

    await AuthService.forgotPassword(validation.data.email);

    // Siempre respondemos positivo por seguridad (evitar enumeración de usuarios)
    res.status(200).json({ 
        status: 'success',
        message: 'Si el correo existe, se enviarán las instrucciones.' 
    });
});

/**
 * @function resetPassword
 * @description Restablece la contraseña usando un token.
 */
const resetPassword = asyncHandler(async (req, res) => {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        const error = new Error('Datos de restablecimiento inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = validation.error.errors.map(e => e.message);
        throw error;
    }

    const { token, newPassword } = validation.data;
    const success = await AuthService.resetPassword(token, newPassword);

    if (!success) {
        const error = new Error('Token inválido o expirado.');
        error.statusCode = 400;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json({ 
        status: 'success',
        message: 'Contraseña actualizada correctamente.' 
    });
});

module.exports = {
    login,
    forgotPassword,
    resetPassword
};
