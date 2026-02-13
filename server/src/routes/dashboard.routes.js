/**
 * @module Routes/Dashboard
 * @description Rutas para estadísticas del sistema.
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

/**
 * @openapi
 * tags:
 *   name: Dashboard
 *   description: Métricas y KPIs
 */

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     summary: Obtener estadísticas generales
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contadores de equipos, tickets, asignaciones.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_equipos: { type: integer }
 *                 tickets_abiertos: { type: integer }
 *                 asignaciones_activas: { type: integer }
 */
router.get('/', dashboardController.getDashboardStats);

module.exports = router;
