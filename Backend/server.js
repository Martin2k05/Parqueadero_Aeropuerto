const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes'); // Verifica que la ruta a tus rutas sea exacta

const app = express();

// ==========================================
// MIDDLEWARES CRÍTICOS DE CONTEXTO Y DATOS
// ==========================================

// 1. Habilitar CORS para que el frontend (puerto 3000, etc.) no sea bloqueado
app.use(cors({
  origin: '*', // En desarrollo lo dejamos libre para pruebas locales
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. OBLIGATORIO: Procesar JSON en peticiones POST/PUT (Sin esto, el registro da "Ruta no encontrada" o explota)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. RASTREADOR EN CONSOLA (Logger tipo Morgan manual)
// Esto imprimirá en la terminal del backend cada petición exacta que haga el frontend
app.use((req, res, next) => {
  console.log(`[RASTREO AERO PARKING] => Método: ${req.method} | URL Solicitada: ${req.originalUrl}`);
  next();
});

// ==========================================
// VINCULACIÓN DE RUTAS DEL SISTEMA
// ==========================================

// Montamos las rutas de forma plana y con los prefijos más comunes para blindar el front
app.use('/', authRoutes);
app.use('/api', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

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

// ==========================================
// INICIALIZACIÓN DEL PUERTO
// ==========================================
const PUERTO = process.env.PORT || 5000;
app.listen(PUERTO, () => {
  console.log('===================================================');
  console.log(` Servidor AeroParking corriendo en el puerto ${PUERTO}`);
  console.log(' Rastreador de rutas activado en consola.');
  console.log('===================================================');
});