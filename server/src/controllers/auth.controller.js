/**
 * @module Controllers/Auth
 * @description Controlador de autenticación.
 */
const AuthService = require('../services/auth.service');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas/auth.schema');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
    try {
        const validation = loginSchema.safeParse({ body: req.body });

        if (!validation.success) {
            return res.status(400).json({ message: 'Datos inválidos', errors: validation.error.errors.map(e => e.message) });
        }

        const { username, password } = validation.data.body;
        const result = await AuthService.login(username, password);

        if (!result) {
            logger.warn(`Login fallido para: "${username}"`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        logger.info(`Login exitoso: "${username}"`);
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            ...result
        });

    } catch (error) {
        logger.error(`Error en login: ${error.message}`);
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const validation = forgotPasswordSchema.safeParse({ body: req.body });
        if (!validation.success) {
            return res.status(400).json({ message: 'Correo inválido' });
        }

        await AuthService.forgotPassword(validation.data.body.email);

        // Siempre respondemos positivo por seguridad
        res.status(200).json({ message: 'Si el correo existe, se enviarán las instrucciones.' });
    } catch (error) {
        logger.error(`Error en forgotPassword: ${error.message}`);
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const validation = resetPasswordSchema.safeParse({ body: req.body });
        if (!validation.success) {
            return res.status(400).json({ message: 'Datos inválidos', errors: validation.error.errors.map(e => e.message) });
        }

        const { token, newPassword } = validation.data.body;
        const success = await AuthService.resetPassword(token, newPassword);

        if (!success) {
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }

        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        logger.error(`Error en resetPassword: ${error.message}`);
        next(error);
    }
};

module.exports = {
    login,
    forgotPassword,
    resetPassword
};