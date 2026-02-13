/**
 * @module Routes/Areas
 * @description Define las rutas para la gestión de áreas de la empresa.
 */
const express = require('express');
const router = express.Router();
const areasController = require('../controllers/areas.controller');

/**
 * @openapi
 * tags:
 *   name: Areas
 *   description: Gestión de departamentos y zonas operativas
 */

/**
 * @openapi
 * /api/areas:
 *   get:
 *     summary: Listar todas las áreas
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_sucursal
 *         schema: { type: integer }
 *         description: Filtrar por ID de sucursal
 *     responses:
 *       200:
 *         description: Lista de áreas.
 */
router.get('/', areasController.getAllAreas);

/**
 * @openapi
 * /api/areas/{id}:
 *   get:
 *     summary: Obtener área por ID
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del área.
 *       404:
 *         description: Área no encontrada.
 */
router.get('/:id', areasController.getAreaById);

/**
 * @openapi
 * /api/areas:
 *   post:
 *     summary: Crear nueva área
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, id_sucursal]
 *             properties:
 *               nombre: { type: string }
 *               id_sucursal: { type: integer }
 *     responses:
 *       201:
 *         description: Área creada.
 *       409:
 *         description: Área duplicada en la sucursal.
 */
router.post('/', areasController.createArea);

/**
 * @openapi
 * /api/areas/{id}:
 *   put:
 *     summary: Actualizar área
 *     tags: [Areas]
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
 *               nombre: { type: string }
 *               id_sucursal: { type: integer }
 *               id_status: { type: integer }
 *     responses:
 *       200:
 *         description: Área actualizada.
 */
router.put('/:id', areasController.updateArea);

/**
 * @openapi
 * /api/areas/{id}:
 *   delete:
 *     summary: Eliminar área
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Área eliminada.
 *       409:
 *         description: No se puede eliminar (tiene empleados/equipos).
 */
router.delete('/:id', areasController.deleteArea);

module.exports = router;
