/**
 * @module Routes/Mantenimientos
 * @description Rutas para gestión de mantenimientos (Fase 2B).
 * Incluye endpoints de evidencias con soporte para subida de archivos.
 */
const express = require('express');
const router = express.Router();
const mantenimientosController = require('../controllers/mantenimientos.controller');
const { protect } = require('../middleware/auth.middleware');
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
 *     parameters:
 *       - in: query
 *         name: id_equipo
 *         schema: { type: integer }
 *       - in: query
 *         name: estatus
 *         schema: { type: string, enum: [PENDIENTE, EN_PROGRESO, COMPLETADO, CANCELADO, VENCIDO] }
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
 *       404:
 *         description: Mantenimiento no encontrado.
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
 *             required: [id_equipo, titulo, fecha_programada]
 *             properties:
 *               id_equipo: { type: integer }
 *               tipo: { type: string, enum: [PREVENTIVO, CORRECTIVO, ACTUALIZACION], default: PREVENTIVO }
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               fecha_programada: { type: string, format: date }
 *               id_tecnico_asignado: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Mantenimiento registrado.
 *       400:
 *         description: Datos inválidos.
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estatus: { type: string, enum: [PENDIENTE, EN_PROGRESO, COMPLETADO, CANCELADO, VENCIDO] }
 *               notas_cierre: { type: string }
 *               costo: { type: number }
 *               fecha_realizada: { type: string, format: date }
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               fecha_programada: { type: string, format: date }
 *               id_tecnico_asignado: { type: integer }
 *     responses:
 *       200:
 *         description: Mantenimiento actualizado.
 *       404:
 *         description: Mantenimiento no encontrado.
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mantenimiento eliminado.
 *       409:
 *         description: No se puede eliminar por dependencias (evidencias).
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de evidencias (URLs).
 *       404:
 *         description: Mantenimiento no encontrado.
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
 *     consumes:
 *       - multipart/form-data
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
 *               tipo:
 *                 type: string
 *                 default: DIAGNOSTICO
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evidencia subida con éxito.
 *       400:
 *         description: Archivo no válido o mantenimiento no encontrado.
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: evidenciaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Evidencia eliminada.
 *       404:
 *         description: Evidencia no encontrada.
 */
router.delete('/:id/evidencias/:evidenciaId', mantenimientosController.deleteEvidencia);

module.exports = router;
