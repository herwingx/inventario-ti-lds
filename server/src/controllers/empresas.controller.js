/**
 * @module Controllers/Empresas
 * @description Controlador para la gestión de empresas.
 */
const EmpresaService = require('../services/empresas.service');
const { createEmpresaSchema, updateEmpresaSchema } = require('../schemas/empresa.schema');
const logger = require('../utils/logger');

const getAllEmpresas = async (req, res) => {
  const empresas = await EmpresaService.findAll();
  res.status(200).json(empresas);
};

const getEmpresaById = async (req, res) => {
  const { id } = req.params;
  const empresa = await EmpresaService.findById(id);

  if (!empresa) {
    return res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
  }

  res.status(200).json(empresa);
};

const createEmpresa = async (req, res) => {
  const validation = createEmpresaSchema.parse({ body: req.body });

  try {
    const newEmpresa = await EmpresaService.create(validation.body);
    logger.info(`Empresa creada: ${newEmpresa.nombre} (ID: ${newEmpresa.id})`);
    res.status(201).json(newEmpresa);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const updateEmpresa = async (req, res) => {
  const validation = updateEmpresaSchema.parse({ params: req.params, body: req.body });

  try {
    const updated = await EmpresaService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: `Empresa con ID ${validation.params.id} no encontrada.` });
    }
    logger.info(`Empresa ID ${validation.params.id} actualizada.`);
    res.status(200).json({ message: 'Empresa actualizada exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

const deleteEmpresa = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await EmpresaService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: `Empresa con ID ${id} no encontrada.` });
    }
    logger.info(`Empresa ID ${id} eliminada.`);
    res.status(200).json({ message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    if (error.message.includes('REFERENTIAL_INTEGRITY')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  getAllEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa
};