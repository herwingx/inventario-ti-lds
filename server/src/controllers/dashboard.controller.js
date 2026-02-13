/**
 * @module Controllers/Dashboard
 * @description Controlador para estadísticas del dashboard.
 * Refactorizado con asyncHandler.
 */
const DashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Obtiene estadísticas generales para el dashboard.
 * @route GET /api/dashboard
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await DashboardService.getStats();
    res.status(200).json(stats);
});

module.exports = {
    getDashboardStats
};
