const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// CONTROLADOR INTEGRADO DE LOGIN
// ==========================================
exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // 1. Buscar primero en la tabla de usuarios internos (Admin / Operario)
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
      // 2. Si no está en usuarios, buscar en la tabla de clientes
      let [clients] = await db.query('SELECT * FROM clientes WHERE correo = ?', [correo]);
      if (clients.length > 0) {
        usuarioEncontrado = clients[0];
        rolUsuario = 'Cliente';
        idRef = usuarioEncontrado.id_cliente;
      }
    }

    if (!usuarioEncontrado) {
      return res.status(404).json({ message: 'Credenciales incorrectas o usuario no registrado.' });
    }

    // Validar contraseña
    const passwordCorrect = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // Generar Token JWT
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

// ==========================================
// CONTROLADOR INTEGRADO DE REGISTRO
// ==========================================
exports.registerCliente = async (req, res) => {
  const { 
    nombreCompleto, 
    identificacion, 
    correo, 
    telefono, 
    calle, 
    carrera, 
    numero, 
    barrio, 
    placaVehiculo, 
    contrasena 
  } = req.body;

  try {
    // 1. Validar si el correo ya existe
    const [existCheck] = await db.query(
      'SELECT correo FROM clientes WHERE correo = ? UNION SELECT correo FROM usuarios WHERE correo = ?', 
      [correo, correo]
    );
    if (existCheck.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    // 2. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash(contrasena, salt);

    // 3. Insertar el vehículo si no existe en la base de datos global
    if (placaVehiculo) {
      const placaFormateada = placaVehiculo.trim().substring(0, 10);
      await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaFormateada]);
    }

    // 4. Insertar en la tabla clientes
    const [resultado] = await db.query(
      `INSERT INTO clientes (
        nombre_cliente, 
        identificacion, 
        correo, 
        dir_barrio, 
        dir_calle, 
        dir_carrera, 
        dir_numero, 
        telefono, 
        contrasena
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombreCompleto, identificacion, correo, barrio, calle, carrera, numero, telefono, hashContrasena]
    );

    const nuevoIdCliente = resultado.insertId;

    // 5. Vincular la placa al cliente en mensualidades desde el registro
    if (placaVehiculo) {
      const placaFormateada = placaVehiculo.trim().substring(0, 10);
      await db.query(
        `INSERT INTO mensualidades (id_cliente, placa_vehiculo, id_usuario, fecha_inicio, fecha_final) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [nuevoIdCliente, placaFormateada]
      );
    }

    // Respuesta exitosa
    res.status(201).json({ message: 'Registro exitoso.', id: nuevoIdCliente });

  } catch (error) {
    console.error('Error en el registro del cliente:', error);
    res.status(500).json({ message: 'Error en el registro del cliente.' });
  }
};

// ==========================================
// CONTROLADOR INTEGRADO DE PERFIL (GET)
// ==========================================
exports.obtenerPerfil = async (req, res) => {
  const idCliente = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        id_cliente,
        nombre_cliente,
        correo,
        telefono,
        identificacion,
        dir_barrio,
        dir_calle,
        dir_carrera,
        dir_numero
       FROM clientes WHERE id_cliente = ?`,
      [idCliente]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado en el sistema.' });
    }

    const infoCliente = rows[0];

    // Buscar la última placa amarrada a sus mensualidades
    const [vehiculoRows] = await db.query(
      `SELECT placa_vehiculo FROM mensualidades 
       WHERE id_cliente = ? 
       ORDER BY id_mensualidad DESC LIMIT 1`, 
      [idCliente]
    );

    // Si no tiene mensualidad activa ni placa registrada, muestra "Sin Placa"
    infoCliente.placa_vehiculo = vehiculoRows.length > 0 ? vehiculoRows[0].placa_vehiculo : "Sin Placa";

    return res.json(infoCliente);

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ message: 'Error al traer los datos de perfil.' });
  }
};

// ==========================================
// CONTROLADOR INTEGRADO DE ACTUALIZACIÓN (PUT)
// ==========================================
exports.actualizarPerfil = async (req, res) => {
  const idCliente = req.user.id;
  const { correo, telefono, dir_calle, dir_carrera, dir_numero, dir_barrio } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio.' });
  }

  try {
    // Actualiza única y exclusivamente la información de contacto y residencia
    await db.query(
      `UPDATE clientes SET 
        correo = ?, 
        telefono = ?, 
        dir_barrio = ?, 
        dir_calle = ?, 
        dir_carrera = ?, 
        dir_numero = ? 
       WHERE id_cliente = ?`,
      [correo, telefono, dir_barrio, dir_calle, dir_carrera, dir_numero, idCliente]
    );

    return res.json({ message: 'Información de contacto actualizada con éxito.' });

  } catch (error) {
    console.error('Error al actualizar perfil de cliente:', error);
    return res.status(500).json({ message: 'Error interno en el servidor al guardar cambios.' });
  }
};

// ==========================================
// CONTROLADOR CAMBIAR CONTRASEÑA
// ==========================================
exports.cambiarContrasena = async (req, res) => {
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
};