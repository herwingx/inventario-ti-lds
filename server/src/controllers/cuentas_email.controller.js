/**
 * @module Controllers/CuentasEmail
 * @description Controlador para la gestión de cuentas de correo corporativo.
 */
const EmailService = require('../services/emails.service');
const { emailSchema, updateEmailSchema } = require('../schemas/email.schema');

const getAllCuentasEmail = async (req, res) => {
  const emails = await EmailService.findAll();
  res.status(200).json(emails);
};

const getCuentaEmailById = async (req, res) => {
  const email = await EmailService.findById(req.params.id);
  if (!email) return res.status(404).json({ message: 'Cuenta de correo no encontrada' });
  res.status(200).json(email);
};

const createCuentaEmail = async (req, res) => {
  const validation = emailSchema.parse({ body: req.body });
  try {
    const newEmail = await EmailService.create(validation.body);
    res.status(201).json(newEmail);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const updateCuentaEmail = async (req, res) => {
  const validation = updateEmailSchema.parse({ params: req.params, body: req.body });
  try {
    const updated = await EmailService.update(validation.params.id, validation.body);
    if (!updated) return res.status(404).json({ message: 'Cuenta de correo no encontrada' });
    res.status(200).json({ message: 'Cuenta de correo actualizada exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const deleteCuentaEmail = async (req, res) => {
  const deleted = await EmailService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Cuenta de correo no encontrada' });
  res.status(200).json({ message: 'Cuenta de correo eliminada exitosamente' });
};

module.exports = {
  getAllCuentasEmail,
  getCuentaEmailById,
  createCuentaEmail,
  updateCuentaEmail,
  deleteCuentaEmail
};