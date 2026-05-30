const db = require('../config/db');

exports.getOperarioAdminDashboard = async (req, res) => {
  try {
    const totalCuposConstante = 100;

    const [[{ ocupados }]] = await db.query('SELECT COUNT(*) AS ocupados FROM control_i_s WHERE hora_salida IS NULL');
    const [[{ ingresosHoy }]] = await db.query('SELECT COUNT(*) AS ingresosHoy FROM control_i_s WHERE fecha_ingreso = CURDATE()');
    const [[{ clientesActivos }]] = await db.query('SELECT COUNT(*) AS clientesActivos FROM usuarios WHERE estado_plan = "Activo"');
    const [[{ planesPorVencer }]] = await db.query('SELECT COUNT(*) AS planesPorVencer FROM usuarios WHERE fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)');

    // Ocupación por hora (6, 9, 12, 15, 18, 21)
    const [ocupacionRaw] = await db.query('SELECT HOUR(hora_ingreso) as hora, COUNT(*) as vehiculos FROM control_i_s WHERE fecha_ingreso = CURDATE() GROUP BY HOUR(hora_ingreso)');
    const horasFijas = [6, 9, 12, 15, 18, 21];
    const ocupacionData = horasFijas.map(h => ({
      hora: h,
      vehiculos: ocupacionRaw.find(r => r.hora === h)?.vehiculos || 0
    }));

    // Ingresos Semanales (Lunes a Domingo)
    const [ingresosRaw] = await db.query('SELECT DAYNAME(fecha_salida) as dia, SUM(total_pagar) as total FROM control_i_s WHERE fecha_salida >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DAYNAME(fecha_salida)');
    const diasFijos = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const ingresosData = diasFijos.map(d => ({
      dia: d,
      total: ingresosRaw.find(r => r.dia === d)?.total || 0
    }));

    const [actividadReciente] = await db.query('SELECT placa_vehiculo, CASE WHEN hora_salida IS NULL THEN "Entrada" ELSE "Salida" END as tipo_movimiento, COALESCE(hora_salida, hora_ingreso) as hora_evento FROM control_i_s ORDER BY id_control_i_s DESC LIMIT 5');

    res.json({
      metricas: { totalCupos: totalCuposConstante, ocupados, disponibles: Math.max(0, totalCuposConstante - ocupados), ingresosHoy, clientesActivos, planesPorVencer },
      ocupacionData,
      ingresosData,
      actividadReciente
    });
  } catch (error) {
    console.error("Error en controller:", error);
    res.status(500).json({ message: 'Error interno' });
  }
};

exports.getClienteDashboard = async (req, res) => {
  res.json({ message: 'Dashboard cliente' });
};

exports.getPerfilCliente = async (req, res) => {
  res.json({ message: 'Perfil cliente' });
};