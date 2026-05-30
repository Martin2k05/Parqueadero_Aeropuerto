const mysql = require('mysql2/promise');

// Configuración del pool de conexiones a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',       // Tu usuario de MySQL (por defecto suele ser root)
  password: 'root',       // Tu contraseña de MySQL (vacía o la que tengas configurada)
  database: 'parqueadero_aeropuerto',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificación inicial de la conexión al arrancar el servidor
const verificarConexion = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('===================================================');
    console.log(' Conexión exitosa a la base de datos MySQL.');
    console.log('===================================================');
    connection.release();
  } catch (error) {
    console.error('===================================================');
    console.error(' ERROR CRÍTICO: No se pudo conectar a MySQL.');
    console.error(' Verifique que el servicio XAMPP/MySQL esté activo.');
    console.error(' Detalle:', error.message);
    console.log('===================================================');
  }
};

verificarConexion();

module.exports = pool;