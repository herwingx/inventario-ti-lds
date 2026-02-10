/**
 * @module Controllers/Mantenimientos
 * @description Controlador para la gestión de mantenimientos.
 */
const MantenimientoService = require('../services/mantenimientos.service');
const { createMantenimientoSchema, updateMantenimientoSchema } = require('../schemas/mantenimiento.schema');
const logger = require('../utils/logger');

const getAllMantenimientos = async (req, res, next) => {
  try {
    const mantenimientos = await MantenimientoService.findAll(req.query);
    res.status(200).json(mantenimientos);
  } catch (error) {
    next(error);
  }
};

const getMantenimientoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mantenimiento = await MantenimientoService.findById(id);

    if (!mantenimiento) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    res.status(200).json(mantenimiento);
  } catch (error) {
    next(error);
  }
};

const createMantenimiento = async (req, res, next) => {
  try {
    const validation = createMantenimientoSchema.parse({ body: req.body });
    const userId = req.user ? req.user.userId : null;

    const newManto = await MantenimientoService.create(validation.body, userId);

    logger.info(`Mantenimiento programado: ${newManto.titulo} (ID: ${newManto.id})`);

    res.status(201).json({
      id: newManto.id,
      message: 'Mantenimiento programado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

const updateMantenimiento = async (req, res, next) => {
  try {
    const validation = updateMantenimientoSchema.parse({ params: req.params, body: req.body });

    const updated = await MantenimientoService.update(validation.params.id, validation.body);
    if (!updated) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    logger.info(`Mantenimiento ID ${validation.params.id} actualizado.`);
    res.status(200).json({ message: 'Mantenimiento actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const deleteMantenimiento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await MantenimientoService.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    logger.info(`Mantenimiento ID ${id} eliminado.`);
    res.status(200).json({ message: 'Mantenimiento eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({ message: 'No se puede eliminar el mantenimiento porque tiene registros vinculados (auditorías, archivos, etc.)' });
    }
    next(error);
  }
};

// =============================================
// FASE 2B: GESTIÓN DE EVIDENCIAS
// =============================================

/**
 * Obtiene todas las evidencias de un mantenimiento.
 * @route GET /api/mantenimientos/:id/evidencias
 */
const getEvidencias = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el mantenimiento existe
    const [maintenance] = await query('SELECT id FROM mantenimientos WHERE id = ?', [id]);
    if (!maintenance) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    const evidencias = await query(`
      SELECT id, tipo, url_archivo, descripcion, nombre_original, mime_type, tamano_bytes, fecha_subida
      FROM mantenimiento_evidencias
      WHERE id_mantenimiento = ?
      ORDER BY fecha_subida DESC
    `, [id]);

    res.json(evidencias);
  } catch (error) {
    next(error);
  }
};

/**
 * Agrega una evidencia a un mantenimiento.
 * Requiere multer middleware para procesar el archivo.
 * @route POST /api/mantenimientos/:id/evidencias
 */
const addEvidencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo, descripcion } = req.body;

    // Verificar que el mantenimiento existe
    const [maintenance] = await query('SELECT id, estatus FROM mantenimientos WHERE id = ?', [id]);
    if (!maintenance) {
      return res.status(404).json({ message: 'Mantenimiento no encontrado' });
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Construir URL relativa del archivo
    const urlArchivo = `/uploads/evidencias/${req.file.filename}`;

    const sql = `
      INSERT INTO mantenimiento_evidencias 
      (id_mantenimiento, url_archivo, tipo, descripcion, nombre_original, mime_type, tamano_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      id,
      urlArchivo,
      tipo || 'DIAGNOSTICO',
      descripcion || null,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    ]);

    res.status(201).json({
      id: result.insertId,
      url_archivo: urlArchivo,
      tipo: tipo || 'DIAGNOSTICO',
      message: 'Evidencia subida exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una evidencia específica.
 * También elimina el archivo físico del servidor.
 * @route DELETE /api/mantenimientos/:id/evidencias/:evidenciaId
 */
const deleteEvidencia = async (req, res, next) => {
  try {
    const { id, evidenciaId } = req.params;
    const path = require('path');
    const fs = require('fs').promises;

    // Obtener la evidencia para conocer la ruta del archivo
    const [evidencia] = await query(`
      SELECT id, url_archivo 
      FROM mantenimiento_evidencias 
      WHERE id = ? AND id_mantenimiento = ?
    `, [evidenciaId, id]);

    if (!evidencia) {
      return res.status(404).json({ message: 'Evidencia no encontrada' });
    }

    // Eliminar archivo físico
    try {
      const filePath = path.join(__dirname, '../..', evidencia.url_archivo);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn('[EVIDENCIAS] No se pudo eliminar archivo físico:', fileError.message);
      // Continuar aunque falle la eliminación del archivo
    }

    // Eliminar registro de BD
    await query('DELETE FROM mantenimiento_evidencias WHERE id = ?', [evidenciaId]);

    res.json({ message: 'Evidencia eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMantenimientos,
  getMantenimientoById,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
  // Evidencias
  getEvidencias,
  addEvidencia,
  deleteEvidencia
};