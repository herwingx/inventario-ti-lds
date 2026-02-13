/**
 * @module Routes/Profile
 * @description Rutas para gestión del perfil de usuario.
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

/**
 * @openapi
 * tags:
 *   name: Perfil
 *   description: Gestión de cuenta personal
 */

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Obtener mi perfil
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado.
 */
router.get('/', profileController.getProfile);

/**
 * @openapi
 * /api/profile:
 *   put:
 *     summary: Actualizar mi perfil
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string, format: email }
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Perfil actualizado.
 *       400:
 *         description: Contraseña actual requerida para cambios sensibles.
 */
router.put('/', profileController.updateProfile);

module.exports = router;
