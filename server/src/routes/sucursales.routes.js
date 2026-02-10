/**
 * @module Routes/Sucursales
 * @description Define las rutas para la gestión de sucursales.
 */
// ! Rutas para la entidad Sucursales

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo el controlador de sucursales
const sucursalesController = require('../controllers/sucursales.controller');

/**
 * @openapi
 * /api/sucursales:
 *   get:
 *     summary: Listar todas las sucursales
 *     tags: [Estructura Organizacional]
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
 *         description: Datos de la sucursal.
 */
router.get('/:id', sucursalesController.getSucursalById);

/**
 * @openapi
 * /api/sucursales:
 *   post:
 *     summary: Crear una nueva sucursal
 *     tags: [Estructura Organizacional]
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
 *               id_empresa: { type: integer }
 *               id_tipo_sucursal: { type: integer }
 *     responses:
 *       201:
 *         description: Sucursal creada.
 */
router.post('/', sucursalesController.createSucursal);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   put:
 *     summary: Actualizar una sucursal
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sucursal actualizada.
 */
router.put('/:id', sucursalesController.updateSucursal);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   delete:
 *     summary: Eliminar una sucursal
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sucursal eliminada.
 */
router.delete('/:id', sucursalesController.deleteSucursal);

module.exports = router;