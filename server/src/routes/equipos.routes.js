// src/routes/equipos.routes.js
// Define las rutas HTTP para la entidad 'equipos'.

const express = require('express');

/**
 * @module routes/equipos
 * @description Rutas API para la gestión de equipos (Hardware).
 */
const router = express.Router();

// * Importo las funciones controladoras de equipos
const equiposController = require('../controllers/equipos.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Estas rutas se montarán bajo el prefijo /api/equipos en server.js.
// ===============================================================

// * [GET] /api/equipos - Trae todos los equipos
router.get('/', equiposController.getAllEquipos);

// * [GET] /api/equipos/disponibles-componentes - Trae equipos disponibles para ser componentes
router.get('/disponibles-componentes', equiposController.getEquiposDisponiblesParaComponentes);

// Las rutas de equipos ahora están limpias y delegadas al controlador.

// * [GET] /api/equipos/:id - Trae un equipo específico por su ID
router.get('/:id', equiposController.getEquipoById);

// * [POST] /api/equipos - Crea un nuevo equipo
router.post('/', equiposController.createEquipo);

// * [PUT] /api/equipos/:id - Actualiza un equipo por su ID
router.put('/:id', equiposController.updateEquipo);

// * [DELETE] /api/equipos/:id - Elimina un equipo por su ID
router.delete('/:id', equiposController.deleteEquipo);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;