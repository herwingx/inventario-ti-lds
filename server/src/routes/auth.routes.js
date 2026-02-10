/**
 * @module Routes/Auth
 * @description Define las rutas para la autenticación de usuarios en la plataforma.
 */
// src/routes/auth.routes.js
// * Este archivo define las rutas para la autenticación, como el login.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/**
 * @openapi
 * tags:
 *   name: Autenticación
 *   description: Gestión de sesiones y recuperación de acceso
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna el token JWT y datos del usuario.
 *       401:
 *         description: Usuario o contraseña incorrectos.
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@empresa.com
 *     responses:
 *       200:
 *         description: Correo de recuperación enviado.
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router; 