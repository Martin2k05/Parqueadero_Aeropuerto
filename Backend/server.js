// Cargar variables de entorno si usas un archivo .env
require('dotenv').config(); 

// CORREGIDO: Agregamos './src/app' porque tu archivo app.js está dentro de la carpeta src
const app = require('./src/app'); 

// ==========================================
// INICIALIZACIÓN DEL PUERTO Y ENCENDIDO
// ==========================================
const PUERTO = process.env.PORT || 5000;

app.listen(PUERTO, () => {
  console.log('===================================================');
  console.log(` Servidor AeroParking corriendo en el puerto ${PUERTO}`);
  console.log(' Rastreador de rutas activo y escuchando peticiones.');
  console.log('===================================================');
});