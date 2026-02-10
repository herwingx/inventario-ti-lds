/**
 * @module Controllers/UsuariosSistema
 * @description Controlador para la gestión de usuarios del sistema.
 */
const UsuarioService = require('../services/usuarios.service');
const { createUsuarioSchema, updateUsuarioSchema } = require('../schemas/usuario.schema');
const logger = require('../utils/logger');

const getAllUsuariosSistema = async (req, res) => {
  const usuarios = await UsuarioService.findAll();
  res.status(200).json(usuarios);
};

const getUsuarioSistemaById = async (req, res) => {
  const { id } = req.params;
  const usuario = await UsuarioService.findById(id);

  if (!usuario) {
    return res.status(404).json({ message: `Usuario con ID ${id} no encontrado.` });
  }

  res.status(200).json(usuario);
};

const createUsuarioSistema = async (req, res) => {
  const validation = createUsuarioSchema.parse({ body: req.body });

  try {
    const newUser = await UsuarioService.create(validation.body);
    logger.info(`Usuario creado: ${newUser.username} (ID: ${newUser.id})`);
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      id: newUser.id,
      username: newUser.username
    });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const updateUsuarioSistema = async (req, res) => {
  const validation = updateUsuarioSchema.parse({ params: req.params, body: req.body });

  try {
    const updated = await UsuarioService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: `Usuario con ID ${validation.params.id} no encontrado.` });
    }
    logger.info(`Usuario ID ${validation.params.id} actualizado.`);
    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const deleteUsuarioSistema = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await UsuarioService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: `Usuario con ID ${id} no encontrado.` });
    }
    logger.info(`Usuario ID ${id} eliminado.`);
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  getAllUsuariosSistema,
  getUsuarioSistemaById,
  createUsuarioSistema,
  updateUsuarioSistema,
  deleteUsuarioSistema
};