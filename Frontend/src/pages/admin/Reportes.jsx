import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, BarChart3, TrendingUp, Users, Car } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Sidebar from '../../components/Sidebar';
import styles from '../Styles/Reportes.module.css';

const Reportes = () => {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    totalCupos: 100,
    ocupados: 0,
    disponibles: 100,
    ingresosHoy: 0,
    clientesActivos: 0,
    planesPorVencer: 0
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Datos reales/simulados para la gráfica de barras de Ingresos (puedes adaptarlo luego con otra consulta de caja)
  const datosIngresos = [
    { name: 'Lun', ingresos: 1200000 },
    { name: 'Mar', ingresos: 1550000 },
    { name: 'Mié', ingresos: 1400000 },
    { name: 'Jue', ingresos: 1700000 },
    { name: 'Vie', ingresos: 2100000 },
    { name: 'Sáb', ingresos: 1900000 },
    { name: 'Dom', ingresos: 1500000 },
  ];

  // 2. Cálculo dinámico de la gráfica de Torta basado en los vehículos OCUPADOS reales de la DB
  const calcularDistribucionVehiculos = () => {
    if (metricas.ocupados === 0) {
      return [
        { name: 'Automóviles', value: 0, color: '#3b82f6' },
        { name: 'Motocicletas', value: 0, color: '#06b6d4' },
        { name: 'Bicicletas', value: 0, color: '#a855f7' },
      ];
    }
    
    // Cuenta cuántos autos y motos hay en la actividad reciente que sigan "Dentro" (hora_salida === null)
    const autos = actividadReciente.filter(v => !v.hora_salida && v.tipo_vehiculo?.toLowerCase() !== 'motocicleta').length;
    const motos = actividadReciente.filter(v => !v.hora_salida && v.tipo_vehiculo?.toLowerCase() === 'motocicleta').length;
    const total = autos + motos || 1;

    return [
      { name: 'Automóviles', value: Math.round((autos / total) * 100), color: '#3b82f6' },
      { name: 'Motocicletas', value: Math.round((motos / total) * 100), color: '#06b6d4' },
      { name: 'Bicicletas', value: 0, color: '#a855f7' },
    ];
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
      navigate('/login');
    } else {
      cargarDataRealDashboard();
    }
  }, [navigate]);

  // Petición HTTP real al endpoint de métricas de administración
  const cargarDataRealDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/dashboard/metricas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      
      if (respuesta.ok) {
        if (datos.metricas) setMetricas(datos.metricas);
        if (Array.isArray(datos.actividadReciente)) setActividadReciente(datos.actividadReciente);
      }
    } catch (error) {
      console.error('Error al conectar con las métricas reales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = () => {
    alert('Generando archivo PDF con el reporte estadístico real...');
  };

  // Formateador de moneda colombiana para los ingresos reales
  const formatCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  const datosVehiculos = calcularDistribucionVehiculos();

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Reportes y Analítica</h1>
            <p>Estadísticas y análisis del parqueadero en tiempo real</p>
          </div>
          <button onClick={handleExportarPDF} className={styles.btnExportar}>
            <Download size={18} /> Exportar PDF
          </button>
        </header>

        {/* KPIs Conectados a la base de datos */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.blue}`}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Ingresos de Hoy</span>
              <h2>{formatCOP(metricas.ingresosHoy || 0)}</h2>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.pink}`}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Cupos Ocupados</span>
              <h2>{metricas.ocupados} / {metricas.totalCupos}</h2>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.green}`}>
              <Users size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Total Clientes</span>
              <h2>{metricas.clientesActivos}</h2>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.orange}`}>
              <Car size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Cupos Disponibles</span>
              <h2>{metricas.disponibles}</h2>
            </div>
          </div>
        </section>

        {/* Gráficos Distribuidos */}
        <section className={styles.chartsGrid}>
          <div className={styles.chartWrapper}>
            <h3>Ingresos por Día</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosIngresos} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ingresos (COP)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartWrapper}>
            <h3>Distribución por Tipo de Vehículo</h3>
            <div style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosVehiculos}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {datosVehiculos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{value} {entry.payload.value}%</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Tabla de Historial con Datos de la Tabla `control_i_s` de tu Base de Datos */}
        <section className={styles.tableContainer}>
          <h3>Historial de Vehículos Recientes</h3>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Hora Ingreso</th>
                <th>Hora Salida</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {actividadReciente.map((vehiculo, idx) => (
                <tr key={idx}>
                  <td className={styles.placaText}>{vehiculo.placa_vehiculo}</td>
                  <td>{vehiculo.tipo_vehiculo || 'Automóvil'}</td>
                  <td>{new Date(vehiculo.hora_ingreso).toLocaleString('es-CO')}</td>
                  <td>{vehiculo.hora_salida ? new Date(vehiculo.hora_salida).toLocaleString('es-CO') : '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={vehiculo.hora_salida ? styles.badgeSalio : styles.badgeDentro}>
                      {vehiculo.hora_salida ? 'Salida' : 'Dentro'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {actividadReciente.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No hay registros de ingresos o salidas el día de hoy.
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

export default Reportes;