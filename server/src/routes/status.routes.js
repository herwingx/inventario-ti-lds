/**
 * @module Routes/Status
 * @description Define las rutas para la gestión de estados de entidades.
 */
// ! Rutas para la entidad Status (estados del sistema)

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express para definir rutas específicas

// * Importo las funciones del controlador de status
const statusController = require('../controllers/status.controller');

/**
 * @openapi
 * /api/status:
 *   get:
 *     summary: Listar todos los estados del sistema
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados.
 */
router.get('/', statusController.getAllStatus);

/**
 * @openapi
 * /api/status/{id}:
 *   get:
 *     summary: Obtener estado por ID
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del estado.
 */
router.get('/:id', statusController.getStatusById);

module.exports = router;