/**
 * @module Routes/Roles
 * @description Rutas para gestión de roles de usuario.
 */
const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');

/**
 * @openapi
 * tags:
 *   name: Catalogos
 *   description: Catálogos del sistema (Tipos, Roles, Status)
 */

/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Listar roles
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles (Admin, Soporte, etc.).
 */
router.get('/', rolesController.getAllRoles);

/**
 * @openapi
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
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
 *         description: Detalle del rol.
 */
router.get('/:id', rolesController.getRoleById);

/**
 * @openapi
 * /api/roles:
 *   post:
 *     summary: Crear nuevo rol
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_rol]
 *             properties:
 *               nombre_rol: { type: string }
 *     responses:
 *       201:
 *         description: Rol creado.
 */
router.post('/', rolesController.createRole);

/**
 * @openapi
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar rol
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
 *               nombre_rol: { type: string }
 *     responses:
 *       200:
 *         description: Rol actualizado.
 */
router.put('/:id', rolesController.updateRole);

/**
 * @openapi
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar rol
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
 *         description: Rol eliminado.
 */
router.delete('/:id', rolesController.deleteRole);

module.exports = router;
