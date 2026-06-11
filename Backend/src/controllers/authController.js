const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// CONTROLADOR DE LOGIN INTEGRADO Y ESCALABLE
// ==========================================
exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    console.log('=== INTENTO DE LOGIN ===');
    console.log('Correo recibido:', correo);

    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
    }

    let usuarioEncontrado = null;
    let rolUsuario = '';
    let idRef = null;
    let placaDetectada = 'Sin Placa';

    // 1. Buscar en la tabla de usuarios internos (Admin / Operario)
    const [users] = await db.query(
      'SELECT u.*, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.correo = ?',
      [correo]
    );
    
    if (users.length > 0) {
      usuarioEncontrado = users[0];
      rolUsuario = usuarioEncontrado.nombre_rol;
      idRef = usuarioEncontrado.id_usuario;
      console.log(`👤 Usuario interno detectado con rol: ${rolUsuario}`);
    } 
    // 2. Si no es un usuario interno, buscar en la tabla de clientes
    else {
      console.log('🔍 No se encontró en usuarios. Buscando en tabla clientes...');
      const [clients] = await db.query('SELECT * FROM clientes WHERE correo = ? ORDER BY id_cliente DESC LIMIT 1', [correo]);
      
      if (clients.length > 0) {
        usuarioEncontrado = clients[0];
        rolUsuario = 'Cliente';
        idRef = usuarioEncontrado.id_cliente;
        console.log('🚗 Cliente detectado en la base de datos.');

        // Extraer placa del cliente de forma segura
        if (usuarioEncontrado.placa_vehiculo && usuarioEncontrado.placa_vehiculo !== "NULL" && usuarioEncontrado.placa_vehiculo !== "null") {
          placaDetectada = usuarioEncontrado.placa_vehiculo;
        } else {
          // Buscar de emergencia en mensualidades
          const [vehiculoRows] = await db.query(
            'SELECT placa_vehiculo FROM mensualidades WHERE id_cliente = ? ORDER BY id_mensualidad DESC LIMIT 1', 
            [idRef]
          );
          if (vehiculoRows.length > 0 && vehiculoRows[0].placa_vehiculo) {
            placaDetectada = vehiculoRows[0].placa_vehiculo;
          }
        }
      }
    }

    if (!usuarioEncontrado) {
      return res.status(404).json({ message: 'Credenciales incorrectas o usuario no registrado.' });
    }

    // Validar contraseña
    const hashContrasena = usuarioEncontrado.contrasena;
    const passwordCorrect = await bcrypt.compare(contrasena, hashContrasena);
    
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ ERROR CRÍTICO: process.env.JWT_SECRET no está definido en el archivo .env');
      return res.status(500).json({ message: 'Error de configuración en el servidor.' });
    }

    const token = jwt.sign(
      { id: idRef, correo: usuarioEncontrado.correo, rol: rolUsuario },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`🚀 Login exitoso. Token generado para [${rolUsuario}] ID: ${idRef} con Placa: ${placaDetectada}`);

    res.json({
      token,
      user: {
        id: idRef,
        nombre: usuarioEncontrado.nombre_usuario || usuarioEncontrado.nombre_cliente,
        correo: usuarioEncontrado.correo,
        rol: rolUsuario,
        placa_vehiculo: placaDetectada 
      }
    });

  } catch (error) {
    console.error('❌ ERROR GENERAL EN LOGIN:', error);
    res.status(500).json({ message: 'Error interno del servidor en el inicio de sesión.', detail: error.message });
  }
};

// ==========================================
// CONTROLADOR INTEGRADO DE REGISTRO
// ==========================================
exports.registerCliente = async (req, res) => {
  const { nombreCompleto, identificacion, correo, telefono, calle, carrera, numero, barrio, contrasena } = req.body;
  const placa_vehiculo = req.body.placaVehiculo || req.body.placa_vehiculo || null;

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

    if (placa_vehiculo) {
      const placaFormateada = placa_vehiculo.trim().toUpperCase().substring(0, 10);
      await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaFormateada]);
    }

    await db.query(
      `INSERT INTO clientes (nombre_cliente, identificacion, correo, dir_barrio, dir_calle, dir_carrera, dir_numero, telefono, contrasena, placa_vehiculo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombreCompleto, identificacion, correo, barrio, calle, carrera, numero, telefono, hashContrasena, placa_vehiculo ? placa_vehiculo.trim().toUpperCase().substring(0, 10) : null]
    );

    res.status(201).json({ message: 'Registro exitoso. Ahora puedes iniciar sesión y comprar tu plan.' });
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
      `SELECT id_cliente, nombre_cliente, correo, telefono, identificacion, dir_barrio, dir_calle, dir_carrera, dir_numero, placa_vehiculo FROM clientes WHERE id_cliente = ?`,
      [idCliente]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado en el sistema.' });
    }

    const infoCliente = rows[0];
    let placaFinal = infoCliente.placa_vehiculo;

    // Control estricto de nulos para la placa
    if (!placaFinal || placaFinal === "NULL" || placaFinal === "null" || placaFinal === "") {
      const [vehiculoRows] = await db.query(
        `SELECT placa_vehiculo FROM mensualidades WHERE id_cliente = ? ORDER BY id_mensualidad DESC LIMIT 1`, 
        [idCliente]
      );
      placaFinal = (vehiculoRows.length > 0 && vehiculoRows[0].placa_vehiculo) ? vehiculoRows[0].placa_vehiculo : "Sin Placa";
    }
    
    // Asignamos la placa limpia antes de enviar el JSON
    infoCliente.placa_vehiculo = placaFinal;
    
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
    await db.query(
      `UPDATE clientes SET correo = ?, telefono = ?, dir_barrio = ?, dir_calle = ?, dir_carrera = ?, dir_numero = ? WHERE id_cliente = ?`,
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
  const actual = req.body.password || req.body.actual;
  const nueva = req.body.nuevaContrasena || req.body.nueva;
  
  const idUsuario = req.user.id;
  const rolUsuario = req.user.rol;

  if (!actual || !nueva) {
    return res.status(400).json({ message: 'La contraseña actual y la nueva son requeridas.' });
  }

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
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const contrasenaBD = rows[0].contrasena;
    const passwordCorrect = await bcrypt.compare(actual, contrasenaBD);
    if (!passwordCorrect) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });

    const salt = await bcrypt.genSalt(10);
    const hashNueva = await bcrypt.hash(nueva, salt);

    await db.query(queryActualizar, [hashNueva, idUsuario]);
    res.json({ message: '¡Contraseña modificada correctamente!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
  }
};