const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // 👈 Importamos tu controlador real
const authMiddlewareObj = require('../middlewares/authMiddleware');
const verifToken = authMiddlewareObj.verificarToken;

const { MercadoPagoConfig } = require('mercadopago');
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-2666026075230997-052508-8ac9febd57b8bff50c507b7b5fa9deb5-3425962506' 
});

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

// Login (Soporta todas las variantes que usa tu Front)
router.post('/login', authController.login);
router.post('/auth/login', authController.login);
router.post('/api/auth/login', authController.login);

// Registro
router.post('/registro', authController.registerCliente);
router.post('/auth/registro', authController.registerCliente);
router.post('/api/auth/registro', authController.registerCliente);
router.post('/register', authController.registerCliente);
router.post('/auth/register', authController.registerCliente);
router.post('/api/auth/register', authController.registerCliente);

// Perfil (GET)
router.get('/perfil-cliente', verifToken, authController.obtenerPerfil);
router.get('/auth/perfil-cliente', verifToken, authController.obtenerPerfil);
router.get('/api/auth/perfil-cliente', verifToken, authController.obtenerPerfil);
router.get('/perfil', verifToken, authController.obtenerPerfil);
router.get('/auth/perfil', verifToken, authController.obtenerPerfil);
router.get('/api/auth/perfil', verifToken, authController.obtenerPerfil);
router.get('/api/dashboard/perfil-cliente', verifToken, authController.obtenerPerfil);

// Actualizar Perfil (PUT)
router.put('/actualizar-perfil', verifToken, authController.actualizarPerfil);
router.put('/auth/actualizar-perfil', verifToken, authController.actualizarPerfil);
router.put('/api/auth/actualizar-perfil', verifToken, authController.actualizarPerfil);
router.put('/perfil', verifToken, authController.actualizarPerfil);
router.put('/auth/perfil', verifToken, authController.actualizarPerfil);
router.put('/api/auth/perfil', verifToken, authController.actualizarPerfil);

// Cambiar Contraseña (PUT) 👈 ¡AQUÍ ESTÁ LA MAGIA!
router.put('/cambiar-password', verifToken, authController.cambiarContrasena);
router.put('/auth/cambiar-password', verifToken, authController.cambiarContrasena);
router.put('/api/auth/cambiar-password', verifToken, authController.cambiarContrasena);
router.put('/cambiar-contrasena', verifToken, authController.cambiarContrasena);
router.put('/auth/cambiar-contrasena', verifToken, authController.cambiarContrasena);
router.put('/api/auth/cambiar-contrasena', verifToken, authController.cambiarContrasena);

module.exports = router;