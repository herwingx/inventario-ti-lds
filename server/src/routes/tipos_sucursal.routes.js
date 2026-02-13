/**
 * @module Routes/TiposSucursal
 * @description Rutas para catálogo de tipos de sucursal.
 */
const express = require('express');
const router = express.Router();
const tiposSucursalController = require('../controllers/tipos_sucursal.controller');

/**
 * @openapi
 * tags:
 *   name: Catalogos
 *   description: Catálogos del sistema (Tipos, Roles, Status)
 */

/**
 * @openapi
 * /api/tipos-sucursal:
 *   get:
 *     summary: Listar tipos de sucursal
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos.
 */
router.get('/', tiposSucursalController.getAllTiposSucursal);

/**
 * @openapi
 * /api/tipos-sucursal/{id}:
 *   get:
 *     summary: Obtener tipo de sucursal por ID
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
router.get('/:id', tiposSucursalController.getTipoSucursalById);

/**
 * @openapi
 * /api/tipos-sucursal:
 *   post:
 *     summary: Crear tipo de sucursal
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
 *     responses:
 *       201:
 *         description: Tipo creado.
 */
router.post('/', tiposSucursalController.createTipoSucursal);

/**
 * @openapi
 * /api/tipos-sucursal/{id}:
 *   put:
 *     summary: Actualizar tipo de sucursal
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
 *     responses:
 *       200:
 *         description: Tipo actualizado.
 */
router.put('/:id', tiposSucursalController.updateTipoSucursal);

/**
 * @openapi
 * /api/tipos-sucursal/{id}:
 *   delete:
 *     summary: Eliminar tipo de sucursal
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
router.delete('/:id', tiposSucursalController.deleteTipoSucursal);

module.exports = router;
