import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import styles from './ClienteDashboard.module.css';

const ClienteDashboard = () => {
  const [data, setData] = useState({ planActual: 'PREMIUM', diasRestantes: 0, placaVehiculo: '', validoHasta: '' });

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/cliente', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(resData => setData(resData))
    .catch(err => console.error(err));
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <h1>Bienvenido, {JSON.parse(localStorage.getItem('user'))?.nombre}</h1>
        <p>Estado de tu plan mensual</p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.bgBlue}`}>💳</div>
            <h2>{data.planActual}</h2>
            <p className={styles.label}>Plan Actual</p>
            <p className={styles.footer}>Activo hasta: {data.validoHasta}</p>
          </div>

          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.bgPink}`}>⚠️</div>
            <h2>{data.diasRestantes}</h2>
            <p className={styles.label}>Días Restantes</p>
          </div>

          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.bgGreen}`}>🚗</div>
            <h2>{data.placaVehiculo}</h2>
            <p className={styles.label}>Mi Vehículo</p>
            <p className={styles.footer}>Placa registrada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteDashboard;