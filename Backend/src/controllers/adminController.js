const db = require('../config/db');

exports.actualizarTarifas = async (req, res) => {
  const { tipoVehiculo, v1, v2, v3, v4, v5 } = req.body;
  const idAdmin = req.user.id;

  try {
    // 1. Consultar valores previos para auditoría
    const [antigua] = await db.query('SELECT * FROM tarifas WHERE tipo_vehiculo = ?', [tipoVehiculo]);
    if (antigua.length === 0) return res.status(404).json({ message: 'Tarifa no localizada.' });

    const ant = antigua[0];

    // 2. Insertar rastro histórico de modificaciones en la tabla de auditoría
    await db.query(`
      INSERT INTO historial_tarifas (id_tarifa, id_usuario, tipo_vehiculo, ant_primera_hora, ant_hora_2_a_12, ant_hora_13_a_168, ant_hora_169_mas, ant_mensualidad, nue_primera_hora, nue_hora_2_a_12, nue_hora_13_a_168, nue_hora_169_mas, nue_mensualidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ant.id_tarifa, idAdmin, tipoVehiculo, ant.valor_primera_hora, ant.valor_hora_2_a_12, ant.valor_hora_13_a_168, ant.valor_hora_169_mas, ant.valor_mensualidad, v1, v2, v3, v4, v5]
    );

    // 3. Modificar la tarifa en vivo de operación
    await db.query(`
      UPDATE tarifas SET valor_primera_hora = ?, valor_hora_2_a_12 = ?, valor_hora_13_a_168 = ?, valor_hora_169_mas = ?, valor_mensualidad = ?, id_usuario = ?
      WHERE tipo_vehiculo = ?`,
      [v1, v2, v3, v4, v5, idAdmin, tipoVehiculo]
    );

    res.json({ message: 'Tarifas del aeropuerto actualizadas y registradas con éxito.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar matrices de tarifas.' });
  }
};

exports.obtenerReportes = async (req, res) => {
  try {
    const [reportes] = await db.query('SELECT * FROM reportes ORDER BY fecha_generado DESC');
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error listando los reportes.' });
  }
};