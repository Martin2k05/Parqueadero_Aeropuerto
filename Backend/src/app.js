const express = require('express');
const cors = require('cors');

// ==========================================
// IMPORTE DE RUTAS CORREGIDO (Sin el prefijo /src)
// ==========================================
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// ==========================================
// MIDDLEWARES CRÍTICOS DE CONTEXTO Y DATOS
// ==========================================

// 1. Habilitar CORS para que el frontend no sea bloqueado
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Procesar JSON en peticiones POST/PUT
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. RASTREADOR EN CONSOLA (Logger manual)
app.use((req, res, next) => {
  console.log(`[RASTREO AERO PARKING] => Método: ${req.method} | URL Solicitada: ${req.originalUrl}`);
  next();
});

// ==========================================
// VINCULACIÓN DE RUTAS DEL SISTEMA
// ==========================================

// Rutas de Autenticación y Perfil (Login, Registro, Perfil)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Respaldo por si el front apunta directo

// Rutas del Dashboard (Operario/Admin y Clientes)
app.use('/api/dashboard', dashboardRoutes); // <- Esto soluciona el 404 de /api/dashboard/cliente

// Rutas de Pagos (Mercado Pago)
app.use('/api/payments', paymentRoutes);     // Amazon / Webhook golpeará aquí

// ==========================================
// CAPTURADOR GLOBAL DE RUTAS INEXISTENTES (404)
// ==========================================
app.use((req, res, next) => {
  console.error(`[ALERTA 404] El frontend intentó entrar a una ruta no mapeada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: `Ruta no encontrada en el ecosistema AeroParking. Verifique el método o el prefijo de la URL (${req.method} ${req.originalUrl}).`
  });
});

// ==========================================
// MANEJADOR DE ERRORES INTERNOS GLOBAL (500)
// ==========================================
app.use((err, req, res, next) => {
  console.error('[ERROR CRÍTICO DEL SERVIDOR]:', err.stack || err.message || err);
  res.status(500).json({
    message: 'Ocurrió un error interno en el servidor.',
    error: err.message
  });
});

// Exportamos la app configurada para que server.js la encienda
module.exports = app;