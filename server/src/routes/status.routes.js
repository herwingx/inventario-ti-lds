/**
 * @module Routes/Status
 * @description Rutas para gestión de estados del sistema.
 */
const express = require('express');
const router = express.Router();
const statusController = require('../controllers/status.controller');

/**
 * @openapi
 * tags:
 *   name: Catalogos
 *   description: Catálogos del sistema (Tipos, Roles, Status)
 */

/**
 * @openapi
 * /api/status:
 *   get:
 *     summary: Listar estados disponibles
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados (Activo, Baja, En Reparación).
 */
router.get('/', statusController.getAllStatus);

/**
 * @openapi
 * /api/status/{id}:
 *   get:
 *     summary: Obtener estado por ID
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle del estado.
 */
router.get('/:id', statusController.getStatusById);

/**
 * @openapi
 * /api/status:
 *   post:
 *     summary: Crear nuevo estado
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_status]
 *             properties:
 *               nombre_status: { type: string }
 *     responses:
 *       201:
 *         description: Estado creado.
 */
router.post('/', statusController.createStatus);

/**
 * @openapi
 * /api/status/{id}:
 *   put:
 *     summary: Actualizar estado
 *     tags: [Catalogos]
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
 *               nombre_status: { type: string }
 *     responses:
 *       200:
 *         description: Estado actualizado.
 */
router.put('/:id', statusController.updateStatus);

/**
 * @openapi
 * /api/status/{id}:
 *   delete:
 *     summary: Eliminar estado
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estado eliminado.
 */
router.delete('/:id', statusController.deleteStatus);

module.exports = router;
