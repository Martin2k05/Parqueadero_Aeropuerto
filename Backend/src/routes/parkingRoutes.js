const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { verificarToken } = require('../middlewares/authMiddleware');

console.log("Debug Controller:", parkingController);

router.post('/ingreso', verificarToken, parkingController.registrarIngreso);
router.post('/salida', verificarToken, parkingController.registrarSalida);
router.get('/activos', verificarToken, parkingController.listarVehiculosDentro);
router.post('/leer-placa', parkingController.leerPlaca);

module.exports = router;