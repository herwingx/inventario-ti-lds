/**
 * @module Routes/Empresas
 * @description Define las rutas para la gestión de las empresas del ecosistema.
 */
// ! Rutas para la entidad Empresas

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo el controlador de empresas
const empresasController = require('../controllers/empresas.controller');

/**
 * @openapi
 * tags:
 *   name: Estructura Organizacional
 *   description: Gestión de Empresas, Sucursales y Áreas
 */

/**
 * @openapi
 * /api/empresas:
 *   get:
 *     summary: Listar todas las empresas
 *     tags: [Estructura Organizacional]
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
 *         description: Datos de la empresa.
 */
router.get('/:id', empresasController.getEmpresaById);

/**
 * @openapi
 * /api/empresas:
 *   post:
 *     summary: Crear una nueva empresa
 *     tags: [Estructura Organizacional]
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
 *               nombre: { type: string, example: "Corporativo LDS" }
 *     responses:
 *       201:
 *         description: Empresa creada.
 */
router.post('/', empresasController.createEmpresa);

/**
 * @openapi
 * /api/empresas/{id}:
 *   put:
 *     summary: Actualizar una empresa
 *     tags: [Estructura Organizacional]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       200:
 *         description: Empresa actualizada.
 */
router.put('/:id', empresasController.updateEmpresa);

/**
 * @openapi
 * /api/empresas/{id}:
 *   delete:
 *     summary: Eliminar una empresa
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
 *         description: Empresa eliminada.
 */
router.delete('/:id', empresasController.deleteEmpresa);

module.exports = router;