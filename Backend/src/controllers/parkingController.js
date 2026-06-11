const db = require('../config/db');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// --- REGISTRAR INGRESO ---
exports.registrarIngreso = async (req, res) => {
  const { placaVehiculo, tipoVehiculo } = req.body;
  const idUsuarioActivo = req.user ? req.user.id : null;

  try {
    const ident = placaVehiculo.toUpperCase().trim();
    
    // Validación de longitud según el tipo
    if (tipoVehiculo === 'Bicicleta') {
      if (ident.length < 10 || ident.length > 12) {
          return res.status(400).json({ message: 'El ID de bicicleta debe tener entre 10 y 12 caracteres.' });
      }
    } else {
      if (ident.length !== 6) {
          return res.status(400).json({ message: 'La placa debe tener 6 caracteres.' });
      }
    }

    // Validación de duplicados
    const [duplicados] = await db.query(
        'SELECT id_control_i_s FROM control_i_s WHERE placa_vehiculo = ? AND hora_salida IS NULL',
        [ident]
    );

    if (duplicados.length > 0) {
        return res.status(400).json({ message: 'Error: Este vehículo ya se encuentra dentro.' });
    }

    await db.query(
      'INSERT INTO control_i_s (placa_vehiculo, id_tarifa, id_usuario, hora_ingreso, fecha_ingreso) VALUES (?, (SELECT id_tarifa FROM tarifas WHERE tipo_vehiculo = ? LIMIT 1), ?, NOW(), CURDATE())',
      [ident, tipoVehiculo, idUsuarioActivo]
    );
    
    res.status(201).json({ message: 'Ingreso exitoso' });
  } catch (error) {
    console.error("ERROR EN INGRESO:", error);
    res.status(500).json({ message: 'Error interno al registrar ingreso' });
  }
};

// --- RECONOCIMIENTO DE PLACAS (ALPR) ---
exports.leerPlaca = [upload.single('foto'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No se recibió archivo" });

    try {
        const formData = new FormData();
        formData.append('upload', fs.createReadStream(req.file.path));

        const response = await axios.post('https://api.platerecognizer.com/v1/plate-reader/', formData, {
            headers: { 
                'Authorization': 'Token TU_TOKEN_DE_API',
                ...formData.getHeaders() 
            }
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (response.data.results && response.data.results.length > 0) {
            res.json({ placa: response.data.results[0].plate.toUpperCase() });
        } else {
            res.status(404).json({ message: "No se detectó ninguna placa." });
        }
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error API ALPR:", error.response?.data || error.message);
        res.status(500).json({ message: "Error al procesar la imagen con la IA" });
    }
}];

// --- REGISTRAR SALIDA ---
exports.registrarSalida = async (req, res) => {
  const { placaVehiculo } = req.body;
  try {
    const [rows] = await db.query(`
      SELECT c.id_control_i_s, t.tipo_vehiculo, TIMESTAMPDIFF(MINUTE, c.hora_ingreso, NOW()) as minutos
      FROM control_i_s c
      JOIN tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.placa_vehiculo = ? AND c.hora_salida IS NULL`, [placaVehiculo.toUpperCase().trim()]);

    if (rows.length === 0) return res.status(404).json({ message: 'Vehículo no encontrado o ya salió' });

    const v = rows[0];
    let total = 0;
    
    // Cálculo de tarifas
    if (v.tipo_vehiculo === 'Bicicleta') {
        total = 700;
    } else if (v.tipo_vehiculo === 'Motocicleta') {
        total = v.minutos <= 60 ? 2700 : 2700 + (Math.ceil((v.minutos - 60) / 60) * 1500);
    } else {
        total = v.minutos <= 60 ? 4300 : 4300 + (Math.ceil((v.minutos - 60) / 60) * 2600);
    }

    await db.query(
      'UPDATE control_i_s SET hora_salida = NOW(), fecha_salida = CURDATE(), calculo_tarifa = ? WHERE id_control_i_s = ?', 
      [total, v.id_control_i_s]
    );
    
    res.json({ message: `Salida registrada. Total: $${total.toLocaleString()}` });
  } catch (error) {
    console.error("ERROR EN SALIDA:", error);
    res.status(500).json({ message: 'Error al registrar salida' });
  }
};

// --- LISTAR VEHÍCULOS ---
exports.listarVehiculosDentro = async (req, res) => {
  try {
    const [vehiculos] = await db.query(`
      SELECT c.id_control_i_s, c.placa_vehiculo, t.tipo_vehiculo, 
             TIMESTAMPDIFF(MINUTE, c.hora_ingreso, NOW()) AS minutos_transcurridos
      FROM control_i_s c
      JOIN tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.hora_salida IS NULL
    `);
    res.json(vehiculos);
  } catch (error) {
    console.error("ERROR AL LISTAR:", error);
    res.status(500).json({ message: 'Error al listar vehículos' });
  }
};