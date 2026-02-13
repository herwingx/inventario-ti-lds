/**
 * @module Routes/TiposEquipo
 * @description Rutas para catálogo de tipos de equipo (Hardware).
 */
const express = require('express');
const router = express.Router();
const tiposEquipoController = require('../controllers/tipos_equipo.controller');

/**
 * @openapi
 * tags:
 *   name: Catalogos
 *   description: Catálogos del sistema (Tipos, Roles, Status)
 */

/**
 * @openapi
 * /api/tipos-equipo:
 *   get:
 *     summary: Listar tipos de equipo
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos (Laptop, PC, Impresora, etc.).
 */
router.get('/', tiposEquipoController.getAllTiposEquipo);

/**
 * @openapi
 * /api/tipos-equipo/{id}:
 *   get:
 *     summary: Obtener tipo de equipo por ID
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
 *         description: Detalle del tipo.
 */
router.get('/:id', tiposEquipoController.getTipoEquipoById);

/**
 * @openapi
 * /api/tipos-equipo:
 *   post:
 *     summary: Crear tipo de equipo
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_tipo]
 *             properties:
 *               nombre_tipo: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Tipo creado.
 */
router.post('/', tiposEquipoController.createTipoEquipo);

/**
 * @openapi
 * /api/tipos-equipo/{id}:
 *   put:
 *     summary: Actualizar tipo de equipo
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
 *               nombre_tipo: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       200:
 *         description: Tipo actualizado.
 */
router.put('/:id', tiposEquipoController.updateTipoEquipo);

/**
 * @openapi
 * /api/tipos-equipo/{id}:
 *   delete:
 *     summary: Eliminar tipo de equipo
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
 *         description: Tipo eliminado.
 */
router.delete('/:id', tiposEquipoController.deleteTipoEquipo);

module.exports = router;
