const db = require('../config/db');

// Obtener todos los clientes registrados
exports.obtenerClientes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_cliente, nombre_cliente, identificacion, correo, telefono, dir_barrio, dir_calle, dir_carrera, dir_numero, placa_vehiculo 
       FROM clientes 
       ORDER BY id_cliente DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return res.status(500).json({ message: 'Error interno al obtener el listado de clientes.' });
  }
};

// Eliminar un cliente por ID
exports.eliminarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    
    return res.json({ message: 'Cliente eliminado correctamente del sistema.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({ message: 'No se puede eliminar el cliente porque tiene registros asociados.' });
  }
};

// Obtener todos los reportes generados
exports.obtenerReportes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id_reporte, r.tipo_reporte, r.periodo_reporte, r.fecha_generado, u.nombre_usuario 
       FROM reportes r 
       JOIN usuarios u ON r.id_usuario = u.id_usuario 
       ORDER BY r.id_reporte DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return res.status(500).json({ message: 'Error interno al obtener el listado de reportes.' });
  }
};

// Crear/Registrar la generación de un nuevo reporte
exports.crearReporte = async (req, res) => {
  const idUsuario = req.user.id; 
  const { tipo_reporte, periodo_reporte } = req.body;

  if (!tipo_reporte || !periodo_reporte) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    await db.query(
      `INSERT INTO reportes (id_usuario, tipo_reporte, periodo_reporte) VALUES (?, ?, ?)`,
      [idUsuario, tipo_reporte, periodo_reporte]
    );
    return res.status(201).json({ message: 'Reporte generado y guardado correctamente.' });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    return res.status(500).json({ message: 'Error interno al procesar el reporte.' });
  }
};

// Obtener todas las tarifas registradas
exports.obtenerTarifas = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tarifas ORDER BY id_tarifa ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    return res.status(500).json({ message: 'Error interno al obtener las tarifas.' });
  }
};

// Actualizar los valores de una tarifa específica
exports.actualizarTarifa = async (req, res) => {
  const idUsuario = req.user.id;
  const { id } = req.params;
  const { 
    valor_primera_hora, 
    valor_hora_2_a_12, 
    valor_hora_13_a_168, 
    valor_hora_169_mas, 
    valor_mensualidad, 
    normativa 
  } = req.body;

  try {
    await db.query(
      `UPDATE tarifas 
       SET id_usuario = ?,
           valor_primera_hora = ?, 
           valor_hora_2_a_12 = ?, 
           valor_hora_13_a_168 = ?, 
           valor_hora_169_mas = ?, 
           valor_mensualidad = ?, 
           normativa = ?
       WHERE id_tarifa = ?`,
      [
        idUsuario, 
        valor_primera_hora, 
        valor_hora_2_a_12, 
        valor_hora_13_a_168, 
        valor_hora_169_mas, 
        valor_mensualidad, 
        normativa || 'Resolución Aeropuerto', 
        id
      ]
    );
    return res.json({ message: 'Tarifa configurada y actualizada con éxito.' });
  } catch (error) {
    console.error('Error al actualizar tarifa:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la tarifa.' });
  }
};

// Obtener métricas y estadísticas para el Dashboard
exports.obtenerMetricasDashboard = async (req, res) => {
  try {
    const totalCupos = 100;

    const [rowsOcupados] = await db.query(
      `SELECT COUNT(*) as ocupados FROM control_i_s WHERE hora_salida IS NULL`
    );
    const ocupados = rowsOcupados[0].ocupados;
    const disponibles = totalCupos - ocupados;

    const [rowsIngresosHoy] = await db.query(
      `SELECT COUNT(*) as ingresos_hoy FROM control_i_s WHERE fecha_ingreso = CURDATE()`
    );
    const ingresosHoy = rowsIngresosHoy[0].ingresos_hoy;

    const [rowsClientes] = await db.query(
      `SELECT COUNT(*) as total_clientes FROM clientes`
    );
    const clientesActivos = rowsClientes[0].total_clientes;

    const [actividadReciente] = await db.query(
      `SELECT placa_vehiculo, hora_ingreso, hora_salida 
       FROM control_i_s 
       ORDER BY hora_ingreso DESC LIMIT 5`
    );

    return res.json({
      metricas: {
        totalCupos,
        ocupados,
        disponibles,
        ingresosHoy,
        clientesActivos,
        planesPorVencer: 0 // Ajustar según tu lógica de mensualidades
      },
      actividadReciente
    });
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    return res.status(500).json({ message: 'Error interno al obtener métricas.' });
  }
};