/**
 * @module Controllers/Dashboard
 * @description Controlador para estadísticas del dashboard.
 */
const DashboardService = require('../services/dashboard.service');

const getDashboardStats = async (req, res) => {
  const stats = await DashboardService.getStats();
  res.status(200).json(stats);
};

module.exports = {
  getDashboardStats
};
