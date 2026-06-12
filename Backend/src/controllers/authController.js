const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- INICIO DE SESIÓN ---
exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    let [users] = await db.query(
      'SELECT u.*, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.correo = ?',
      [correo]
    );

    let usuarioEncontrado = null;
    let rolUsuario = '';
    let idRef = null;

    if (users.length > 0) {
      usuarioEncontrado = users[0];
      rolUsuario = usuarioEncontrado.nombre_rol;
      idRef = usuarioEncontrado.id_usuario;
    } else {
      let [clients] = await db.query('SELECT * FROM clientes WHERE correo = ?', [correo]);
      if (clients.length > 0) {
        usuarioEncontrado = clients[0];
        rolUsuario = 'Cliente';
        idRef = clients[0].id_cliente;
      }
    }

    if (!usuarioEncontrado) {
      return res.status(404).json({ message: 'Credenciales incorrectas o usuario no registrado.' });
    }

    const passwordCorrect = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: idRef, correo: usuarioEncontrado.correo, rol: rolUsuario },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: idRef,
        nombre: usuarioEncontrado.nombre_usuario || usuarioEncontrado.nombre_cliente,
        correo: usuarioEncontrado.correo,
        rol: rolUsuario
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor en el inicio de sesión.' });
  }
};

// --- REGISTRO DE CLIENTE ---
exports.registerCliente = async (req, res) => {
  const { nombreCompleto, identificacion, correo, telefono, calle, carrera, numero, barrio, placaVehiculo, contrasena } = req.body;

  try {
    const [existCheck] = await db.query(
      'SELECT correo FROM clientes WHERE correo = ? UNION SELECT correo FROM usuarios WHERE correo = ?', 
      [correo, correo]
    );
    if (existCheck.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash(contrasena, salt);

    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaVehiculo]);

    const [clientResult] = await db.query(
      `INSERT INTO clientes (nombre_cliente, identificacion, correo, dir_barrio, dir_calle, dir_carrera, dir_numero, telefono, contrasena) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombreCompleto, identificacion, correo, barrio, calle, carrera, numero, telefono, hashContrasena]
    );

    const idCliente = clientResult.insertId;
    const fechaInicio = new Date();
    const fechaFinal = new Date();
    fechaFinal.setDate(fechaFinal.getDate() + 30);

    await db.query(
      'INSERT INTO mensualidades (id_cliente, placa_vehiculo, id_usuario, fecha_inicio, fecha_final) VALUES (?, ?, 1, ?, ?)',
      [idCliente, placaVehiculo, fechaInicio, fechaFinal]
    );

    res.status(201).json({ message: 'Cliente registrado con éxito y plan mensual activado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el registro del cliente.' });
  }
};

// --- CAMBIAR CONTRASENA ---
exports.cambiarContrasena = async (req, res) => {
  const { actual, nueva } = req.body;
  const idUsuario = req.user.id;
  const rolUsuario = req.user.rol;

  try {
    let queryBuscar = rolUsuario === 'Cliente' ? 'SELECT contrasena FROM clientes WHERE id_cliente = ?' : 'SELECT contrasena FROM usuarios WHERE id_usuario = ?';
    let queryActualizar = rolUsuario === 'Cliente' ? 'UPDATE clientes SET contrasena = ? WHERE id_cliente = ?' : 'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?';

    const [rows] = await db.query(queryBuscar, [idUsuario]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const passwordCorrect = await bcrypt.compare(actual, rows[0].contrasena);
    if (!passwordCorrect) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });

    const hashNueva = await bcrypt.hash(nueva, await bcrypt.genSalt(10));
    await db.query(queryActualizar, [hashNueva, idUsuario]);

    res.json({ message: '¡Contraseña modificada correctamente!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno al cambiar la contraseña.' });
  }
};