const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.post('/ingreso', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.registrarIngreso);
router.post('/salida', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.registrarSalida);
router.get('/vehiculos-activos', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.listarVehiculosDentro);

module.exports = router;