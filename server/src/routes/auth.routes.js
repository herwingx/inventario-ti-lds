/**
 * @module Routes/Auth
 * @description Define las rutas para la autenticación de usuarios en la plataforma.
 */
// src/routes/auth.routes.js

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
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: admin@lds.com
 *                 description: Correo o nombre de usuario del sistema
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret.123
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna el token JWT y datos del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: 
 *                           type: integer
 *                         username:
 *                           type: string
 *                         roleName:
 *                           type: string
 *       401:
 *         description: Credenciales inválidas o cuenta inactiva.
 *       429:
 *         description: Demasiados intentos fallidos.
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Crear usuario normal y enviar credenciales por correo
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombres, apellidos, email]
 *             properties:
 *               nombres:
 *                 type: string
 *                 example: Juan
 *               apellidos:
 *                 type: string
 *                 example: Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan.perez@empresa.com
 *     responses:
 *       201:
 *         description: Cuenta creada y credenciales enviadas.
 *       400:
 *         description: Datos inválidos.
 *       409:
 *         description: El correo ya tiene una cuenta vinculada.
 */
router.post('/signup', authController.signup);

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
 *                 format: email
 *                 example: admin@lds.com
 *     responses:
 *       200:
 *         description: Correo de recuperación enviado (si el email existe).
 *       400:
 *         description: Email no válido o faltante.
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     description: Finaliza el proceso de recuperación usando el token enviado por email.
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
 *                 description: Token recibido por correo
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 *       400:
 *         description: Token inválido, expirado o contraseña débil.
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;
