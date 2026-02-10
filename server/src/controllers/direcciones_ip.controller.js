/**
 * @module Controllers/DireccionesIp
 * @description Controlador para la gestión de direcciones IP.
 */
const IpService = require('../services/ips.service');
const { ipSchema, updateIpSchema } = require('../schemas/ip.schema');

const getAllDireccionesIp = async (req, res) => {
  const ips = await IpService.findAll(req.query);
  res.status(200).json(ips);
};

const getSegmentosResumen = async (req, res) => {
  const resumen = await IpService.getResumenBySegmento();
  res.status(200).json(resumen);
};

const getDireccionIpById = async (req, res) => {
  const { id } = req.params;
  const ip = await IpService.findById(id);
  if (!ip) return res.status(404).json({ message: 'IP no encontrada' });
  res.status(200).json(ip);
};

const createDireccionIp = async (req, res) => {
  const validation = ipSchema.parse({ body: req.body });
  try {
    const newIp = await IpService.create(validation.body);
    res.status(201).json(newIp);
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const updateDireccionIp = async (req, res) => {
  const validation = updateIpSchema.parse({ params: req.params, body: req.body });
  try {
    const updated = await IpService.update(validation.params.id, validation.body);
    if (!updated) return res.status(404).json({ message: 'IP no encontrada' });
    res.status(200).json({ message: 'IP actualizada exitosamente' });
  } catch (error) {
    if (error.message.includes('DUPLICATE_ENTRY')) return res.status(409).json({ message: error.message });
    throw error;
  }
};

const deleteDireccionIp = async (req, res) => {
  const deleted = await IpService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'IP no encontrada' });
  res.status(200).json({ message: 'IP eliminada exitosamente' });
};

module.exports = {
  getAllDireccionesIp,
  getSegmentosResumen,
  getDireccionIpById,
  createDireccionIp,
  updateDireccionIp,
  deleteDireccionIp
};
