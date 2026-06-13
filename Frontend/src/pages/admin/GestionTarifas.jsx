import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Styles/OperarioDashboard.module.css';

const GestionTarifas = () => {
  const navigate = useNavigate();
  const [tarifas, setTarifas] = useState([]);
  const [usuarioActivo, setUsuarioActivo] = useState({});
  const [tarifaEditando, setTarifaEditando] = useState(null);
  
  // Estados para el formulario de edición
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');
  const [v4, setV4] = useState('');
  const [v5, setV5] = useState('');
  const [normativa, setNormativa] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'Administrador') {
      navigate('/login');
    } else {
      setUsuarioActivo(user);
      cargarTarifas();
    }
  }, [navigate]);

  const cargarTarifas = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/tarifas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setTarifas(datos);
      }
    } catch (error) {
      console.error('Error al cargar tarifas:', error);
    }
  };

  const iniciarEdicion = (tarifa) => {
    setTarifaEditando(tarifa.id_tarifa);
    setV1(tarifa.valor_primera_hora);
    setV2(tarifa.valor_hora_2_a_12);
    setV3(tarifa.valor_hora_13_a_168);
    setV4(tarifa.valor_hora_169_mas);
    setV5(tarifa.valor_mensualidad);
    setNormativa(tarifa.normativa);
  };

  const guardarCambiosTarifa = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:5000/api/admin/tarifas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          valor_primera_hora: parseFloat(v1),
          valor_hora_2_a_12: parseFloat(v2),
          valor_hora_13_a_168: parseFloat(v3),
          valor_hora_169_mas: parseFloat(v4),
          valor_mensualidad: parseFloat(v5),
          normativa: normativa
        })
      });

      if (respuesta.ok) {
        setTarifaEditando(null);
        cargarTarifas();
      }
    } catch (error) {
      console.error('Error al actualizar la configuración de tarifas:', error);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <h2>AeroParking</h2>
          <p>Sistema Inteligente</p>
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userLabel}>Usuario activo</p>
          <p className={styles.userName}>{usuarioActivo.nombre || 'Carlos Admin'}</p>
          <p className={styles.userRole}>{usuarioActivo.rol || 'Administrador'}</p>
        </div>
        <nav className={styles.navMenu}>
          <button className={styles.navButton} onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/clientes')}>Clientes</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/reportes')}>Reportes</button>
          <button className={`${styles.navButton} ${styles.active}`} onClick={() => navigate('/admin/tarifas')}>Tarifas</button>
        </nav>
        <button className={styles.logoutButton} onClick={() => { localStorage.clear(); navigate('/login'); }}>Cerrar Sesión</button>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Configuración de Tarifas</h1>
          <p>Ajusta los 5 rangos de precios oficiales para cada tipo de vehículo</p>
        </header>

        <section className={styles.tableContainer}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Rango 1 (1ra Hora)</th>
                <th>Rango 2 (2 a 12h)</th>
                <th>Rango 3 (13 a 168h)</th>
                <th>Rango 4 (169h o más)</th>
                <th>Rango 5 (Mensualidad)</th>
                <th>Normativa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tarifas.map((t) => (
                <tr key={t.id_tarifa}>
                  <td><strong>{t.tipo_vehiculo}</strong></td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <input type="number" value={v1} onChange={(e) => setV1(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                    ) : (
                      `$${t.valor_primera_hora}`
                    )}
                  </td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <input type="number" value={v2} onChange={(e) => setV2(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                    ) : (
                      `$${t.valor_hora_2_a_12}`
                    )}
                  </td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <input type="number" value={v3} onChange={(e) => setV3(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                    ) : (
                      `$${t.valor_hora_13_a_168}`
                    )}
                  </td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <input type="number" value={v4} onChange={(e) => setV4(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                    ) : (
                      `$${t.valor_hora_169_mas}`
                    )}
                  </td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <input type="number" value={v5} onChange={(e) => setV5(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                    ) : (
                      `$${t.valor_mensualidad}`
                    )}
                  </td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <input type="text" value={normativa} onChange={(e) => setNormativa(e.target.value)} style={{ width: '120px', padding: '4px' }} />
                    ) : (
                      t.normativa
                    )}
                  </td>
                  <td>
                    {tarifaEditando === t.id_tarifa ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => guardarCambiosTarifa(t.id_tarifa)} style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Guardar
                        </button>
                        <button onClick={() => setTarifaEditando(null)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          X
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => iniciarEdicion(t)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default GestionTarifas;