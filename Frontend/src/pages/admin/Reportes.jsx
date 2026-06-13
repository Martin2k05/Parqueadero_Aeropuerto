import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Styles/OperarioDashboard.module.css';

const Reportes = () => {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [usuarioActivo, setUsuarioActivo] = useState({});
  const [tipoReporte, setTipoReporte] = useState('Financiero');
  const [periodoReporte, setPeriodoReporte] = useState('Diario');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'Administrador') {
      navigate('/login');
    } else {
      setUsuarioActivo(user);
      cargarReportes();
    }
  }, [navigate]);

  const cargarReportes = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/reportes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setReportes(datos);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    }
  };

  const generarNuevoReporte = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo_reporte: tipoReporte,
          periodo_reporte: periodoReporte
        })
      });

      if (respuesta.ok) {
        cargarReportes();
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
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
          <button className={`${styles.navButton} ${styles.active}`} onClick={() => navigate('/admin/reportes')}>Reportes</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/tarifas')}>Tarifas</button>
        </nav>
        <button className={styles.logoutButton} onClick={() => { localStorage.clear(); navigate('/login'); }}>Cerrar Sesión</button>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Módulo de Reportes</h1>
          <p>Genera e inspecciona el historial de reportes estadísticos y financieros</p>
        </header>

        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '15px' }}>Generar Reporte del Sistema</h3>
          <form onSubmit={generarNuevoReporte} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>Tipo de Reporte</label>
              <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Financiero">Financiero</option>
                <option value="Estadistico">Estadístico</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>Periodo</label>
              <select value={periodoReporte} onChange={(e) => setPeriodoReporte(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Diario">Diario</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>

            <button type="submit" style={{ marginTop: '22px', padding: '9px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Ejecutar Consulta
            </button>
          </form>
        </section>

        <section className={styles.tableContainer}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>ID Reporte</th>
                <th>Tipo de Reporte</th>
                <th>Periodo</th>
                <th>Generado Por</th>
                <th>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((reporte) => (
                <tr key={reporte.id_reporte}>
                  <td>{reporte.id_reporte}</td>
                  <td><strong>{reporte.tipo_reporte}</strong></td>
                  <td>{reporte.periodo_reporte}</td>
                  <td>{reporte.nombre_usuario}</td>
                  <td>{new Date(reporte.fecha_generado).toLocaleString()}</td>
                </tr>
              ))}
              {reportes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No hay registros de reportes en el sistema.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Reportes;