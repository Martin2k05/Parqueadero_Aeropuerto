import React from 'react';
import Sidebar from '../components/Sidebar';
import styles from './MiPlan.module.css';

const MiPlan = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Mi Plan Mensual</h1>
          <p>Gestiona tu membresía de parqueadero</p>
        </header>

        <section className={styles.planCard}>
          <div className={styles.planHeader}>
            <div className={styles.planTitleContainer}>
              <div className={styles.iconContainer}>
                <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2>Plan Premium</h2>
                <p>Estado: <span className={styles.statusActive}>Activo</span></p>
              </div>
            </div>
            <span className={styles.badgeActive}>Activo</span>
          </div>

          <div className={styles.planGrid}>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha de Inicio
              </span>
              <p className={styles.infoValue}>7/4/2026</p>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0x" />
                </svg>
                Fecha de Vencimiento
              </span>
              <p className={styles.infoValue}>7/6/2026</p>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" />
                </svg>
                Valor Pagado
              </span>
              <p className={styles.infoValue}>$180.000</p>
            </div>
          </div>

          <div className={styles.actionsContainer}>
            <button className={styles.btnPrimary}>Renovar Plan</button>
            <button className={styles.btnSecondary}>Actualizar Método de Pago</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MiPlan;