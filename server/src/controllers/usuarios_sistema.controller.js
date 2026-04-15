/**
 * @module Controllers/UsuariosSistema
 * @description Controlador para la gestión de usuarios del sistema.
 * Implementa seguridad reforzada y manejo de errores centralizado.
 */
const UsuarioService = require('../services/usuarios.service');
const { createUsuarioSchema, updateUsuarioSchema } = require('../schemas/usuario.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene la lista de todos los usuarios del sistema.
 * @route GET /api/usuarios-sistema
 */
const getAllUsuariosSistema = asyncHandler(async (req, res) => {
    const usuarios = await UsuarioService.findAll();
    // Sanitizar respuesta: no enviar passwords ni hashes por defecto
    const sanitizedUsuarios = usuarios.map(u => {
        const { password_hash, ...userWithoutPass } = u;
        return userWithoutPass;
    });
    res.status(200).json(sanitizedUsuarios);
});

/**
 * Obtiene un usuario por ID.
 * @route GET /api/usuarios-sistema/:id
 */
const getUsuarioSistemaById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuario = await UsuarioService.findById(id);

    if (!usuario) {
        const error = new Error(`Usuario con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    // Sanitizar
    const { password_hash, ...userWithoutPass } = usuario;
    res.status(200).json(userWithoutPass);
});

/**
 * Crea un nuevo usuario de sistema.
 * @route POST /api/usuarios-sistema
 */
const createUsuarioSistema = asyncHandler(async (req, res) => {
    const validation = createUsuarioSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de usuario inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newUser = await UsuarioService.create(validation.data.body);
    
    logger.info(`Usuario creado: ${newUser.username} (ID: ${newUser.id})`);
    res.status(201).json({
        status: 'success',
        message: newUser.emailDelivered
            ? 'Usuario creado y credenciales enviadas por correo.'
            : 'Usuario creado. No se pudo enviar correo, usa la contraseña temporal mostrada en la respuesta.',
        data: { 
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            roleName: newUser.roles?.nombre_rol || null,
            emailDelivered: newUser.emailDelivered,
            tempPassword: newUser.tempPassword,
            warning: newUser.emailDelivered ? null : 'Entrega manual requerida: comparte la contraseña temporal por un canal seguro.',
            emailErrorMessage: newUser.emailErrorMessage || null,
            passwordWasGenerated: newUser.passwordWasGenerated
        }
    });
});

/**
 * Actualiza un usuario existente.
 * @route PUT /api/usuarios-sistema/:id
 */
const updateUsuarioSistema = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateUsuarioSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await UsuarioService.update(id, validation.data.body);
    
    if (!updated) {
        const error = new Error(`Usuario con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Usuario ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Usuario actualizado exitosamente' 
    });
});

/**
 * Elimina (borrado lógico) un usuario.
 * @route DELETE /api/usuarios-sistema/:id
 */
const deleteUsuarioSistema = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await UsuarioService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Usuario con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Usuario ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Usuario eliminado exitosamente' 
    });
});

module.exports = {
    getAllUsuariosSistema,
    getUsuarioSistemaById,
    createUsuarioSistema,
    updateUsuarioSistema,
    deleteUsuarioSistema
};
