const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.get('/monitoreo', verificarToken, permitirRoles('Admin', 'Operario'), dashboardController.getOperarioAdminDashboard);
router.get('/cliente', verificarToken, permitirRoles('Cliente'), dashboardController.getClienteDashboard);
router.get('/perfil-cliente', verificarToken, permitirRoles('Cliente'), dashboardController.getPerfilCliente);

module.exports = router;