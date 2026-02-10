/**
 * @module Controllers/Profile
 * @description Controlador para el perfil del usuario autenticado.
 */
const ProfileService = require('../services/profile.service');

const getProfile = async (req, res) => {
  const user = await ProfileService.getProfile(req.user.userId);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.status(200).json(user);
};

const updateProfile = async (req, res) => {
  try {
    await ProfileService.updateProfile(req.user.userId, req.body);
    res.status(200).json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    if (error.message.includes('INVALID_PASSWORD')) return res.status(401).json({ message: error.message });
    if (error.message.includes('MISSING_PASSWORD')) return res.status(400).json({ message: error.message });
    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile
};
