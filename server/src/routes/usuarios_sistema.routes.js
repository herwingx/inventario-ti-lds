/**
 * @module Routes/UsuariosSistema
 * @description Rutas para gestión de usuarios administradores/técnicos.
 */
const express = require('express');
const router = express.Router();
const usuariosSistemaController = require('../controllers/usuarios_sistema.controller');
const { isAdmin, hasRole, ROLES } = require('../middleware/auth.middleware');

/**
 * @openapi
 * tags:
 *   name: Usuarios Sistema
 *   description: Gestión de accesos al panel administrativo
 */

/**
 * @openapi
 * /api/usuarios-sistema:
 *   get:
 *     summary: Listar usuarios del sistema
 *     tags: [Usuarios Sistema]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios (sin passwords).
 */
router.get('/', hasRole([ROLES.ADMIN, ROLES.SUPERVISOR]), usuariosSistemaController.getAllUsuariosSistema);

/**
 * @openapi
 * /api/usuarios-sistema/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios Sistema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del usuario.
 */
router.get('/:id', hasRole([ROLES.ADMIN, ROLES.SUPERVISOR]), usuariosSistemaController.getUsuarioSistemaById);

/**
 * @openapi
 * /api/usuarios-sistema:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Usuarios Sistema]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, id_rol]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, minLength: 6 }
 *               email: { type: string, format: email }
 *               id_rol: { type: integer }
 *               id_empleado: { type: integer }
 *     responses:
 *       201:
 *         description: Usuario creado.
 */
router.post('/', isAdmin, usuariosSistemaController.createUsuarioSistema);

/**
 * @openapi
 * /api/usuarios-sistema/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios Sistema]
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
 *               username: { type: string }
 *               email: { type: string }
 *               id_rol: { type: integer }
 *               id_status: { type: integer }
 *               password: { type: string, description: "Opcional: Solo si se desea cambiar" }
 *     responses:
 *       200:
 *         description: Usuario actualizado.
 */
router.put('/:id', isAdmin, usuariosSistemaController.updateUsuarioSistema);

/**
 * @openapi
 * /api/usuarios-sistema/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios Sistema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario eliminado.
 */
router.delete('/:id', isAdmin, usuariosSistemaController.deleteUsuarioSistema);

module.exports = router;
