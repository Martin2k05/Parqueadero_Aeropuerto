import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import styles from './MiPlan.module.css';

const MiPlan = () => {
  const [loading, setLoading] = useState(true);
  const [planActivo, setPlanActivo] = useState(false);
  const [datosPlan, setDatosPlan] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [cargandoPago, setCargandoPago] = useState(false);

  const mostrarNotificacion = (mensaje, tipo) => {
    setAlerta({ mensaje, tipo });
  };

  const verificarPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/auth/mi-plan-estado', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();

      if (respuesta.ok && datos.tienePlan) {
        setPlanActivo(true);
        setDatosPlan(datos);
      } else {
        setPlanActivo(false);
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion('Error al conectar con el servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarPlan();

    // Capturar la respuesta real cuando el cliente regresa de la pasarela de PSE
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get('payment');

    if (status === 'success') {
      mostrarNotificacion('¡Pago aprobado por PSE! Tu plan mensual se encuentra activo.', 'success');
    } else if (status === 'failure') {
      mostrarNotificacion('El pago a través de PSE fue rechazado o cancelado.', 'error');
    }
  }, []);

  // FLUJO REAL DE CONEXIÓN Y REDIRECCIÓN A PSE
  const iniciarPagoRealPSE = async () => {
    setCargandoPago(true);
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/auth/comprar-plan-mensual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const datos = await respuesta.json();

      if (respuesta.ok && datos.urlPago) {
        mostrarNotificacion('Conexión exitosa. Redirigiendo a la plataforma oficial de PSE...', 'success');
        
        // Espera un segundo para que alcances a ver la notificación verde y redirige
        setTimeout(() => {
          window.location.href = datos.urlPago;
        }, 1000);
      } else {
        mostrarNotificacion(datos.message || 'No se pudo generar el canal de pago PSE real.', 'error');
        setCargandoPago(false);
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion('Error crítico de conexión con la pasarela de pagos.', 'error');
      setCargandoPago(false);
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <div className={styles.notificationContainer}>
        {alerta && <Notification mensaje={alerta.mensaje} tipo={alerta.tipo} onClose={() => setAlerta(null)} />}
      </div>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Mi Plan Mensual</h1>
          <p>Gestiona tu membresía y acceso al sistema inteligente de parqueadero</p>
        </header>

        {loading ? (
          <div className={styles.loading}>Verificando credenciales del sistema...</div>
        ) : planActivo ? (
          /* VISTA CUANDO EL CLIENTE TIENE EL PLAN ACTIVADO */
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.planBadgeIcon}>膜</div>
              <div>
                <h3>Plan Premium</h3>
                <p className={styles.statusActivo}>Estado: Activo</p>
              </div>
              <span className={styles.badgeStatus}>Activo</span>
            </div>

            <div className={styles.gridInfo}>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Fecha de Inicio</span>
                <span className={styles.infoValue}>{formatearFecha(datosPlan?.fecha_inicio)}</span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Fecha de Vencimiento</span>
                <span className={styles.infoValue}>{formatearFecha(datosPlan?.fecha_final)}</span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Valor Pagado</span>
                <span className={styles.infoValue}>$180.000</span>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA DIRECTA DE COMPRA REAL: SIN MODALES DE DECORACIÓN */
          <div className={styles.noPlanContainer}>
            <div className={styles.purchaseCard}>
              <div className={styles.purchaseIcon}>🔓</div>
              <h2>No tienes un plan activo</h2>
              <p>Adquiere tu mensualidad para disfrutar de acceso ilimitado a las celdas de AeroParking.</p>
              
              <div className={styles.planPriceContainer}>
                <span className={styles.planNameLabel}>PLAN MENSUAL</span>
                <h1 className={styles.planPrice}>$180.000 <span>/ Mes</span></h1>
              </div>

              {/* CORRECCIÓN CLAVE: El click llama directamente a la API real de Mercado Pago */}
              <button 
                className={styles.btnComprar} 
                onClick={iniciarPagoRealPSE}
                disabled={cargandoPago}
              >
                {cargandoPago ? 'Abriendo canal seguro...' : 'Pagar con PSE'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MiPlan;