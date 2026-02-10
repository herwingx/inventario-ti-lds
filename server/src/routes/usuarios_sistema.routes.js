/**
 * @module Routes/UsuariosSistema
 * @description Define las rutas para la gestión de usuarios del sistema.
 */
// src/routes/usuariosSistema.routes.js
// Define las rutas HTTP para la entidad 'usuarios_sistema'.

const express = require('express');
const router = express.Router(); // * Instancia del enrutador de Express

// * Importo las funciones controladoras de usuarios del sistema
const usuariosSistemaController = require('../controllers/usuarios_sistema.controller');

/**
 * @openapi
 * tags:
 *   name: Gestión de Usuarios
 *   description: Administración de cuentas con acceso al panel administrativo
 */

/**
 * @openapi
 * /api/usuarios-sistema:
 *   get:
 *     summary: Listar todos los usuarios del sistema
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios.
 */
router.get('/', usuariosSistemaController.getAllUsuariosSistema);

/**
 * @openapi
 * /api/usuarios-sistema/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario.
 */
router.get('/:id', usuariosSistemaController.getUsuarioSistemaById);

/**
 * @openapi
 * /api/usuarios-sistema:
 *   post:
 *     summary: Crear un nuevo usuario administrativo
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Usuario creado.
 */
router.post('/', usuariosSistemaController.createUsuarioSistema);

/**
 * @openapi
 * /api/usuarios-sistema/{id}:
 *   put:
 *     summary: Actualizar datos de usuario
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario actualizado.
 */
router.put('/:id', usuariosSistemaController.updateUsuarioSistema);

/**
 * @openapi
 * /api/usuarios-sistema/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario eliminado.
 */
router.delete('/:id', usuariosSistemaController.deleteUsuarioSistema);

module.exports = router;