/**
 * @module Routes/Areas
 * @description Define las rutas para la gestión de areas administrativas.
 */
// ! Rutas para la entidad Áreas

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo el controlador de áreas
const areasController = require('../controllers/areas.controller');

/**
 * @openapi
 * /api/areas:
 *   get:
 *     summary: Listar todas las áreas
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
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
 *     tags: [Estructura Organizacional]
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
 */
router.get('/:id', areasController.getAreaById);

/**
 * @openapi
 * /api/areas:
 *   post:
 *     summary: Crear una nueva área
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, id_empresa]
 *             properties:
 *               nombre: { type: string }
 *               id_empresa: { type: integer }
 *     responses:
 *       201:
 *         description: Área creada.
 */
router.post('/', areasController.createArea);

/**
 * @openapi
 * /api/areas/{id}:
 *   put:
 *     summary: Actualizar un área
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Área actualizada.
 */
router.put('/:id', areasController.updateArea);

/**
 * @openapi
 * /api/areas/{id}:
 *   delete:
 *     summary: Eliminar un área
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Área eliminada.
 */
router.delete('/:id', areasController.deleteArea);

module.exports = router;