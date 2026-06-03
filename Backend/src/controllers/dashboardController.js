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
    // 1. Consultar si tiene compras/mensualidades reales
    const [plan] = await db.query(
      'SELECT m.*, DATEDIFF(m.fecha_final, CURDATE()) AS dias_restantes FROM mensualidades m WHERE m.id_cliente = ? ORDER BY m.id_mensualidad DESC LIMIT 1',
      [idCliente]
    );

    // Si el cliente es nuevo y NUNCA ha pagado por Mercado Pago:
    if (plan.length === 0) {
      return res.status(200).json({
        planActual: 'NINGUNO',
        diasRestantes: 0,
        placaVehiculo: 'No Registrada', // Mostramos el texto del diseño pero con estado 200 exitoso
        validoHasta: 'N/A'
      });
    }

    const infoPlan = plan[0];
    const diasRestantesCalculados = infoPlan.dias_restantes ? Math.max(0, infoPlan.dias_restantes) : 0;
    const esVigente = diasRestantesCalculados > 0;

    return res.status(200).json({
      planActual: esVigente ? 'PREMIUM' : 'NINGUNO',
      diasRestantes: diasRestantesCalculados,
      placaVehiculo: infoPlan.placa_vehiculo || 'No Registrada',
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
    const [data] = await db.query('SELECT id_cliente, nombre_cliente, correo, identificacion FROM clientes WHERE id_cliente = ?', [idCliente]);
    const [vehiculos] = await db.query('SELECT placa_vehiculo FROM mensualidades WHERE id_cliente = ? ORDER BY id_mensualidad DESC LIMIT 1', [idCliente]);
    
    if (data.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json({
      nombre: data[0].nombre_cliente,
      correo: data[0].correo,
      identificacion: data[0].identificacion,
      placa: vehiculos.length > 0 ? vehiculos[0].placa_vehiculo : 'Sin Placa'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};