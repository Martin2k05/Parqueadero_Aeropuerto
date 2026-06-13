const db = require('../config/db');

exports.getOperarioAdminDashboard = async (req, res) => {
  try {
    const totalCuposConstante = 100;

    const [[{ ocupados }]] = await db.query('SELECT COUNT(*) AS ocupados FROM control_i_s WHERE hora_salida IS NULL');
    const disponibles = Math.max(0, totalCuposConstante - ocupados);
    const [[{ ingresosHoy }]] = await db.query('SELECT COUNT(*) AS ingresosHoy FROM control_i_s WHERE fecha_ingreso = CURDATE()');
    const [[{ clientesActivos }]] = await db.query('SELECT COUNT(DISTINCT id_cliente) AS clientesActivos FROM mensualidades WHERE fecha_final >= CURDATE()');
    const [[{ planesPorVencer }]] = await db.query('SELECT COUNT(*) AS planesPorVencer FROM mensualidades WHERE fecha_final BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)');

    const [actividadReciente] = await db.query(`
      SELECT placa_vehiculo, CONCAT(fecha_ingreso, ' ', TIME(hora_ingreso)) AS fecha_formateada 
      FROM control_i_s WHERE hora_salida IS NULL ORDER BY hora_ingreso DESC LIMIT 3
    `);

    const ocupacionPorHora = [
      { hora: '06:00', vehiculos: 15 }, { hora: '09:00', vehiculos: 45 }, { hora: '12:00', vehiculos: 70 },
      { hora: '15:00', vehiculos: 52 }, { hora: '18:00', vehiculos: 75 }, { hora: '21:00', vehiculos: 38 }
    ];

    const ingresosSemanales = [
      { dia: 'Lun', ingresos: 240 }, { dia: 'Mar', ingresos: 310 }, { dia: 'Mié', ingresos: 285 },
      { dia: 'Jue', ingresos: 330 }, { dia: 'Vie', ingresos: 410 }, { dia: 'Sáb', ingresos: 380 }, { dia: 'Dom', ingresos: 295 }
    ];

    res.json({
      metricas: { totalCupos: totalCuposConstante, ocupados, disponibles, ingresosHoy, clientesActivos, planesPorVencer },
      ocupacionPorHora, ingresosSemanales, actividadReciente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error recopilando analíticas del dashboard.' });
  }
};

// ==========================================
// CLIENTE DASHBOARD - CONTROLADO 200 OK
// ==========================================
exports.getClienteDashboard = async (req, res) => {
  const idCliente = req.user.id;

  try {
    // 1. Buscamos de emergencia la placa nativa registrada en su cuenta de cliente
    const [clienteFila] = await db.query(
      'SELECT placa_vehiculo FROM clientes WHERE id_cliente = ?',
      [idCliente]
    );
    
    let placaBaseDeDatos = 'No Registrada';
    if (clienteFila.length > 0 && clienteFila[0].placa_vehiculo) {
      const placaLimpia = clienteFila[0].placa_vehiculo.toString().trim();
      if (placaLimpia !== 'NULL' && placaLimpia !== 'null' && placaLimpia !== '') {
        placaBaseDeDatos = placaLimpia;
      }
    }

    // 2. Consultar si tiene compras/mensualidades reales
    const [plan] = await db.query(
      'SELECT m.*, DATEDIFF(m.fecha_final, CURDATE()) AS dias_restantes FROM mensualidades m WHERE m.id_cliente = ? ORDER BY m.id_mensualidad DESC LIMIT 1',
      [idCliente]
    );

    // Si el cliente es nuevo y NUNCA ha comprado una mensualidad:
    if (plan.length === 0) {
      return res.status(200).json({
        planActual: 'NINGUNO',
        diasRestantes: 0,
        placaVehiculo: placaBaseDeDatos, // 👈 Ahora sí devuelve su placa real registrada
        validoHasta: 'N/A'
      });
    }

    const infoPlan = plan[0];
    const diasRestantesCalculados = infoPlan.dias_restantes ? Math.max(0, infoPlan.dias_restantes) : 0;
    const esVigente = diasRestantesCalculados > 0;

    // Si hay mensualidad, priorizamos la placa del plan; si no viene ahí, usamos la nativa del cliente
    let placaRespuesta = infoPlan.placa_vehiculo || placaBaseDeDatos;
    if (placaRespuesta === 'NULL' || placaRespuesta === 'null' || placaRespuesta.toString().trim() === '') {
      placaRespuesta = placaBaseDeDatos;
    }

    return res.status(200).json({
      planActual: esVigente ? 'PREMIUM' : 'NINGUNO',
      diasRestantes: diasRestantesCalculados,
      placaVehiculo: placaRespuesta, // 👈 Envío blindado de datos reales
      validoHasta: esVigente && infoPlan.fecha_final ? infoPlan.fecha_final : 'N/A'
    });

  } catch (error) {
    console.error('Error al consultar información del cliente:', error);
    return res.status(500).json({ message: 'Error al consultar información del cliente.' });
  }
};

exports.getPerfilCliente = async (req, res) => {
  const idCliente = req.user.id;
  try {
    // 🕵️‍♂️ CORREGIDO: Añadimos 'placa_vehiculo' al SELECT de la tabla clientes
    const [data] = await db.query(
      `SELECT 
        id_cliente, 
        nombre_cliente, 
        correo, 
        identificacion, 
        telefono, 
        dir_calle, 
        dir_carrera, 
        dir_numero, 
        dir_barrio,
        placa_vehiculo
       FROM clientes WHERE id_cliente = ?`, 
      [idCliente]
    );
    
    if (data.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    const cliente = data[0];

    // Buscamos si de pronto tiene una placa registrada en mensualidades
    const [vehiculos] = await db.query(
      'SELECT placa_vehiculo FROM mensualidades WHERE id_cliente = ? ORDER BY id_mensualidad DESC LIMIT 1', 
      [idCliente]
    );
    
    // Evaluamos de forma segura cuál placa usar y limpiamos valores nulos
    let placaFinal = 'Sin Placa';
    
    if (vehiculos.length > 0 && vehiculos[0].placa_vehiculo) {
      placaFinal = vehiculos[0].placa_vehiculo.toString().trim();
    } else if (cliente.placa_vehiculo) {
      placaFinal = cliente.placa_vehiculo.toString().trim();
    }

    if (placaFinal === 'NULL' || placaFinal === 'null' || placaFinal === '') {
      placaFinal = 'Sin Placa';
    }
    
    // 🚀 ENVIAMOS EL JSON COMPLETO AL FRONTEND
    res.json({
      nombre_cliente: cliente.nombre_cliente,
      correo: cliente.correo,
      identificacion: cliente.identificacion,
      telefono: cliente.telefono || '',
      dir_calle: cliente.dir_calle || '',
      dir_carrera: cliente.dir_carrera || '',
      dir_numero: cliente.dir_numero || '',
      dir_barrio: cliente.dir_barrio || '',
      placa_vehiculo: placaFinal
    });

  } catch (error) {
    console.error('Error al obtener perfil del cliente:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};