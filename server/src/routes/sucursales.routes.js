/**
 * @module Routes/Sucursales
 * @description Define las rutas para la gestión de sucursales.
 */
const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursales.controller');

/**
 * @openapi
 * tags:
 *   name: Sucursales
 *   description: Gestión de ubicaciones físicas
 */

/**
 * @openapi
 * /api/sucursales:
 *   get:
 *     summary: Listar todas las sucursales
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sucursales.
 */
router.get('/', sucursalesController.getAllSucursales);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   get:
 *     summary: Obtener sucursal por ID
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la sucursal.
 *       404:
 *         description: Sucursal no encontrada.
 */
router.get('/:id', sucursalesController.getSucursalById);

/**
 * @openapi
 * /api/sucursales:
 *   post:
 *     summary: Registrar nueva sucursal
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, id_empresa, id_tipo_sucursal]
 *             properties:
 *               nombre: { type: string }
 *               direccion: { type: string }
 *               numero_telefono: { type: string }
 *               id_empresa: { type: integer }
 *               id_tipo_sucursal: { type: integer }
 *     responses:
 *       201:
 *         description: Sucursal registrada.
 *       409:
 *         description: Nombre duplicado.
 */
router.post('/', sucursalesController.createSucursal);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   put:
 *     summary: Actualizar sucursal
 *     tags: [Sucursales]
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
 *               direccion: { type: string }
 *               numero_telefono: { type: string }
 *               id_empresa: { type: integer }
 *               id_tipo_sucursal: { type: integer }
 *               id_status: { type: integer }
 *     responses:
 *       200:
 *         description: Sucursal actualizada.
 */
router.put('/:id', sucursalesController.updateSucursal);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   delete:
 *     summary: Eliminar sucursal
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Sucursal eliminada.
 *       409:
 *         description: No se puede eliminar (tiene dependencias).
 */
router.delete('/:id', sucursalesController.deleteSucursal);

module.exports = router;
