const db = require('../config/db');

exports.registrarIngreso = async (req, res) => {
  const { placaVehiculo, tipoVehiculo } = req.body; // 'Automovil', 'Motocicleta', etc.
  const horaIngreso = new Date();
  const fechaIngreso = horaIngreso.toISOString().split('T')[0];

  try {
    // Validar si el vehículo ya se encuentra dentro del parqueadero
    const [dentro] = await db.query('SELECT * FROM control_i_s WHERE placa_vehiculo = ? AND hora_salida IS NULL', [placaVehiculo]);
    if (dentro.length > 0) {
      return res.status(400).json({ message: 'El vehículo ya se encuentra dentro del parqueadero.' });
    }

    // Asegurar existencia del vehículo en la maestro de vehículos
    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaVehiculo]);

    // Buscar tarifa asociada al tipo de vehículo
    const [tarifa] = await db.query('SELECT id_tarifa FROM tarifas WHERE tipo_vehiculo = ?', [tipoVehiculo]);
    if (tarifa.length === 0) {
      return res.status(404).json({ message: 'Tipo de vehículo o tarifa no configurada.' });
    }

    const idTarifa = tarifa[0].id_tarifa;

    // Registrar en control de ingresos
    await db.query(
      'INSERT INTO control_i_s (placa_vehiculo, id_tarifa, hora_ingreso, fecha_ingreso) VALUES (?, ?, ?, ?)',
      [placaVehiculo, idTarifa, horaIngreso, fechaIngreso]
    );

    res.status(201).json({ message: 'Ingreso registrado de manera exitosa.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el ingreso vehicular.' });
  }
};

exports.registrarSalida = async (req, res) => {
  const { placaVehiculo, metodoPago } = req.body; // Efectivo, Transferencia, QR
  const horaSalida = new Date();
  const fechaSalida = horaSalida.toISOString().split('T')[0];

  try {
    // Buscar registro de ingreso activo
    const [registros] = await db.query(
      'SELECT c.*, t.valor_primera_hora, t.valor_hora_2_a_12 FROM control_i_s c JOIN tarifas t ON c.id_tarifa = t.id_tarifa WHERE c.placa_vehiculo = ? AND c.hora_salida IS NULL',
      [placaVehiculo]
    );

    if (registros.length === 0) {
      return res.status(404).json({ message: 'No se encontró un registro de ingreso activo para esta placa.' });
    }

    const registro = registros[0];
    const diffMs = horaSalida - new Date(registro.hora_ingreso);
    const diffMinutos = Math.max(1, Math.round(diffMs / 60000));

    // Verificar si cuenta con mensualidad activa vigente
    const [mensualidad] = await db.query(
      'SELECT id_mensualidad FROM mensualidades WHERE placa_vehiculo = ? AND fecha_final >= ?',
      [placaVehiculo, fechaSalida]
    );

    let totalAPagar = 0.00;

    // Si no tiene mensualidad, se realiza el cálculo correspondiente por rango de horas
    if (mensualidad.length === 0) {
      const horasACobrar = Math.ceil(diffMinutos / 60);
      if (horasACobrar <= 1) {
        totalAPagar = parseFloat(registro.valor_primera_hora);
      } else {
        totalAPagar = parseFloat(registro.valor_primera_hora) + (parseFloat(registro.valor_hora_2_a_12) * (horasACobrar - 1));
      }
    }

    // Actualizar registro de control
    await db.query(
      'UPDATE control_i_s SET hora_salida = ?, fecha_salida = ?, calculo_tarifa = ? WHERE id_control_i_s = ?',
      [horaSalida, fechaSalida, totalAPagar, registro.id_control_i_s]
    );

    // Registrar pago efectuado si el valor supera cero
    if (totalAPagar > 0) {
      await db.query('INSERT INTO pagos (id_control_i_s, metodo_pago) VALUES (?, ?)', [registro.id_control_i_s, metodoPago || 'Efectivo']);
    }

    res.json({
      message: 'Salida procesada correctamente.',
      datos: {
        placa: placaVehiculo,
        tiempoMinutos: diffMinutos,
        totalCobrado: totalAPagar,
        observacion: mensualidad.length > 0 ? 'Exento por Plan Mensual Activo' : 'Liquidación Estándar'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al liquidar la salida del vehículo.' });
  }
};

exports.listarVehiculosDentro = async (req, res) => {
  try {
    const [vehiculos] = await db.query(`
      SELECT c.placa_vehiculo, t.tipo_vehiculo, c.hora_ingreso, 
             TIMESTAMPDIFF(MINUTE, c.hora_ingreso, NOW()) AS minutos_transcurridos
      FROM control_i_s c
      JOIN tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.hora_salida IS NULL
      ORDER BY c.hora_ingreso DESC
    `);
    res.json(vehiculos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener vehículos activos.' });
  }
};