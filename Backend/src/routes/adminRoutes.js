const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarToken = require('../middleware/authMiddleware'); // Tu middleware de verificación

// Rutas protegidas para administración de clientes
router.get('/clientes', verificarToken, adminController.obtenerClientes);
router.delete('/clientes/:id', verificarToken, adminController.eliminarCliente);

// Rutas protegidas para administración de reportes
router.get('/reportes', verificarToken, adminController.obtenerReportes);
router.post('/reportes', verificarToken, adminController.crearReporte);

// Rutas protegidas para administración de tarifas
router.get('/tarifas', verificarToken, adminController.obtenerTarifas);
router.put('/tarifas/:id', verificarToken, adminController.actualizarTarifa);

// Ruta protegida para obtener la data real del Dashboard
router.get('/dashboard/metricas', verificarToken, adminController.obtenerMetricasDashboard);
module.exports = router;