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

// ===============================================================
// DEFINICIÓN DE RUTAS
// Estas rutas se montarán bajo el prefijo /api/tipos-sucursal en server.js.
// ===============================================================

// * [GET] /api/tipos-sucursal - Trae todos los tipos de sucursal
router.get('/', tiposSucursalController.getAllTiposSucursal);

// * [GET] /api/tipos-sucursal/:id - Trae un tipo de sucursal específico por su ID
router.get('/:id', tiposSucursalController.getTipoSucursalById);

// * [POST] /api/tipos-sucursal - Crea un nuevo tipo de sucursal
router.post('/', tiposSucursalController.createTipoSucursal);

// * [PUT] /api/tipos-sucursal/:id - Actualiza un tipo de sucursal por su ID
router.put('/:id', tiposSucursalController.updateTipoSucursal);

// * [DELETE] /api/tipos-sucursal/:id - Elimina un tipo de sucursal por su ID
router.delete('/:id', tiposSucursalController.deleteTipoSucursal);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;