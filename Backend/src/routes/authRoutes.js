const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Importamos bcrypt aquí para usarlo en la nueva ruta
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

// --- RUTAS DE ACCESO PÚBLICO ---
router.post('/login', authController.login);
router.post('/register', authController.registerCliente);

// Ruta para crear operador (con validación de seguridad)
router.post('/register-operador', async (req, res) => {
  const { nombre_usuario, correo, contrasena, id_rol } = req.body;
  
  // Validación crítica: si no llega contraseña, no intentamos encriptar
  if (!contrasena) {
    return res.status(400).json({ message: "La contraseña es obligatoria." });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    await db.query(
      'INSERT INTO usuarios (nombre_usuario, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)',
      [nombre_usuario, correo, hash, id_rol]
    );
    res.status(201).json({ message: 'Operador creado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el operador.' });
  }
});

// --- RUTAS PROTEGIDAS (Requieren Token) ---
router.put('/cambiar-password', verificarToken, authController.cambiarContrasena);

// Ruta para obtener perfil completo del cliente
router.get('/perfil-cliente', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.nombre_cliente, c.identificacion, c.correo, c.telefono, 
              c.dir_calle, c.dir_carrera, c.dir_numero, c.dir_barrio, 
              m.placa_vehiculo 
       FROM clientes c
       LEFT JOIN mensualidades m ON c.id_cliente = m.id_cliente
       WHERE c.id_cliente = ? 
       ORDER BY m.id_mensualidad DESC LIMIT 1`, 
      [req.user.id]
    );
    rows.length > 0 ? res.json(rows[0]) : res.status(404).json({ message: 'Cliente no encontrado' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Error al obtener el perfil' }); 
  }
});

// Ruta para actualizar datos del perfil del cliente
router.put('/actualizar-perfil', verificarToken, async (req, res) => {
  const { correo, telefono, dir_calle, dir_carrera, dir_numero, dir_barrio } = req.body;
  const idCliente = req.user.id;

  try {
    const [existCheck] = await db.query(
      'SELECT correo FROM clientes WHERE correo = ? AND id_cliente != ? UNION SELECT correo FROM usuarios WHERE correo = ?',
      [correo, idCliente, correo]
    );
    
    if (existCheck.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
    }

    await db.query(
      `UPDATE clientes 
       SET correo = ?, telefono = ?, dir_calle = ?, dir_carrera = ?, dir_numero = ?, dir_barrio = ? 
       WHERE id_cliente = ?`,
      [correo, telefono, dir_calle, dir_carrera, dir_numero, dir_barrio, idCliente]
    );
    
    res.json({ message: 'Perfil actualizado correctamente.' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar el perfil' }); 
  }
});

module.exports = router;