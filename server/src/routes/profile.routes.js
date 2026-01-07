/**
 * @module Routes/Profile
 * @description Define las rutas para la gestión del perfil del usuario autenticado.
 */
// src/routes/profile.routes.js
// ! Rutas para el perfil del usuario autenticado
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');

// * [GET] /api/profile - Obtener perfil del usuario autenticado
router.get('/', profileController.getProfile);

// * [PUT] /api/profile - Actualizar perfil (email, password)
router.put('/', profileController.updateProfile);

module.exports = router;
