const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jwt-simple');

const authMiddlewareObj = require('../middlewares/authMiddleware');
const verifToken = authMiddlewareObj.verificarToken;

const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-2666026075230997-052508-8ac9febd57b8bff50c507b7b5fa9deb5-3425962506' 
});

// ==========================================
// CONTROLADOR INTEGRADO DE LOGIN
// ==========================================
const loginManejador = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM clientes WHERE correo = ?', [correo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Credenciales inválidas o usuario no encontrado.' });
    }

    const cliente = rows[0];
    const passwordMatch = await bcrypt.compare(contrasena, cliente.contrasena);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const rolUsuario = 'Cliente';

    const payload = { 
      id: cliente.id_cliente, 
      correo: cliente.correo,
      rol: rolUsuario 
    };
    
    const token = jwt.encode(payload, 'TU_FIRMA_SECRETA_JWT_AQUÍ');

    return res.json({
      message: 'Ingreso exitoso',
      token,
      rol: rolUsuario, 
      user: {
        id: cliente.id_cliente,
        nombre: cliente.nombre_cliente,
        correo: cliente.correo,
        rol: rolUsuario
      },
      cliente: {
        id: cliente.id_cliente,
        nombre: cliente.nombre_cliente,
        correo: cliente.correo,
        rol: rolUsuario
      }
    });

  } catch (error) {
    console.error('Error en el endpoint de login:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

router.post('/login', loginManejador);
router.post('/auth/login', loginManejador);
router.post('/api/auth/login', loginManejador);

// ==========================================
// CONTROLADOR INTEGRADO DE REGISTRO
// ==========================================
const registroManejador = async (req, res) => {
  const nombreFinal = req.body.nombre_cliente || req.body.nombreCompleto || req.body.nombre || null;
  const identificacion = req.body.identificacion || null;
  const correo = req.body.correo || req.body.correoElectronico || null;
  const telefono = req.body.telefono || req.body.telefonoCelular || null;
  const contrasena = req.body.contrasena || null;
  const placa_vehiculo = req.body.placa_vehiculo || req.body.placa || req.body.placaVehiculo || null;

  const dir_barrio = req.body.dir_barrio || req.body.barrio || null;
  const dir_calle = req.body.dir_calle || req.body.calle_av || req.body.calle || null;
  const dir_carrera = req.body.dir_carrera || req.body.carrera || null;
  const dir_numero = req.body.dir_numero || req.body.numero || null;

  if (!correo || !contrasena) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos obligatoriamente.' });
  }

  try {
    const [existe] = await db.query('SELECT id_cliente FROM clientes WHERE correo = ?', [correo]);
    if (existe.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya se encuentra registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash(contrasena, salt);

    let placaFormateada = null;
    if (placa_vehiculo) {
      placaFormateada = placa_vehiculo.trim().toUpperCase().substring(0, 10);
      await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaFormateada]);
    }

    const [resultado] = await db.query(
      `INSERT INTO clientes (
        nombre_cliente, identificacion, correo, telefono_numero, 
        dir_barrio, dir_calle, dir_carrera, dir_numero, 
        contrasena, placa_vehiculo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombreFinal, identificacion, correo, telefono, dir_barrio, dir_calle, dir_carrera, dir_numero, hashContrasena, placaFormateada]
    );
    
    const nuevoIdCliente = resultado.insertId;
    
    if (placaFormateada) {
      await db.query(
        `INSERT INTO mensualidades (id_cliente, placa_vehiculo, id_usuario, fecha_inicio, fecha_final) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [nuevoIdCliente, placaFormateada]
      );
    }

    return res.status(201).json({ message: 'Usuario registrado con éxito.', id: nuevoIdCliente });

  } catch (error) {
    console.error('Error crítico en el endpoint de registro:', error);
    return res.status(500).json({ message: 'Error interno en el servidor al registrar cuenta.' });
  }
};

