import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || { nombre: 'Usuario', rol: 'Cliente' };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getBadgeClass = () => {
    if (user.rol === 'Admin') return styles.badgeAdmin;
    if (user.rol === 'Operario') return styles.badgeOperario;
    return styles.badgeCliente;
  };

  return (
    <div className={styles.sidebar}>
      <div>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className={styles.logoText}>
            <h1>AeroParking</h1>
            <p>Sistema Inteligente</p>
          </div>
        </div>

        <div className={styles.userCard}>
          <p>Usuario activo</p>
          <h2>{user.nombre}</h2>
          <span className={`${styles.badge} ${getBadgeClass()}`}>{user.rol}</span>
        </div>

        <nav className={styles.menu}>
          {user.rol === 'Cliente' && (
            <>
              <button onClick={() => navigate('/dashboard-cliente')} className={location.pathname === '/dashboard-cliente' ? styles.menuBtnActive : styles.menuBtn}>
                Dashboard
              </button>
              <button onClick={() => navigate('/mi-plan')} className={location.pathname === '/mi-plan' ? styles.menuBtnActive : styles.menuBtn}>
                Mi Plan
              </button>
              <button onClick={() => navigate('/mi-perfil')} className={location.pathname === '/mi-perfil' ? styles.menuBtnActive : styles.menuBtn}>
                Mi Perfil
              </button>
            </>
          )}

          {(user.rol === 'Operario' || user.rol === 'Admin') && (
            <>
              <button onClick={() => navigate('/dashboard-monitoreo')} className={location.pathname === '/dashboard-monitoreo' ? styles.menuBtnActive : styles.menuBtn}>
                Dashboard
              </button>
              <button onClick={() => navigate('/control-acceso')} className={location.pathname === '/control-acceso' ? styles.menuBtnActive : styles.menuBtn}>
                Control de Acceso
              </button>
            </>
          )}

          {user.rol === 'Admin' && (
            <>
              <button onClick={() => navigate('/clientes')} className={location.pathname === '/clientes' ? styles.menuBtnActive : styles.menuBtn}>
                Clientes
              </button>
              <button onClick={() => navigate('/reportes')} className={location.pathname === '/reportes' ? styles.menuBtnActive : styles.menuBtn}>
                Reportes
              </button>
              <button onClick={() => navigate('/tarifas')} className={location.pathname === '/tarifas' ? styles.menuBtnActive : styles.menuBtn}>
                Tarifas
              </button>
            </>
          )}
        </nav>
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;