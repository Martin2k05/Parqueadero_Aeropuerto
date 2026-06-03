const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint para procesar la confirmación del pago exitoso y activar los 30 días de mensualidad
router.post('/mercadopago-success', verificarToken, paymentController.capturarPagoExitoso);

module.exports = router;