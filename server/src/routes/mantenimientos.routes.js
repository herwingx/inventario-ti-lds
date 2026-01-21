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

// Proteger todas las rutas
router.use(protect);
// router.use(isSupportOrAdmin); // Deshabilitado temporalmente para pruebas

// CRUD Mantenimientos
router.get('/', mantenimientosController.getAllMantenimientos);
router.get('/:id', mantenimientosController.getMantenimientoById);
router.post('/', mantenimientosController.createMantenimiento);
router.put('/:id', mantenimientosController.updateMantenimiento);
router.delete('/:id', mantenimientosController.deleteMantenimiento);

// =============================================
// EVIDENCIAS DE MANTENIMIENTO (Fase 2B)
// =============================================
// GET    /api/mantenimientos/:id/evidencias        - Listar evidencias
// POST   /api/mantenimientos/:id/evidencias        - Subir evidencia (con archivo)
// DELETE /api/mantenimientos/:id/evidencias/:evidenciaId - Eliminar evidencia

router.get('/:id/evidencias', mantenimientosController.getEvidencias);

router.post(
  '/:id/evidencias',
  uploadEvidencias.single('archivo'),
  handleMulterError,
  mantenimientosController.addEvidencia
);

router.delete('/:id/evidencias/:evidenciaId', mantenimientosController.deleteEvidencia);

module.exports = router;