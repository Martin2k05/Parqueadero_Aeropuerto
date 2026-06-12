const db = require('../config/db');

exports.getOperarioAdminDashboard = async (req, res) => {
  try {
    const totalCuposConstante = 100;

    // 1. Ocupación y Flujo del día
    const [[{ ocupados }]] = await db.query('SELECT COUNT(*) AS ocupados FROM control_i_s WHERE hora_salida IS NULL');
    const [[{ ingresosHoy }]] = await db.query('SELECT COUNT(*) AS ingresosHoy FROM control_i_s WHERE fecha_ingreso = CURDATE()');

    // 2. CORREGIDO: Consulta de clientes activos y planes desde la tabla 'mensualidades'
    const [[{ clientesActivos }]] = await db.query('SELECT COUNT(DISTINCT id_cliente) AS clientesActivos FROM mensualidades WHERE fecha_final >= CURDATE()');
    const [[{ planesPorVencer }]] = await db.query(`SELECT COUNT(*) AS planesPorVencer FROM mensualidades WHERE fecha_final BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);

    // 3. Ocupación por hora (Mapeo seguro)
    const [ocupacionRaw] = await db.query('SELECT HOUR(hora_ingreso) as hora, COUNT(*) as vehiculos FROM control_i_s WHERE fecha_ingreso = CURDATE() GROUP BY HOUR(hora_ingreso)');
    const horasFijos = [6, 9, 12, 15, 18, 21];
    const ocupacionData = horasFijos.map(h => ({
      hora: h,
      vehiculos: ocupacionRaw.find(r => r.hora === h)?.vehiculos || 0
    }));

    // 4. Ingresos Semanales (Corregido con WEEKDAY para evitar errores de idioma)
    const [ingresosRaw] = await db.query('SELECT WEEKDAY(fecha_salida) as num_dia, SUM(calculo_tarifa) as total FROM control_i_s WHERE fecha_salida >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY WEEKDAY(fecha_salida)');
    
    const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const ingresosData = diasNombres.map((nombre, index) => ({
      dia: nombre,
      total: parseFloat(ingresosRaw.find(r => r.num_dia === index)?.total || 0)
    }));

    // 5. Actividad reciente
    const [actividadReciente] = await db.query('SELECT placa_vehiculo, CASE WHEN hora_salida IS NULL THEN "Entrada" ELSE "Salida" END as tipo_movimiento, COALESCE(hora_salida, hora_ingreso) as hora_evento FROM control_i_s ORDER BY id_control_i_s DESC LIMIT 5');

    res.json({
      metricas: { 
        totalCupos: totalCuposConstante, 
        ocupados, 
        disponibles: Math.max(0, totalCuposConstante - ocupados), 
        ingresosHoy, 
        clientesActivos, 
        planesPorVencer 
      },
      ocupacionData,
      ingresosData,
      actividadReciente
    });
  } catch (error) {
    console.error("Error en dashboardController:", error);
    res.status(500).json({ message: 'Error interno al cargar los datos del dashboard.' });
  }
};

exports.getClienteDashboard = async (req, res) => {
  res.json({ message: 'Dashboard cliente' });
};

exports.getPerfilCliente = async (req, res) => {
  res.json({ message: 'Perfil cliente' });
};