/**
 * @module Middleware/Auth
 * @description Middleware para proteger rutas mediante verificación de tokens JWT.
 */
// src/middleware/auth.middleware.js
// * Este middleware se encarga de proteger las rutas verificando el token JWT.

const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica la presencia y validez de un token JWT en el encabezado Authorization.
 * Si es válido, inyecta la información del usuario en `req.user`.
 * Si no, devuelve un error 401.
 *
 * @param {import('express').Request} req - Solicitud Express.
 * @param {import('express').Response} res - Respuesta Express.
 * @param {import('express').NextFunction} next - Función next.
 * @returns {void}
 */
const protect = (req, res, next) => {
    let token;
    // * Busco el token en el encabezado 'Authorization'.
    // * El formato esperado es 'Bearer <token>'.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // * Extraigo el token (quito 'Bearer ').
            token = req.headers.authorization.split(' ')[1];

            // * Verifico el token usando mi clave secreta.
            // * Si el token es inválido o ha expirado, jwt.verify lanzará un error.
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // * Si el token es válido, el payload decodificado se añade al objeto `req`.
            // * Ahora, todas las rutas posteriores protegidas tendrán acceso a `req.user`.
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                roleId: decoded.roleId
            };

            console.log(`Middleware: Token válido para usuario ID ${req.user.userId}. Petición autorizada.`);
            next(); // * Permito que la petición continúe a la ruta solicitada.

        } catch (error) {
            console.error('Middleware: Token inválido o expirado.', error.message);
            // Si hay un error en la verificación, el usuario no está autorizado.
            return res.status(401).json({ message: 'No autorizado, token falló.' });
        }
    }

    if (!token) {
        console.warn('Middleware: Petición sin token.');
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

/**
 * Middleware que verifica si el usuario es Admin (1) o Soporte (2).
 * Asume que req.user ya fue llenado por protect.
 */
const isSupportOrAdmin = (req, res, next) => {
    if (!req.user || !req.user.roleId) {
        return res.status(401).json({ message: 'No autorizado, rol no identificado.' });
    }

    // IDs de rol: 1=Admin, 2=Soporte (según convención de semillas)
    if (req.user.roleId === 1 || req.user.roleId === 2) {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere nivel de soporte o admin.' });
    }
};

module.exports = {
    protect,
    isSupportOrAdmin
}; 