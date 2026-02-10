/**
 * @module Routes/Mantenimientos
 * @description Rutas para gestión de mantenimientos (Fase 2B).
 * Incluye endpoints de evidencias con soporte para subida de archivos.
 */
const express = require('express');
const router = express.Router();
const mantenimientosController = require('../controllers/mantenimientos.controller');
const { protect, isSupportOrAdmin } = require('../middleware/auth.middleware');
const { uploadEvidencias, handleMulterError } = require('../config/upload.config');

/**
 * @openapi
 * tags:
 *   name: Mantenimientos
 *   description: Registro de servicios técnicos y evidencias fotográficas
 */

// Proteger todas las rutas
router.use(protect);

/**
 * @openapi
 * /api/mantenimientos:
 *   get:
 *     summary: Listar todos los mantenimientos
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mantenimientos.
 */
router.get('/', mantenimientosController.getAllMantenimientos);

/**
 * @openapi
 * /api/mantenimientos/{id}:
 *   get:
 *     summary: Obtener detalles de un mantenimiento
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del mantenimiento.
 */
router.get('/:id', mantenimientosController.getMantenimientoById);

/**
 * @openapi
 * /api/mantenimientos:
 *   post:
 *     summary: Registrar un nuevo mantenimiento
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_equipo, fecha_inicio, titulo]
 *             properties:
 *               id_equipo: { type: integer }
 *               titulo: { type: string }
 *               diagnostico: { type: string }
 *     responses:
 *       201:
 *         description: Mantenimiento registrado.
 */
router.post('/', mantenimientosController.createMantenimiento);

/**
 * @openapi
 * /api/mantenimientos/{id}:
 *   put:
 *     summary: Actualizar datos de un mantenimiento
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mantenimiento actualizado.
 */
router.put('/:id', mantenimientosController.updateMantenimiento);

/**
 * @openapi
 * /api/mantenimientos/{id}:
 *   delete:
 *     summary: Eliminar un registro de mantenimiento
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mantenimiento eliminado.
 */
router.delete('/:id', mantenimientosController.deleteMantenimiento);

/**
 * @openapi
 * /api/mantenimientos/{id}/evidencias:
 *   get:
 *     summary: Listar fotos de evidencia de un mantenimiento
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de evidencias (URLs).
 */
router.get('/:id/evidencias', mantenimientosController.getEvidencias);

/**
 * @openapi
 * /api/mantenimientos/{id}/evidencias:
 *   post:
 *     summary: Subir una foto de evidencia
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Evidencia subida con éxito.
 */
router.post(
  '/:id/evidencias',
  uploadEvidencias.single('archivo'),
  handleMulterError,
  mantenimientosController.addEvidencia
);

/**
 * @openapi
 * /api/mantenimientos/{id}/evidencias/{evidenciaId}:
 *   delete:
 *     summary: Eliminar una evidencia específica
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Evidencia eliminada.
 */
router.delete('/:id/evidencias/:evidenciaId', mantenimientosController.deleteEvidencia);

module.exports = router;