/**
 * @module Routes/DireccionesIP
 * @description Define las rutas para la gestión del inventario de direcciones IP.
 */
// src/routes/direccionesIp.routes.js
// Define las rutas HTTP para la entidad 'direcciones_ip'.

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo las funciones controladoras de direcciones IP
const direccionesIpController = require('../controllers/direcciones_ip.controller');

// ===============================================================
// DEFINICIÓN DE RUTAS
// Montadas bajo /api/direcciones-ip en server.js.
// ===============================================================

// * [GET] /api/direcciones-ip - Trae todas las direcciones IP (con filtros opcionales)
// * Query params: segmento (0-15), status (ID), disponibles (true/false)
router.get('/', direccionesIpController.getAllDireccionesIp);

// * [GET] /api/direcciones-ip/segmentos - Obtiene resumen de IPs por segmento para dashboard
router.get('/segmentos', direccionesIpController.getSegmentosResumen);

// * [GET] /api/direcciones-ip/:id - Trae una dirección IP específica por su ID
router.get('/:id', direccionesIpController.getDireccionIpById);

// * [POST] /api/direcciones-ip - Crea una nueva dirección IP
router.post('/', direccionesIpController.createDireccionIp);

// * [PUT] /api/direcciones-ip/:id - Actualiza una dirección IP por su ID
router.put('/:id', direccionesIpController.updateDireccionIp);

// * [DELETE] /api/direcciones-ip/:id - Elimina una dirección IP por su ID
router.delete('/:id', direccionesIpController.deleteDireccionIp);

// * Exporto el enrutador para usarlo en server.js
module.exports = router;