const { Router } = require('express');
const router = Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * @openapi
 * tags:
 *   name: Dashboard
 *   description: Estadísticas y métricas generales del sistema
 */

// Todas las rutas de dashboard requieren autenticación
router.use(protect);

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas globales para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen estadístico (Equipos, Tickets, Mantenimientos).
 */
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
