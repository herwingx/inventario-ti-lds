/**
 * @module Middleware/Auth
 * @description Middleware para proteger rutas mediante verificación de tokens JWT.
 * Incluye control de acceso granular por roles (Fase 2).
 */
// src/middleware/auth.middleware.js
// * Este middleware se encarga de proteger las rutas verificando el token JWT.

const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// =============================================
// CONSTANTES DE ROLES
// =============================================
/**
 * IDs de roles del sistema (deben coincidir con tabla `roles`).
 * ! Verificar estos IDs con: SELECT * FROM roles;
 * @type {Object<string, number>}
 */
const ROLES = {
    ADMIN: 1,
    VIEWER: 2,
    SUPERVISOR: 3,
    // SOPORTE: Si existe en tu BD, agregar el ID correcto aquí
};

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
                roleId: decoded.roleId,
                sucursalId: decoded.sucursalId || null  // Para filtrado SUPERVISOR
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
 * Middleware que verifica si el usuario es Admin o Supervisor.
 * Asume que req.user ya fue llenado por protect.
 */
const isSupportOrAdmin = (req, res, next) => {
    if (!req.user || !req.user.roleId) {
        return res.status(401).json({ message: 'No autorizado, rol no identificado.' });
    }

    // Roles con permisos de escritura: ADMIN (1) y SUPERVISOR (3)
    if (req.user.roleId === ROLES.ADMIN || req.user.roleId === ROLES.SUPERVISOR) {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere nivel de supervisor o admin.' });
    }
};

// =============================================
// FASE 2: MIDDLEWARES GRANULARES
// =============================================

/**
 * Middleware que verifica si el usuario es Administrador.
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol Administrador.' });
    }
    next();
};

/**
 * Middleware que verifica si el usuario es Supervisor.
 */
const isSupervisor = (req, res, next) => {
    if (!req.user || req.user.roleId !== ROLES.SUPERVISOR) {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol Supervisor.' });
    }
    next();
};

/**
 * Middleware que verifica si el usuario tiene alguno de los roles especificados.
 * @param {number[]} allowedRoles - Array de IDs de roles permitidos
 * @returns {Function} Middleware
 * @example
 * router.get('/ruta', protect, hasRole([ROLES.ADMIN, ROLES.SUPERVISOR]), controller);
 */
const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roleId) {
            return res.status(401).json({ message: 'No autorizado, rol no identificado.' });
        }

        if (allowedRoles.includes(req.user.roleId)) {
            next();
        } else {
            return res.status(403).json({
                message: 'Acceso denegado. No tienes permisos para esta acción.'
            });
        }
    };
};

/**
 * Middleware para filtrar datos por sucursal (SUPERVISOR scope).
 * Inyecta `req.scopeFilter` con la condición SQL para filtrar por sucursal.
 * Solo aplica si el usuario es SUPERVISOR, otros roles ven todo.
 * 
 * @param {string} tableName - Nombre de la tabla/alias para el filtro
 * @returns {Function} Middleware
 * @example
 * router.get('/equipos', protect, scopeBySucursal('e'), controller);
 * // Luego en el controller: WHERE ${req.scopeFilter}
 */
const scopeBySucursal = (tableName = '') => {
    return async (req, res, next) => {
        // Si no hay usuario o no es SUPERVISOR, no filtrar
        if (!req.user || req.user.roleId !== ROLES.SUPERVISOR) {
            req.scopeFilter = '1=1';  // Sin filtro, ve todo
            req.scopeParams = [];
            return next();
        }

        // Si es SUPERVISOR pero no tiene sucursal asignada, no ve nada
        if (!req.user.sucursalId) {
            req.scopeFilter = '1=0';  // No ve nada
            req.scopeParams = [];
            console.warn(`[SCOPE] SUPERVISOR ${req.user.userId} sin sucursal asignada.`);
            return next();
        }

        // Construir filtro por sucursal
        const prefix = tableName ? `${tableName}.` : '';
        req.scopeFilter = `${prefix}id_sucursal = ?`;
        req.scopeParams = [req.user.sucursalId];

        console.log(`[SCOPE] Aplicando filtro de sucursal ${req.user.sucursalId} para SUPERVISOR ${req.user.userId}`);
        next();
    };
};

/**
 * Helper para obtener información extendida del usuario (incluye sucursal).
 * Útil para cuando el token no contiene toda la info necesaria.
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object|null>} Datos del usuario o null
 */
const getUserWithSucursal = async (userId) => {
    try {
        const [user] = await query(`
            SELECT u.id, u.username, u.id_rol, u.id_sucursal,
                   r.nombre_rol, s.nombre_sucursal
            FROM usuarios_sistema u
            LEFT JOIN roles r ON u.id_rol = r.id
            LEFT JOIN sucursales s ON u.id_sucursal = s.id
            WHERE u.id = ?
        `, [userId]);
        return user || null;
    } catch (error) {
        console.error('[AUTH] Error al obtener usuario:', error.message);
        return null;
    }
};

module.exports = {
    protect,
    isSupportOrAdmin,
    isAdmin,
    isSupervisor,
    hasRole,
    scopeBySucursal,
    getUserWithSucursal,
    ROLES
}; 