/**
 * @module Controllers/Roles
 * @description Controlador para la gestión de roles de usuario.
 * Refactorizado con asyncHandler y validación Zod.
 */
const RolService = require('../services/roles.service');
const { rolesSchema, updateRolesSchema } = require('../schemas/rol.schema');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene todos los roles.
 * @route GET /api/roles
 */
const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await RolService.findAll();
    res.status(200).json(roles);
});

/**
 * Obtiene un rol por ID.
 * @route GET /api/roles/:id
 */
const getRoleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rol = await RolService.findById(id);

    if (!rol) {
        const error = new Error(`Rol con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    res.status(200).json(rol);
});

/**
 * Crea un nuevo rol.
 * @route POST /api/roles
 */
const createRole = asyncHandler(async (req, res) => {
    const validation = rolesSchema.safeParse({ body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de rol inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const newRol = await RolService.create(validation.data.body);
    logger.info(`Rol creado: ${newRol.nombre_rol} (ID: ${newRol.id})`);
    
    res.status(201).json({
        status: 'success',
        message: 'Rol creado exitosamente',
        data: newRol
    });
});

/**
 * Actualiza un rol existente.
 * @route PUT /api/roles/:id
 */
const updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validation = updateRolesSchema.safeParse({ params: { id }, body: req.body });

    if (!validation.success) {
        const error = new Error('Datos de actualización inválidos');
        error.statusCode = 400;
        error.isOperational = true;
        error.details = (validation.error.issues || validation.error.errors || []).map(e => e.message);
        throw error;
    }

    const updated = await RolService.update(id, validation.data.body);

    if (!updated) {
        const error = new Error(`Rol con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Rol ID ${id} actualizado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Rol actualizado exitosamente' 
    });
});

/**
 * Elimina un rol.
 * @route DELETE /api/roles/:id
 */
const deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await RolService.delete(id);
    
    if (!deleted) {
        const error = new Error(`Rol con ID ${id} no encontrado.`);
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
    }

    logger.info(`Rol ID ${id} eliminado.`);
    res.status(200).json({ 
        status: 'success',
        message: 'Rol eliminado exitosamente' 
    });
});

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
};
