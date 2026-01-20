/**
 * @module Routes/Mantenimientos
 * @description Rutas para gestión de mantenimientos (Fase 2B).
 */
const express = require('express');
const router = express.Router();
const mantenimientosController = require('../controllers/mantenimientos.controller');
const { protect, isSupportOrAdmin } = require('../middleware/auth.middleware');

// Proteger todas las rutas
router.use(protect);
// router.use(isSupportOrAdmin); // Deshabilitado temporalmente para pruebas

// CRUD Mantenimientos
router.get('/', mantenimientosController.getAllMantenimientos);
router.get('/:id', mantenimientosController.getMantenimientoById);
router.post('/', mantenimientosController.createMantenimiento);
router.put('/:id', mantenimientosController.updateMantenimiento);
router.delete('/:id', mantenimientosController.deleteMantenimiento);

module.exports = router;