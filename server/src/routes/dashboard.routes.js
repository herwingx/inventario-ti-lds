const { Router } = require('express');
const router = Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

// Todas las rutas de dashboard requieren autenticación
router.use(protect);

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
