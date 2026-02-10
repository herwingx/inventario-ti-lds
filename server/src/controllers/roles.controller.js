/**
 * @module Controllers/Roles
 * @description Controlador para la gestión de roles de usuario.
 */
const RolService = require('../services/roles.service');
const { rolesSchema, updateRolesSchema } = require('../schemas/rol.schema');

const getAllRoles = async (req, res) => {
  const roles = await RolService.findAll();
  res.status(200).json(roles);
};

const getRoleById = async (req, res) => {
  const { id } = req.params;
  const rol = await RolService.findById(id);
  if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });
  res.status(200).json(rol);
};

const createRole = async (req, res) => {
  const validation = rolesSchema.parse({ body: req.body });
  try {
    const newRol = await RolService.create(validation.body);
    res.status(201).json(newRol);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const updateRole = async (req, res) => {
  const validation = updateRolesSchema.parse({ params: req.params, body: req.body });
  try {
    const updated = await RolService.update(validation.params.id, validation.body);
    if (!updated) return res.status(404).json({ message: 'Rol no encontrado' });
    res.status(200).json({ message: 'Rol actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const deleteRole = async (req, res) => {
  try {
    const deleted = await RolService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Rol no encontrado' });
    res.status(200).json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};