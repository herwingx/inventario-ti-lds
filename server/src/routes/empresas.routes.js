/**
 * @module Routes/Empresas
 * @description Define las rutas para la gestión de empresas (Entidades legales).
 */
const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresas.controller');

/**
 * @openapi
 * tags:
 *   name: Empresas
 *   description: Catálogo de razones sociales / entidades legales
 */

/**
 * @openapi
 * /api/empresas:
 *   get:
 *     summary: Listar todas las empresas
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas.
 */
router.get('/', empresasController.getAllEmpresas);

/**
 * @openapi
 * /api/empresas/{id}:
 *   get:
 *     summary: Obtener empresa por ID
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos de la empresa.
 *       404:
 *         description: Empresa no encontrada.
 */
router.get('/:id', empresasController.getEmpresaById);

/**
 * @openapi
 * /api/empresas:
 *   post:
 *     summary: Registrar nueva empresa
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       201:
 *         description: Empresa registrada.
 *       409:
 *         description: Nombre de empresa duplicado.
 */
router.post('/', empresasController.createEmpresa);

/**
 * @openapi
 * /api/empresas/{id}:
 *   put:
 *     summary: Actualizar empresa
 *     tags: [Empresas]
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
 *               id_status: { type: integer }
 *     responses:
 *       200:
 *         description: Empresa actualizada.
 */
router.put('/:id', empresasController.updateEmpresa);

/**
 * @openapi
 * /api/empresas/{id}:
 *   delete:
 *     summary: Eliminar empresa
 *     tags: [Empresas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Empresa eliminada.
 *       409:
 *         description: No se puede eliminar (tiene sucursales/empleados).
 */
router.delete('/:id', empresasController.deleteEmpresa);

module.exports = router;
