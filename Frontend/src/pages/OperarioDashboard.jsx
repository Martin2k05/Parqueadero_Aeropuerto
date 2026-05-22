import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import styles from './OperarioDashboard.module.css';

const OperarioDashboard = () => {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/monitoreo', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setDash(data))
    .catch(err => console.error(err));
  }, []);

  if (!dash) return <div style={{padding:'32px', textAlign:'center'}}>Cargando centro de control...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Dashboard de Monitoreo</h1>
          <p>Centro de control en tiempo real</p>
        </div>

        <div className={styles.metricasGrid}>
          <div className={styles.metricaCard}>
            <span className={styles.icon}>🔵</span>
            <div>
              <h3>{dash.metricas.totalCupos}</h3>
              <p>Total Cupos</p>
            </div>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.icon}>¼</span>
            <div>
              <h3>{dash.metricas.ocupados}</h3>
              <p>Ocupados</p>
              <p className={styles.metricaSub}>3% ocupación</p>
            </div>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.icon}>🟢</span>
            <div>
              <h3>{dash.metricas.disponibles}</h3>
              <p>Disponibles</p>
            </div>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.icon}>🟣</span>
            <div>
              <h3>{dash.metricas.ingresosHoy}</h3>
              <p>Ingresos Hoy</p>
            </div>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.icon}>🔵</span>
            <div>
              <h3>{dash.metricas.clientesActivos}</h3>
              <p>Clientes Activos</p>
            </div>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.icon}>🟡</span>
            <div>
              <h3>{dash.metricas.planesPorVencer}</h3>
              <p>Planes por Vencer</p>
              <p className={styles.metricaSub}>Próximos 7 días</p>
            </div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Ocupación por Hora</h3>
            <div className={styles.barChartContainer}>
              {dash.ocupacionPorHora.map((o, i) => (
                <div key={i} className={styles.barGroup}>
                  <div className={styles.barBlue} style={{ height: `${o.vehiculos}%` }}></div>
                  <span>{o.hora}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Ingresos Semanales</h3>
            <div className={styles.barChartContainer}>
              {dash.ingresosSemanales.map((d, i) => (
                <div key={i} className={styles.barGroup}>
                  <div className={styles.barCyan} style={{ height: `${d.ingress / 4}%` }}></div>
                  <span>{d.dia}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actividadCard}>
          <h3>Actividad Reciente</h3>
          <div className={styles.listaActividad}>
            {dash.actividadReciente.map((act, i) => (
              <div key={i} className={styles.itemActividad}>
                <div className={styles.itemInfo}>
                  <span>🚗</span>
                  <div className={styles.itemText}>
                    <p>Placa: {act.placa_vehiculo}</p>
                    <span>{act.fecha_formateada}</span>
                  </div>
                </div>
                <span className={styles.statusTag}>Dentro</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperarioDashboard;