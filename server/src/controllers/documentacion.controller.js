/**
 * @module Controllers/Documentacion
 * @description Controlador para la gestión de documentación.
 */
const DocumentoService = require('../services/documentacion.service');
const { documentoSchema, updateDocumentoSchema } = require('../schemas/documentacion.schema');

const getAllDocumentos = async (req, res) => {
  const docs = await DocumentoService.findAll();
  res.status(200).json(docs);
};

const getDocumentoById = async (req, res) => {
  const doc = await DocumentoService.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });
  res.status(200).json(doc);
};

const createDocumento = async (req, res) => {
  const validation = documentoSchema.parse({ body: req.body });
  const newDoc = await DocumentoService.create(validation.body);
  res.status(201).json({
    message: 'Documento registrado correctamente',
    id: newDoc.id
  });
};

const updateDocumento = async (req, res) => {
  const validation = updateDocumentoSchema.parse({ params: req.params, body: req.body });
  const updated = await DocumentoService.update(validation.params.id, validation.body);
  if (!updated) return res.status(404).json({ message: 'Documento no encontrado' });
  res.status(200).json({ message: 'Documento actualizado correctamente' });
};

const deleteDocumento = async (req, res) => {
  const deleted = await DocumentoService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Documento no encontrado' });
  res.status(200).json({ message: 'Documento eliminado correctamente' });
};

module.exports = {
  getAllDocumentos,
  getDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento
};
