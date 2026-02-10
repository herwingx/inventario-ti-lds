/**
 * @module Routes/TiposEquipo
 * @description Define las rutas para la gestión de tipos de hardware.
 */
// src/routes/tiposEquipo.routes.js
// Define las rutas HTTP para la entidad 'tipos_equipo'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de tipos de equipo
const tiposEquipoController = require('../controllers/tipos_equipo.controller');

/**
 * @openapi
 * /api/tipos-equipo:
 *   get:
 *     summary: Listar categorías de hardware
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de equipo.
 */
router.get('/', tiposEquipoController.getAllTiposEquipo);

/**
 * @openapi
 * /api/tipos-equipo/{id}:
 *   get:
 *     summary: Obtener tipo de equipo por ID
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de la categoría.
 */
router.get('/:id', tiposEquipoController.getTipoEquipoById);

module.exports = router;