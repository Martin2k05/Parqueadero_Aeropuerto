import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import styles from './MiPerfil.module.css';

const MiPerfil = () => {
  const [editando, setEditando] = useState(false);
  
  // Estado con la información real de la BD
  const [perfil, setPerfil] = useState({
    nombre_cliente: '',
    identificacion: '',
    correo: '',
    telefono: '',
    dir_calle: '',
    dir_carrera: '',
    dir_numero: '',
    dir_barrio: '',
    placa_vehiculo: ''
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [alerta, setAlerta] = useState(null);

  const mostrarNotificacion = (mensaje, tipo) => {
    setAlerta({ mensaje, tipo });
  };

  // Cargar datos reales al montar el componente
  useEffect(() => {
    const cargarDatosPerfil = async () => {
      try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch('http://localhost:5000/api/auth/perfil-cliente', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
          setPerfil({
            nombre_cliente: datos.nombre_cliente || '',
            identificacion: datos.identificacion || '',
            correo: datos.correo || '',
            telefono: datos.telefono || '',
            dir_calle: datos.dir_calle || '',
            dir_carrera: datos.dir_carrera || '',
            dir_numero: datos.dir_numero || '',
            dir_barrio: datos.dir_barrio || '',
            placa_vehiculo: datos.placa_vehiculo || 'Sin Placa'
          });
        } else {
          mostrarNotificacion(datos.message || 'Error al cargar perfil.', 'error');
        }
      } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de conexión con el servidor.', 'error');
      }
    };

    cargarDatosPerfil();
  }, []);

  // Guardar cambios en el Backend (Solo correo, teléfono y dirección)
  const guardarCambiosPerfil = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/auth/actualizar-perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          correo: perfil.correo,
          telefono: perfil.telefono,
          dir_calle: perfil.dir_calle,
          dir_carrera: perfil.dir_carrera,
          dir_numero: perfil.dir_numero,
          dir_barrio: perfil.dir_barrio
        })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        mostrarNotificacion('Información de perfil actualizada con éxito.', 'success');
        setEditando(false);
      } else {
        mostrarNotificacion(datos.message || 'Error al actualizar.', 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validación en tiempo real para el teléfono celular en caso de que lo edite
    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setPerfil({ ...perfil, [name]: soloNumeros });
      }
      return;
    }
    setPerfil({ ...perfil, [name]: value });
  };

  const guardarContrasena = async (e) => {
    e.preventDefault();
    if (passwordForm.nueva !== passwordForm.confirmar) {
      mostrarNotificacion('La nueva contraseña y la confirmación no coinciden.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token'); 
      const respuesta = await fetch('http://localhost:5000/api/auth/cambiar-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Corrección del mapeo: Enviamos 'password' para que calce con el Backend
        body: JSON.stringify({ 
          actual: passwordForm.actual, 
          password: passwordForm.nueva 
        })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        mostrarNotificacion(datos.message || '¡Contraseña modificada correctamente!', 'success');
        setModalAbierto(false);
        setPasswordForm({ actual: '', nueva: '', confirmar: '' });
      } else {
        mostrarNotificacion(datos.message || 'Hubo un error al actualizar.', 'error');
      }
    } catch (error) {
      mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <div className={styles.notificationContainer}>
        {alerta && <Notification mensaje={alerta.mensaje} tipo={alerta.tipo} onClose={() => setAlerta(null)} />}
      </div>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Mi Perfil</h1>
            <p>Gestiona tu información personal en tiempo real</p>
          </div>
          <button 
            className={styles.btnEdit} 
            onClick={() => {
              if (editando) {
                guardarCambiosPerfil();
              } else {
                setEditando(true);
              }
            }}
          >
            {editando ? 'Guardar Cambios' : 'Editar Perfil'}
          </button>
        </header>

        <div className={styles.sectionsStack}>
          <section className={styles.card}>
            <h3>Información Personal</h3>
            <div className={styles.gridForm}>
              
              {/* CAMPO PROTEGIDO */}
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>👤</span>
                  <input type="text" value={perfil.nombre_cliente} readOnly className={styles.inputBloqueado} />
                </div>
              </div>

              {/* CAMPO EDITABLE */}
              <div className={styles.inputGroup}>
                <label>Correo Electrónico</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>✉️</span>
                  <input 
                    type="email" 
                    name="correo"
                    value={perfil.correo} 
                    onChange={handleInputChange}
                    readOnly={!editando} 
                    className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                  />
                </div>
              </div>

              {/* CAMPO EDITABLE */}
              <div className={styles.inputGroup}>
                <label>Teléfono Celular</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>📞</span>
                  <input 
                    type="text" 
                    name="telefono"
                    value={perfil.telefono} 
                    onChange={handleInputChange}
                    readOnly={!editando} 
                    className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                  />
                </div>
              </div>

              {/* CAMPO PROTEGIDO */}
              <div className={styles.inputGroup}>
                <label>Identificación</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>#</span>
                  <input type="text" value={perfil.identificacion} readOnly className={styles.inputBloqueado} />
                </div>
              </div>

              {/* CAMPO PROTEGIDO */}
              <div className={styles.inputGroup}>
                <label>Placa del Vehículo</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>🚗</span>
                  <input type="text" value={perfil.placa_vehiculo} readOnly className={styles.inputBloqueado} />
                </div>
              </div>

              {/* CAMPOS EDITABLES: Dirección Desglosada con especificación clara */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Dirección de Residencia</label>
                <div className={styles.direccionGrid}>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Calle / Av</span>
                    <input 
                      type="text" 
                      name="dir_calle" 
                      value={perfil.dir_calle} 
                      onChange={handleInputChange} 
                      placeholder="Calle / Av" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Carrera</span>
                    <input 
                      type="text" 
                      name="dir_carrera" 
                      value={perfil.dir_carrera} 
                      onChange={handleInputChange} 
                      placeholder="Carrera" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Número</span>
                    <input 
                      type="text" 
                      name="dir_numero" 
                      value={perfil.dir_numero} 
                      onChange={handleInputChange} 
                      placeholder="Número" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Barrio</span>
                    <input 
                      type="text" 
                      name="dir_barrio" 
                      value={perfil.dir_barrio} 
                      onChange={handleInputChange} 
                      placeholder="Barrio" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          <section className={styles.card}>
            <h3>Seguridad</h3>
            <button className={styles.btnPrimary} onClick={() => setModalAbierto(true)}>
              Cambiar Contraseña
            </button>
          </section>
        </div>
      </main>

      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Modificar Contraseña</h3>
              <button className={styles.btnCloseX} onClick={() => setModalAbierto(false)}>×</button>
            </div>
            <form onSubmit={guardarContrasena} className={styles.modalForm}>
              <div className={styles.inputGroup}><label>Contraseña Actual</label><div className={styles.inputWrapper}><span className={styles.inputIcon}>🔒</span><input type="password" name="actual" value={passwordForm.actual} onChange={(e) => setPasswordForm({...passwordForm, actual: e.target.value})} required /></div></div>
              <div className={styles.inputGroup}><label>Nueva Contraseña</label><div className={styles.inputWrapper}><span className={styles.inputIcon}>🔑</span><input type="password" name="nueva" value={passwordForm.nueva} onChange={(e) => setPasswordForm({...passwordForm, nueva: e.target.value})} required /></div></div>
              <div className={styles.inputGroup}><label>Confirmar Nueva Contraseña</label><div className={styles.inputWrapper}><span className={styles.inputIcon}>🔄</span><input type="password" name="confirmar" value={passwordForm.confirmar} onChange={(e) => setPasswordForm({...passwordForm, confirmar: e.target.value})} required /></div></div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Actualizar Contraseña</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiPerfil;