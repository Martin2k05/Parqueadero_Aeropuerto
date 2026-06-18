import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Car, 
  CheckCircle, 
  Users, 
  Clock, 
  DollarSign, 
  Bike
} from 'lucide-react';
import Sidebar from '../../components/Sidebar'; // <-- AQUÍ: Importación limpia subiendo dos niveles
import styles from '../Styles/AdminDashboard.module.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    totalCupos: 100,
    ocupados: 0,
    disponibles: 100,
    ingresosHoy: 0,
    clientesActivos: 0,
    planesPorVencer: 0
  });
  const [actividad, setActividad] = useState([]);

  // Datos dinámicos para los gráficos (pueden ser extendidos desde el backend)
  const datosOcupacion = [
    { hora: '06:00', ocupacion: 15 },
    { hora: '09:00', ocupacion: 45 },
    { hora: '12:00', ocupacion: metricas.ocupados * 10 || 20 },
    { hora: '15:00', ocupacion: 60 },
    { hora: '18:00', ocupacion: 95 },
    { hora: '21:00', ocupacion: 40 },
  ];

  const datosIngresos = [
    { dia: 'Lun', ingresos: 120000 },
    { dia: 'Mar', ingresos: 150000 },
    { dia: 'Mié', ingresos: 110000 },
    { dia: 'Jue', ingresos: 180000 },
    { dia: 'Vie', ingresos: 250000 },
    { dia: 'Sáb', ingresos: metricas.ingresosHoy * 5000 || 320000 },
    { dia: 'Dom', ingresos: 290000 },
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    // Validación flexible para admitir ambos formatos de rol administrador
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
      navigate('/login');
    } else {
      cargarDatosDashboard();
    }
  }, [navigate]);

  const cargarDatosDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/dashboard/metricas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setMetricas(datos.metricas);
        setActividad(datos.actividadReciente);
      }
    } catch (error) {
      console.error('Error al cargar métricas en tiempo real:', error);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <style>
        {`
          @keyframes fadeInUP {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-card-1 { animation: fadeInUP 0.4s ease-out forwards; }
          .animate-card-2 { animation: fadeInUP 0.5s ease-out forwards; }
          .animate-card-3 { animation: fadeInUP 0.6s ease-out forwards; }
          .animate-card-4 { animation: fadeInUP 0.7s ease-out forwards; }
          .animate-card-5 { animation: fadeInUP 0.8s ease-out forwards; }
          .animate-card-6 { animation: fadeInUP 0.9s ease-out forwards; }
          .animate-chart { animation: fadeInUP 1s ease-out forwards; }
          .animate-activity { animation: fadeInUP 1.1s ease-out forwards; }
        `}
      </style>

      {/* LLAMADA A LA SIDEBAR DE COMPONENTES */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard de Monitoreo</h1>
          <p>Centro de control en tiempo real</p>
        </header>

        {/* TARJETAS DE MÉTRICAS */}
        <section className={styles.metricsGrid}>
          <div className={`${styles.metricCard} animate-card-1`}>
            <div className={`${styles.metricIcon} ${styles.bgBlue}`}>
              <TrendingUp size={22} />
            </div>
            <div className={styles.metricData}>
              <h3>{metricas.totalCupos}</h3>
              <p className={styles.label}>Total Cupos</p>
            </div>
          </div>
          
          <div className={`${styles.metricCard} animate-card-2`}>
            <div className={`${styles.metricIcon} ${styles.bgPink}`}>
              <Car size={22} />
            </div>
            <div className={styles.metricData}>
              <h3>{metricas.ocupados}</h3>
              <p className={styles.label}>Ocupados</p>
            </div>
          </div>

          <div className={`${styles.metricCard} animate-card-3`}>
            <div className={`${styles.metricIcon} ${styles.bgGreen}`}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.metricData}>
              <h3>{metricas.disponibles}</h3>
              <p className={styles.label}>Disponibles</p>
            </div>
          </div>

          <div className={`${styles.metricCard} animate-card-4`}>
            <div className={`${styles.metricIcon} ${styles.bgBlue}`}>
              <DollarSign size={22} />
            </div>
            <div className={styles.metricData}>
              <h3>{metricas.ingresosHoy}</h3>
              <p className={styles.label}>Ingresos Hoy</p>
            </div>
          </div>

          <div className={`${styles.metricCard} animate-card-5`}>
            <div className={`${styles.metricIcon} ${styles.bgPink}`}>
              <Users size={22} />
            </div>
            <div className={styles.metricData}>
              <h3>{metricas.clientesActivos}</h3>
              <p className={styles.label}>Clientes Activos</p>
            </div>
          </div>

          <div className={`${styles.metricCard} animate-card-6`}>
            <div className={`${styles.metricIcon} ${styles.bgGreen}`}>
              <Clock size={22} />
            </div>
            <div className={styles.metricData}>
              <h3>{metricas.planesPorVencer}</h3>
              <p className={styles.label}>Planes por Vencer</p>
            </div>
          </div>
        </section>

        {/* GRÁFICOS */}
        <section className={styles.chartsGrid}>
          <div className="animate-chart">
            <h3>Ocupación por Hora</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={datosOcupacion} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3454" />
                  <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c2541', borderRadius: '8px', border: '1px solid #2a3454', color: '#fff' }} />
                  <Line type="monotone" dataKey="ocupacion" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="animate-chart">
            <h3>Ingresos Semanales (COP)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={datosIngresos} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3454" />
                  <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c2541', borderRadius: '8px', border: '1px solid #2a3454', color: '#fff' }} formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']} />
                  <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ACTIVIDAD RECIENTE DINÁMICA */}
        <section className={`${styles.recentActivity} animate-activity`}>
          <h3>Actividad Reciente</h3>
          <div className={styles.activityList}>
            {actividad.map((act, index) => (
              <div key={index} className={styles.activityItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className={styles.activityIconBox}>
                    {act.placa_vehiculo.includes('M') ? <Bike size={20} /> : <Car size={20} />}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#ffffff' }}>Placa: <strong>{act.placa_vehiculo}</strong></p>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(act.hora_ingreso).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: act.hora_salida ? 'rgba(75, 85, 99, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                  color: act.hora_salida ? '#9ca3af' : '#10b981', 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  border: act.hora_salida ? '1px solid rgba(75, 85, 99, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
                }}>
                  {act.hora_salida ? 'Salió' : 'Dentro'}
                </div>
              </div>
            ))}

            {actividad.length === 0 && (
              <p style={{ textAlign: 'center', color: '#64748b' }}>No hay actividad de vehículos registrada hoy.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;