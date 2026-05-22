const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// Middlewares globales de utilidad
app.use(cors());
app.use(express.json());

// Declaración formal e inyección de rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Manejo centralizado de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada en el ecosistema AeroParking.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor AeroParking inicializado correctamente en el puerto ${PORT}`);
});