import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Styles/OperarioDashboard.module.css';

const GestionClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioActivo, setUsuarioActivo] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'Administrador') {
      navigate('/login');
    } else {
      setUsuarioActivo(user);
      cargarClientes();
    }
  }, [navigate]);

  const cargarClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/clientes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setClientes(datos);
      }
    } catch (error) {
      console.error('Error al mapear clientes:', error);
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente de forma permanente?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:5000/api/admin/clientes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        cargarClientes();
      }
    } catch (error) {
      console.error('Error al borrar cliente:', error);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.identificacion.includes(busqueda) ||
    (c.placa_vehiculo && c.placa_vehiculo.toLowerCase().includes(busqueda.toLowerCase()))
  );

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
          <button className={`${styles.navButton} ${styles.active}`} onClick={() => navigate('/admin/clientes')}>Clientes</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/reportes')}>Reportes</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/tarifas')}>Tarifas</button>
        </nav>
        <button className={styles.logoutButton} onClick={() => { localStorage.clear(); navigate('/login'); }}>Cerrar Sesión</button>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Gestión de Clientes</h1>
          <p>Administra los usuarios y vehículos registrados en el sistema</p>
        </header>

        <section className={styles.tableActions}>
          <input 
            type="text" 
            placeholder="Buscar por nombre, cédula o placa..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </section>

        <section className={styles.tableContainer}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Placa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td>{cliente.id_cliente}</td>
                  <td>{cliente.nombre_cliente}</td>
                  <td>{cliente.identificacion}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono || 'N/A'}</td>
                  <td>{`${cliente.dir_calle || ''} ${cliente.dir_carrera || ''} ${cliente.dir_numero || ''} ${cliente.dir_barrio || ''}`.trim() || 'N/A'}</td>
                  <td><span className={styles.placaBadge}>{cliente.placa_vehiculo || 'Sin Placa'}</span></td>
                  <td>
                    <button onClick={() => eliminarCliente(cliente.id_cliente)} className={styles.deleteButtonRow}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron clientes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default GestionClientes;