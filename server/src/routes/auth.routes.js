/**
 * @module Routes/Auth
 * @description Define las rutas para la autenticación de usuarios en la plataforma.
 */
// src/routes/auth.routes.js
// * Este archivo define las rutas para la autenticación, como el login.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// [POST] /api/auth/login - Token de 30 días para facilitar inventario
router.post('/login', authController.login);

// [POST] /api/auth/forgot-password - Solicitar recuperación
router.post('/forgot-password', authController.forgotPassword);

// [POST] /api/auth/reset-password - Restablecer contraseña
router.post('/reset-password', authController.resetPassword);

module.exports = router; 