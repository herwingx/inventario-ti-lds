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

// ===============================================================
// DEFINICIÓN DE RUTAS
// Estas rutas se montarán bajo el prefijo /api/tipos-equipo en server.js.
// ===============================================================

// * [GET] /api/tipos-equipo - Trae todos los tipos de equipo
router.get('/', tiposEquipoController.getAllTiposEquipo);

// * [GET] /api/tipos-equipo/:id - Trae un tipo de equipo específico por su ID
router.get('/:id', tiposEquipoController.getTipoEquipoById);

// * [POST] /api/tipos-equipo - Crea un nuevo tipo de equipo
router.post('/', tiposEquipoController.createTipoEquipo);

// * [PUT] /api/tipos-equipo/:id - Actualiza un tipo de equipo por su ID
router.put('/:id', tiposEquipoController.updateTipoEquipo);

// * [DELETE] /api/tipos-equipo/:id - Elimina un tipo de equipo por su ID
router.delete('/:id', tiposEquipoController.deleteTipoEquipo);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;