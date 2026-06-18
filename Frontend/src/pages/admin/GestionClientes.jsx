import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, UserX } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import styles from '../Styles/GestionClientes.module.css';

const GestionClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Validación flexible para admitir ambos formatos de rol administrador
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
      navigate('/login');
    } else {
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

  // Mapeo directo con los nombres exactos de tu tabla SQL
  const clientesFiltrados = clientes.filter(c => 
    c.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.identificacion?.includes(busqueda) ||
    (c.placa_vehiculo && c.placa_vehiculo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className={styles.dashboardContainer}>
      {/* Llamada limpia a la barra lateral configurada con los iconos nuevos */}
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Gestión de Clientes</h1>
          <p>Administra los usuarios y vehículos registrados en el sistema</p>
        </header>

        <section className={styles.tableActions}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, cédula o placa..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
          </div>
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
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  {/* Llave primaria correlativa de tu tabla SQL */}
                  <td>{cliente.id_cliente}</td>
                  <td className={styles.clientNameCell}>{cliente.nombre_cliente}</td>
                  <td>{cliente.identificacion}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono || 'N/A'}</td>
                  
                  {/* Concatenación de los atributos compuestos de la dirección de tu DB */}
                  <td className={styles.addressCell}>
                    {`${cliente.dir_calle || ''} ${cliente.dir_carrera || ''} ${cliente.dir_numero || ''} ${cliente.dir_barrio || ''}`.trim() || 'N/A'}
                  </td>
                  
                  {/* Llave foránea del vehículo vinculada */}
                  <td>
                    <span className={cliente.placa_vehiculo ? styles.placaBadge : styles.noPlacaBadge}>
                      {cliente.placa_vehiculo || 'Sin Placa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => eliminarCliente(cliente.id_cliente)} 
                      className={styles.deleteButtonRow}
                      title="Eliminar Cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8" className={styles.emptyTableState}>
                    <UserX size={32} style={{ marginBottom: '10px', color: '#64748b' }} />
                    <p>No se encontraron clientes registrados en el sistema.</p>
                  </td>
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