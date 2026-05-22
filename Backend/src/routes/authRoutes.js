const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Importamos tus controladores antiguos
const authController = require('../controllers/authController');

// Importamos el objeto completo de middlewares
const middlewaresObj = require('../middlewares/authMiddleware');

// Sacamos automáticamente la primera función que encuentre dentro de ese objeto
const verifToken = Object.values(middlewaresObj).find(fn => typeof fn === 'function');

// Rutas viejas usando tu controlador original
router.post('/login', authController.login);
router.post('/register', authController.registerCliente);

// Ruta de cambiar contraseña (Línea 17)
router.put('/cambiar-password', verifToken, async (req, res) => {
  const { actual, nueva } = req.body;
  const idUsuario = req.user.id;
  const rolUsuario = req.user.rol;

  try {
    let queryBuscar = '';
    let queryActualizar = '';

    if (rolUsuario === 'Cliente') {
      queryBuscar = 'SELECT contrasena FROM clientes WHERE id_cliente = ?';
      queryActualizar = 'UPDATE clientes SET contrasena = ? WHERE id_cliente = ?';
    } else {
      queryBuscar = 'SELECT contrasena FROM usuarios WHERE id_usuario = ?';
      queryActualizar = 'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?';
    }

    const [rows] = await db.query(queryBuscar, [idUsuario]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado en el sistema.' });
    }

    const contrasenaBD = rows[0].contrasena;

    const passwordCorrect = await bcrypt.compare(actual, contrasenaBD);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashNueva = await bcrypt.hash(nueva, salt);

    await db.query(queryActualizar, [hashNueva, idUsuario]);

    res.json({ message: '¡Contraseña modificada correctamente!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
  }
});

// Ruta para obtener los datos reales del perfil del Cliente logueado
// Ruta para obtener todos los datos reales del perfil del Cliente logueado
router.get('/perfil-cliente', verifToken, async (req, res) => {
  const idCliente = req.user.id;

  try {
    // CORRECCIÓN: Traemos también los campos compuestos de la dirección
    const [rows] = await db.query(
      `SELECT c.nombre_cliente, c.identificacion, c.correo, c.telefono, 
              c.dir_calle, c.dir_carrera, c.dir_numero, c.dir_barrio, 
              m.placa_vehiculo 
       FROM clientes c
       LEFT JOIN mensualidades m ON c.id_cliente = m.id_cliente
       WHERE c.id_cliente = ? 
       ORDER BY m.id_mensualidad DESC LIMIT 1`, 
      [idCliente]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los datos del perfil.' });
  }
});

// Ruta para actualizar Correo, Teléfono y Dirección del Cliente
router.put('/actualizar-perfil', verifToken, async (req, res) => {
  const idCliente = req.user.id;
  // Recibimos los datos modificables desde el frontend
  const { correo, telefono, dir_calle, dir_carrera, dir_numero, dir_barrio } = req.body;

  try {
    // Validar si el correo nuevo ya lo tiene otra persona
    const [existCheck] = await db.query(
      'SELECT correo FROM clientes WHERE correo = ? AND id_cliente != ? UNION SELECT correo FROM usuarios WHERE correo = ?',
      [correo, idCliente, correo]
    );
    
    if (existCheck.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });
    }

    // CORRECCIÓN: Actualizamos correo, teléfono y la dirección desglosada
    await db.query(
      `UPDATE clientes 
       SET correo = ?, telefono = ?, dir_calle = ?, dir_carrera = ?, dir_numero = ?, dir_barrio = ? 
       WHERE id_cliente = ?`,
      [correo, telefono, dir_calle, dir_carrera, dir_numero, dir_barrio, idCliente]
    );

    res.json({ message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el perfil.' });
  }
});

// Ruta para actualizar solo Correo y Teléfono del Cliente
router.put('/actualizar-perfil', verifToken, async (req, res) => {
  const idCliente = req.user.id;
  const { correo, telefono } = req.body;

  try {
    // Validar primero si el correo ya lo tiene otro usuario o cliente
    const [existCheck] = await db.query(
      'SELECT correo FROM clientes WHERE correo = ? AND id_cliente != ? UNION SELECT correo FROM usuarios WHERE correo = ?',
      [correo, idCliente, correo]
    );
    
    if (existCheck.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });
    }

    // Actualizar únicamente correo y telefono
    await db.query(
      'UPDATE clientes SET correo = ?, telefono = ? WHERE id_cliente = ?',
      [correo, telefono, idCliente]
    );

    res.json({ message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el perfil.' });
  }
});

module.exports = router;