import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import styles from './OperarioDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const OperarioDashboard = () => {
  const [dash, setDash] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Función para formatear las claves: "TotalCupos" -> "Total Cupos"
  const formatearEtiqueta = (texto) => {
    return texto
      .replace(/([A-Z])/g, ' $1') // Inserta espacio antes de cada mayúscula
      .replace(/^./, (str) => str.toUpperCase()) // Capitaliza la primera letra
      .trim();
  };

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/dashboard/monitoreo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      const data = await res.json();
      setDash(data);
      setCargando(false);
    } catch (err) { 
      console.error("Error al obtener datos:", err);
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []);

  if (cargando || !dash) return <div className={styles.loading}>Cargando centro de control...</div>;

  const dataOcupacion = {
    labels: dash.ocupacionData.map(d => `${d.hora}:00`),
    datasets: [{ 
      label: 'Vehículos', 
      data: dash.ocupacionData.map(d => d.vehiculos), 
      borderColor: '#3b82f6', 
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6'
    }]
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Dashboard de Monitoreo</h1>
          <p>Visualización en tiempo real de la operación</p>
        </div>
        
        <div className={styles.metricasGrid}>
           {dash.metricas && Object.entries(dash.metricas).map(([key, val]) => (
             <div key={key} className={styles.metricaCard}>
               <h3>{val}</h3>
               <p>{formatearEtiqueta(key)}</p>
             </div>
           ))}
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Ocupación por Hora</h3>
            <div style={{ flex: 1, position: 'relative', width: '100%' }}>
              <Line data={dataOcupacion} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className={styles.chartCard}>
            <h3>Actividad Reciente</h3>
            <div className={styles.listaActividadInterna}>
              {dash.actividadReciente && dash.actividadReciente.map((act, i) => (
                <div key={i} className={styles.itemActividad}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.dot}></span>
                    <span className={styles.textoPlaca}>Placa: {act.placa_vehiculo}</span>
                  </div>
                  <span className={styles.horaTexto}>
                    {new Date(act.hora_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperarioDashboard;