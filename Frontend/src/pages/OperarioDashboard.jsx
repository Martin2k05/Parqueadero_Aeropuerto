import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import styles from './OperarioDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const OperarioDashboard = () => {
  const [dash, setDash] = useState(null);
  const [cargando, setCargando] = useState(true); // Nuevo estado para controlar la carga

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Si no hay token, no intentar cargar
      
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
    // Forzamos la carga al montar y limpiamos el estado previo
    setDash(null);
    setCargando(true);
    cargarDatos();

    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []); // El array vacío [] es correcto aquí

  // Si estamos cargando o no hay datos, mostramos el mensaje
  if (cargando || !dash) return <div className={styles.loading}>Cargando centro de control...</div>;

  const dataOcupacion = {
    labels: dash.ocupacionData.map(d => `${d.hora}:00`),
    datasets: [{ label: 'Vehículos', data: dash.ocupacionData.map(d => d.vehiculos), borderColor: '#3b82f6', tension: 0.4 }]
  };

  const dataIngresos = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{ label: 'Ingresos ($)', data: dash.ingresosData.map(d => d.total), backgroundColor: '#06b6d4' }]
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <h1>Dashboard de Monitoreo</h1>
        
        {/* Metricas */}
        <div className={styles.metricasGrid}>
           {dash.metricas && Object.entries(dash.metricas).map(([key, val]) => (
             <div key={key} className={styles.metricaCard}><h3>{val}</h3><p>{key}</p></div>
           ))}
        </div>

        {/* Gráficos */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Ocupación por Hora</h3>
            <div style={{ height: '200px' }}><Line data={dataOcupacion} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
          <div className={styles.chartCard}>
            <h3>Ingresos Semanales</h3>
            <div style={{ height: '200px' }}><Bar data={dataIngresos} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
        </div>

        {/* Actividad */}
        <div className={styles.actividadCard}>
          <h3>Actividad Reciente</h3>
          {dash.actividadReciente && dash.actividadReciente.map((act, i) => (
            <div key={i} className={styles.itemActividad}>
              <p>Placa: {act.placa_vehiculo} - <b>{act.tipo_movimiento}</b></p>
              <span>{new Date(act.hora_evento).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperarioDashboard;