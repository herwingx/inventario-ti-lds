/**
 * @module Routes/TiposSucursal
 * @description Define las rutas para la gestión de categorías de sucursales.
 */
// src/routes/tiposSucursal.routes.js
// Define las rutas HTTP para la entidad 'tipos_sucursal'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de tipos de sucursal
const tiposSucursalController = require('../controllers/tipos_sucursal.controller');

/**
 * @openapi
 * /api/tipos-sucursal:
 *   get:
 *     summary: Listar categorías de sucursales
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de sucursal.
 */
router.get('/', tiposSucursalController.getAllTiposSucursal);

/**
 * @openapi
 * /api/tipos-sucursal/{id}:
 *   get:
 *     summary: Obtener tipo de sucursal por ID
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de la categoría.
 */
router.get('/:id', tiposSucursalController.getTipoSucursalById);

module.exports = router;