/**
 * @module Routes/Roles
 * @description Define las rutas para la gestión de roles y permisos.
 */
// src/routes/roles.routes.js
// Define las rutas HTTP para la entidad 'roles'.

const express = require('express');
// * Instancia del enrutador de Express
const router = express.Router();

// * Importo las funciones controladoras de roles
const rolesController = require('../controllers/roles.controller');

/**
 * @openapi
 * tags:
 *   name: Catálogos
 *   description: Parámetros y estados globales del sistema
 */

/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Listar todos los roles de usuario
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles.
 */
router.get('/', rolesController.getAllRoles);

/**
 * @openapi
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
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
 *         description: Datos del rol.
 */
router.get('/:id', rolesController.getRoleById);

module.exports = router;