import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    identificacion: '',
    correo: '',
    telefono: '',
    calle: '',
    carrera: '',
    numero: '',
    barrio: '',
    placaVehiculo: '',
    contrasena: '',
    confirmarContrasena: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // VALIDACIÓN EN TIEMPO REAL: Identificación solo números y máximo 10 dígitos
    if (name === 'identificacion') {
      const soloNumeros = value.replace(/\D/g, ''); 
      if (soloNumeros.length <= 10) {
        setFormData({ ...formData, [name]: soloNumeros });
      }
      return;
    }

    // VALIDACIÓN EN TIEMPO REAL: Teléfono solo números y máximo 10 dígitos
    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setFormData({ ...formData, [name]: soloNumeros });
      }
      return;
    }

    // Cambios normales para los demás campos
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar contraseñas idénticas en el cliente
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Validar longitud mínima de identificación
    if (formData.identificacion.length < 5) {
      setError('La identificación debe tener al menos 5 dígitos.');
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // Envía los campos individuales que el backend espera
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        setSuccess(datos.message || 'Registro exitoso.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(datos.message || 'Error al registrar la cuenta.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.logoIcon}>
          <span>▲</span>
        </div>
        <h2>Registro de Cliente</h2>
        <p className={styles.subtitle}>Activa tu plan mensual de parqueadero</p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          {/* Fila 1 */}
          <div className={styles.inputGroup}>
            <label>Nombre Completo</label>
            <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label>Identificación (Máx 10 dígitos)</label>
            <input type="text" name="identificacion" value={formData.identificacion} onChange={handleChange} placeholder="Ej: 12345678" required />
          </div>

          {/* Fila 2 */}
          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="correo@ejemplo.com" required />
          </div>

          <div className={styles.inputGroup}>
            <label>Teléfono Celular</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 3151234567" required />
          </div>

          {/* Fila 3: Dirección Desglosada (Campos compuestos) */}
          {/* Fila de Dirección Desglosada con especificación clara */}
<div className={`${styles.inputGroup} ${styles.fullWidth}`}>
  <label>Dirección de Residencia</label>
  <div className={styles.direccionGrid}>
    <div className={styles.subInputContainer}>
      <span className={styles.inputLabelHint}>Calle / Av</span>
      <input type="text" name="calle" value={formData.calle} onChange={handleChange} placeholder="Ej: 12" required />
    </div>
    <div className={styles.subInputContainer}>
      <span className={styles.inputLabelHint}>Carrera</span>
      <input type="text" name="carrera" value={formData.carrera} onChange={handleChange} placeholder="Ej: 23" required />
    </div>
    <div className={styles.subInputContainer}>
      <span className={styles.inputLabelHint}>Número</span>
      <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ej: 2" required />
    </div>
    <div className={styles.subInputContainer}>
      <span className={styles.inputLabelHint}>Barrio</span>
      <input type="text" name="barrio" value={formData.barrio} onChange={handleChange} placeholder="Ej: Olímpico" required />
    </div>
  </div>
</div>

          {/* Fila 4 */}
          <div className={styles.inputGroup}>
            <label>Placa del Vehículo</label>
            <input type="text" name="placaVehiculo" value={formData.placaVehiculo} onChange={handleChange} placeholder="Ej: ABC123" required />
          </div>

          <div className={styles.spacer}></div>

          {/* Fila 5 */}
          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} placeholder="••••••••" required />
          </div>

          <div className={styles.inputGroup}>
            <label>Confirmar Contraseña</label>
            <input type="password" name="confirmarContrasena" value={formData.confirmarContrasena} onChange={handleChange} placeholder="••••••••" required />
          </div>

          {/* Acciones */}
          <div className={`${styles.formActions} ${styles.fullWidth}`}>
            <button type="button" className={styles.btnVolver} onClick={() => navigate('/login')}>
              Volver
            </button>
            <button type="submit" className={styles.btnRegistrar}>
              Registrar Cuenta
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;