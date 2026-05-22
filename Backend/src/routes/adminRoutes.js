const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.put('/tarifas', verificarToken, permitirRoles('Admin'), adminController.actualizarTarifas);
router.get('/reportes', verificarToken, permitirRoles('Admin'), adminController.obtenerReportes);

module.exports = router;