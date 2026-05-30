import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import styles from './ClienteDashboard.module.css';

const ClienteDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datosDashboard, setDatosDashboard] = useState({
    planActual: 'NINGUNO',
    diasRestantes: 0,
    placaVehiculo: 'No Registrada',
    activoHasta: 'N/A'
  });

  const cargarDatosDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/auth/dashboard-estado', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setDatosDashboard({
          planActual: datos.planActual || 'NINGUNO',
          diasRestantes: datos.diasRestantes || 0,
          placaVehiculo: datos.placaVehiculo || 'No Registrada',
          activoHasta: datos.activoHasta || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error al conectar con el endpoint del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Bienvenido, Martin Rodriguez</h1>
          <p>Estado de tu plan mensual</p>
        </header>

        {loading ? (
          <div className={styles.loading}>Sincronizando con los servidores de AeroParking...</div>
        ) : (
          <>
            <div className={styles.gridCards}>
              {/* CARD 1: ESTADO DEL PLAN */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.icon}>💳</span>
                  <h3>Plan Actual</h3>
                </div>
                <h2 className={styles.mainValue}>{datosDashboard.planActual}</h2>
                <p className={styles.subtext}>
                  {datosDashboard.planActual === 'Plan Premium' 
                    ? `Activo hasta el ${new Date(datosDashboard.activoHasta).toLocaleDateString()}` 
                    : 'Sin suscripción vigente'}
                </p>
              </div>

              {/* CARD 2: DÍAS RESTANTES */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.icon}>⚠️</span>
                  <h3>Días Restantes</h3>
                </div>
                <h2 className={styles.mainValue}>{datosDashboard.diasRestantes}</h2>
                <p className={styles.subtext}>Días de cobertura en celdas</p>
              </div>

              {/* CARD 3: PLACA REAL DEL VEHÍCULO */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.icon}>🚗</span>
                  <h3>Mi Vehículo</h3>
                </div>
                <h2 className={styles.mainValue}>{datosDashboard.placaVehiculo}</h2>
                <p className={styles.subtext}>Placa registrada en el sistema</p>
              </div>
            </div>

            {/* SECCIÓN INTERACTIVA SI NO TIENE PLAN */}
            {datosDashboard.planActual === 'NINGUNO' && (
              <div className={styles.callToActionContainer}>
                <div className={styles.ctaCard}>
                  <div className={styles.ctaIcon}>🔓</div>
                  <h2 className={styles.ctaTitle}>Adquiere un plan mensual</h2>
                  <p className={styles.ctaDescription}>
                    No tienes una suscripción activa. Adquiere tu mensualidad para disfrutar de acceso ilimitado a las celdas de AeroParking.
                  </p>
                  <button 
                    className={styles.btnNavigate} 
                    onClick={() => navigate('/mi-plan')}
                  >
                    Ir a pagar mi plan
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ClienteDashboard;