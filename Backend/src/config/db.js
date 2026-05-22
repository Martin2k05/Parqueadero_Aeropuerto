const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Asegurar que las columnas de autenticación y roles existan
const initDbModifications = async () => {
  try {
    // Insertar rol cliente si no existe
    await promisePool.query("INSERT IGNORE INTO roles (id_rol, nombre_rol) VALUES (3, 'Cliente')");

    // Modificaciones en usuarios (Admin y Operario)
    const [userCols] = await promisePool.query("SHOW COLUMNS FROM usuarios");
    const userColNames = userCols.map(c => c.Field);
    if (!userColNames.includes('correo')) {
      await promisePool.query("ALTER TABLE usuarios ADD COLUMN correo VARCHAR(150) NOT NULL UNIQUE");
    }
    if (!userColNames.includes('contrasena')) {
      await promisePool.query("ALTER TABLE usuarios ADD COLUMN contrasena VARCHAR(255) NOT NULL");
    }

    // Modificaciones en clientes (Ajuste para Login y Registro)
    const [clientCols] = await promisePool.query("SHOW COLUMNS FROM clientes");
    const clientColNames = clientCols.map(c => c.Field);
    if (!clientColNames.includes('identificacion')) {
      await promisePool.query("ALTER TABLE clientes ADD COLUMN identificacion VARCHAR(50) NOT NULL UNIQUE");
    }
    if (!clientColNames.includes('correo')) {
      await promisePool.query("ALTER TABLE clientes ADD COLUMN correo VARCHAR(150) NOT NULL UNIQUE");
    }
    if (!clientColNames.includes('contrasena')) {
      await promisePool.query("ALTER TABLE clientes ADD COLUMN contrasena VARCHAR(255) NOT NULL");
    }

    console.log('Base de datos verificada y adaptada correctamente.');
  } catch (error) {
    console.error('Error inicializando modificaciones de DB:', error);
  }
};

initDbModifications();

module.exports = promisePool;