router.post('/registro', registroManejador);
router.post('/auth/registro', registroManejador);
router.post('/api/auth/registro', registroManejador);

router.post('/register', registroManejador);
router.post('/auth/register', registroManejador);
router.post('/api/auth/register', registroManejador);

// ==========================================
// CONTROLADOR INTEGRADO DE PERFIL (GET)
// ==========================================
const obtenerPerfilManejador = async (req, res) => {
  const idCliente = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        id_cliente,
        nombre_cliente, nombre_cliente AS nombre, nombre_cliente AS nombreCompleto, nombre_cliente AS nombre_completo,
        correo, correo AS email, correo AS correoElectronico, correo AS correo_electronico,
        telefono_numero AS telefono, telefono_numero AS celular, telefono_numero AS telefonoCelular, telefono_numero AS telefono_celular,
        identificacion, identificacion AS cedula,
        dir_barrio, dir_barrio AS barrio,
        dir_calle, dir_calle AS calle_av, dir_calle AS calle,
        dir_carrera, dir_carrera AS carrera,
        dir_numero, dir_numero AS numero,
        placa_vehiculo
       FROM clientes WHERE id_cliente = ?`,
      [idCliente]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado en el sistema.' });
    }

    const infoCliente = rows[0];
    const placaFinal = infoCliente.placa_vehiculo || "";
    
    infoCliente.placa_vehiculo = placaFinal;
    infoCliente.placa = placaFinal;
    infoCliente.placaVehiculo = placaFinal;
    infoCliente.rol = 'Cliente';

    return res.json(infoCliente);

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ message: 'Error al traer los datos de perfil.' });
  }
};

router.get('/perfil-cliente', verifToken, obtenerPerfilManejador);
router.get('/auth/perfil-cliente', verifToken, obtenerPerfilManejador);
router.get('/api/auth/perfil-cliente', verifToken, obtenerPerfilManejador);

router.get('/perfil', verifToken, obtenerPerfilManejador);
router.get('/auth/perfil', verifToken, obtenerPerfilManejador);
router.get('/api/auth/perfil', verifToken, obtenerPerfilManejador);

// ==========================================
// CONTROLADOR INTEGRADO DE ACTUALIZACIÓN (PUT)
// ==========================================
const actualizarPerfilManejador = async (req, res) => {
  const idCliente = req.user.id;

  const correo = req.body.correo || req.body.email || req.body.correoElectronico || null;
  const telefono = req.body.telefono || req.body.celular || req.body.telefonoCelular || null;
  
  const dir_barrio = req.body.dir_barrio || req.body.barrio || null;
  const dir_calle = req.body.dir_calle || req.body.calle_av || req.body.calle || null;
  const dir_carrera = req.body.dir_carrera || req.body.carrera || null;
  const dir_numero = req.body.dir_numero || req.body.numero || null;
  
  const placa_vehiculo = req.body.placa_vehiculo || req.body.placa || req.body.placaVehiculo || null;
  const identificacion = req.body.identificacion || req.body.cedula || null;

  if (!correo) {
    return res.status(400).json({ message: 'El correo electrónico es un campo obligatorio.' });
  }

  try {
    const [usuarioActual] = await db.query(
      'SELECT nombre_cliente, identificacion FROM clientes WHERE id_cliente = ?',
      [idCliente]
    );

    if (usuarioActual.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    const nombre_cliente = req.body.nombre_cliente || req.body.nombreCompleto || req.body.nombre || usuarioActual[0].nombre_cliente;
    const identificacionFinal = identificacion || usuarioActual[0].identificacion;

    let placaFormateada = null;
    if (placa_vehiculo) {
      placaFormateada = placa_vehiculo.trim().toUpperCase().substring(0, 10);
      await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaFormateada]);
    }

    await db.query(
      `UPDATE clientes SET 
        nombre_cliente = ?, 
        identificacion = ?, 
        correo = ?, 
        telefono_numero = ?, 
        dir_barrio = ?, 
        dir_calle = ?, 
        dir_carrera = ?, 
        dir_numero = ?,
        placa_vehiculo = ?
       WHERE id_cliente = ?`,
      [nombre_cliente, identificacionFinal, correo, telefono, dir_barrio, dir_calle, dir_carrera, dir_numero, placaFormateada, idCliente]
    );

    if (placaFormateada) {
      const [tieneMensualidad] = await db.query(
        'SELECT id_mensualidad FROM mensualidades WHERE id_cliente = ? LIMIT 1',
        [idCliente]
      );

      if (tieneMensualidad.length > 0) {
        await db.query(
          `UPDATE mensualidades SET placa_vehiculo = ? 
           WHERE id_cliente = ? ORDER BY id_mensualidad DESC LIMIT 1`,
          [placaFormateada, idCliente]
        );
      } else {
        await db.query(
          `INSERT INTO mensualidades (id_cliente, placa_vehiculo, id_usuario, fecha_inicio, fecha_final) 
           VALUES (?, ?, 1, NOW(), NOW())`,
          [idCliente, placaFormateada]
        );
      }
    }

    return res.json({ message: 'Información de perfil actualizada correctamente.' });

  } catch (error) {
    console.error('Error al actualizar perfil de cliente:', error);
    return res.status(500).json({ message: 'Error interno en el servidor al guardar cambios.' });
  }
};

router.put('/actualizar-perfil', verifToken, actualizarPerfilManejador);
router.put('/auth/actualizar-perfil', verifToken, actualizarPerfilManejador);
router.put('/api/auth/actualizar-perfil', verifToken, actualizarPerfilManejador);

router.put('/perfil', verifToken, actualizarPerfilManejador);
router.put('/auth/perfil', verifToken, actualizarPerfilManejador);
router.put('/api/auth/perfil', verifToken, actualizarPerfilManejador);

// ==========================================
// CONTROLADOR INTEGRADO DE CONTRASEÑA (PUT)
// ==========================================
const cambiarPasswordManejador = async (req, res) => {
  const idCliente = req.user.id;
  const nuevaContrasena = req.body.password || req.body.contrasena || req.body.nuevaContrasena || null;

  if (!nuevaContrasena) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashNuevaContrasena = await bcrypt.hash(nuevaContrasena, salt);

    const [resultado] = await db.query(
      'UPDATE clientes SET contrasena = ? WHERE id_cliente = ?',
      [hashNuevaContrasena, idCliente]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró el registro del cliente para actualizar.' });
    }

    return res.json({ message: 'Contraseña actualizada con éxito en el ecosistema.' });

  } catch (error) {
    console.error('Error crítico al cambiar la contraseña del cliente:', error);
    return res.status(500).json({ message: 'Error interno del servidor al procesar el cambio de contraseña.' });
  }
};

router.put('/cambiar-password', verifToken, cambiarPasswordManejador);
router.put('/auth/cambiar-password', verifToken, cambiarPasswordManejador);
router.put('/api/auth/cambiar-password', verifToken, cambiarPasswordManejador);

router.put('/cambiar-contrasena', verifToken, cambiarPasswordManejador);
router.put('/auth/cambiar-contrasena', verifToken, cambiarPasswordManejador);
router.put('/api/auth/cambiar-contrasena', verifToken, cambiarPasswordManejador);

// ==========================================
// CONTROLADOR INTEGRADO DE DASHBOARD
// ==========================================
const dashboardManejador = async (req, res) => {
  const idCliente = req.user.id;

  try {
    const [planRows] = await db.query(
      `SELECT fecha_final FROM mensualidades 
       WHERE id_cliente = ? AND fecha_final >= NOW() 
       ORDER BY id_mensualidad DESC LIMIT 1`,
      [idCliente]
    );

    const [clienteRows] = await db.query(
      `SELECT placa_vehiculo FROM clientes WHERE id_cliente = ?`,
      [idCliente]
    );

    const placaFinal = (clienteRows && clienteRows.length > 0 && clienteRows[0].placa_vehiculo) 
      ? clienteRows[0].placa_vehiculo 
      : "No Registrada";

    if (planRows && planRows.length > 0) {
      const hoy = new Date();
      const vencimiento = new Date(planRows[0].fecha_final);
      const diferenciaTiempo = vencimiento.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

      return res.json({
        planActual: 'Plan Premium',
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
        placaVehiculo: placaFinal,
        activoHasta: planRows[0].fecha_final
      });
    } else {
      return res.json({
        planActual: 'NINGUNO',
        diasRestantes: 0,
        placaVehiculo: placaFinal,
        activoHasta: 'N/A'
      });
    }
  } catch (error) {
    console.error('Error en /dashboard-estado:', error);
    return res.status(500).json({ message: 'Error al obtener estado del servidor.' });
  }
};

router.get('/dashboard-estado', verifToken, dashboardManejador);
router.get('/auth/dashboard-estado', verifToken, dashboardManejador);
router.get('/api/auth/dashboard-estado', verifToken, dashboardManejador);

// ==========================================
// CONTROLADOR INTEGRADO DE MI PLAN
// ==========================================
const miPlanManejador = async (req, res) => {
  const idCliente = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT fecha_inicio, fecha_final FROM mensualidades 
       WHERE id_cliente = ? AND fecha_final >= NOW() 
       ORDER BY id_mensualidad DESC LIMIT 1`,
      [idCliente]
    );

    if (rows.length > 0) {
      res.json({ tienePlan: true, fecha_inicio: rows[0].fecha_inicio, fecha_final: rows[0].fecha_final });
    } else {
      res.json({ tienePlan: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

router.get('/mi-plan-estado', verifToken, miPlanManejador);
router.get('/auth/mi-plan-estado', verifToken, miPlanManejador);
router.get('/api/auth/mi-plan-estado', verifToken, miPlanManejador);

// ==========================================
// SOLICITUD DE PREFERENCIA MP
// ==========================================
router.post('/comprar-plan-mensual', verifToken, async (req, res) => {
  const idCliente = req.user.id;

  try {
    const [clienteRows] = await db.query(
      'SELECT nombre_cliente, correo, placa_vehiculo FROM clientes WHERE id_cliente = ?', 
      [idCliente]
    );
    
    if (clienteRows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    
    const cliente = clienteRows[0];
    let placaReal = cliente.placa_vehiculo ? cliente.placa_vehiculo : 'ABC123_M';

    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaReal]);

    const partesNombre = cliente.nombre_cliente.trim().split(/\s+/);
    const primerNombre = partesNombre[0] || 'Cliente';
    const apellido = partesNombre.slice(1).join(' ') || 'AeroParking';

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: 'plan-mensual-01',
            title: 'Plan Mensual AeroParking',
            quantity: 1,
            unit_price: 180000, 
            currency_id: 'COP'
          }
        ],
        payer: {
          name: primerNombre,
          surname: apellido,
          email: cliente.correo,
        },
        payment_methods: {
          included_payment_types: [{ id: 'bank_transfer' }],
          installments: 1
        },
        back_urls: {
          success: 'http://localhost:3000/mi-plan?payment=success',
          failure: 'http://localhost:3000/mi-plan?payment=failure',
          pending: 'http://localhost:3000/mi-plan?payment=pending'
        }
      }
    });

    if (response && response.init_point) {
      return res.json({ urlPago: response.init_point });
    } else {
      throw new Error('La respuesta de Mercado Pago no generó la propiedad init_point.');
    }

  } catch (error) {
    console.error('Error detallado al generar preferencia MP:', error);
    res.status(500).json({ message: 'No se pudo generar el canal de pago PSE real.', error: error.message });
  }
});

module.exports = router;