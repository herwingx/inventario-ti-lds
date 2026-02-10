/**
 * @module Routes/Profile
 * @description Define las rutas para la gestión del perfil del usuario autenticado.
 */
// src/routes/profile.routes.js
// ! Rutas para el perfil del usuario autenticado
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');

/**
 * @openapi
 * tags:
 *   name: Usuario
 *   description: Gestión de perfil y configuración personal
 */

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil.
 */
router.get('/', profileController.getProfile);

/**
 * @openapi
 * /api/profile:
 *   put:
 *     summary: Actualizar datos de perfil (Email/Password)
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil actualizado.
 */
router.put('/', profileController.updateProfile);

module.exports = router;
