import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import styles from '../Styles/OperarioDashboard.module.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [usuarioActivo, setUsuarioActivo] = useState({});
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
    if (!user || user.rol !== 'Admin') {
      navigate('/login');
    } else {
      setUsuarioActivo(user);
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

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
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

      {/* SIDEBAR */}
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
          <button className={`${styles.navButton} ${styles.active}`} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </button>
          <button className={styles.navButton} onClick={() => navigate('/admin/clientes')}>
            Clientes
          </button>
          <button className={styles.navButton} onClick={() => navigate('/admin/reportes')}>
            Reportes
          </button>
          <button className={styles.navButton} onClick={() => navigate('/admin/tarifas')}>
            Tarifas
          </button>
        </nav>

        <button className={styles.logoutButton} onClick={cerrarSesion}>
          Cerrar Sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard de Monitoreo</h1>
          <p>Centro de control en tiempo real</p>
        </header>

        {/* TARJETAS DE MÉTRICAS */}
        <section className={styles.metricsGrid}>
          <div className={`${styles.metricCard} animate-card-1`}>
            <div className={styles.metricIcon}>📈</div>
            <div className={styles.metricData}>
              <h3>{metricas.totalCupos}</h3>
              <p>Total Cupos</p>
            </div>
          </div>
          <div className={`${styles.metricCard} animate-card-2`}>
            <div className={styles.metricIcon}>🚗</div>
            <div className={styles.metricData}>
              <h3>{metricas.ocupados}</h3>
              <p>Ocupados</p>
            </div>
          </div>
          <div className={`${styles.metricCard} animate-card-3`}>
            <div className={styles.metricIcon}>✅</div>
            <div className={styles.metricData}>
              <h3>{metricas.disponibles}</h3>
              <p>Disponibles</p>
            </div>
          </div>
          <div className={`${styles.metricCard} animate-card-4`}>
            <div className={styles.metricIcon}>🚙</div>
            <div className={styles.metricData}>
              <h3>{metricas.ingresosHoy}</h3>
              <p>Ingresos Hoy</p>
            </div>
          </div>
          <div className={`${styles.metricCard} animate-card-5`}>
            <div className={styles.metricIcon}>👥</div>
            <div className={styles.metricData}>
              <h3>{metricas.clientesActivos}</h3>
              <p>Clientes Activos</p>
            </div>
          </div>
          <div className={`${styles.metricCard} animate-card-6`}>
            <div className={styles.metricIcon}>⏰</div>
            <div className={styles.metricData}>
              <h3>{metricas.planesPorVencer}</h3>
              <p>Planes por Vencer</p>
            </div>
          </div>
        </section>

        {/* GRÁFICOS */}
        <section className={styles.chartsGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
          
          <div className="animate-chart" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '16px', color: '#333' }}>Ocupación por Hora</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={datosOcupacion} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="hora" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="ocupacion" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="animate-chart" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '16px', color: '#333' }}>Ingresos Semanales (COP)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={datosIngresos} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="dia" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']} />
                  <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>

        {/* ACTIVIDAD RECIENTE DINÁMICA */}
        <section className={`${styles.recentActivity} animate-activity`} style={{ marginTop: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', color: '#333' }}>Actividad Reciente</h3>
          <div className={styles.activityList} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {actividad.map((act, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '20px', backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '50%' }}>
                    {act.placa_vehiculo.includes('M') ? '🏍️' : '🚗'}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#333' }}>Placa: <strong>{act.placa_vehiculo}</strong></p>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {new Date(act.hora_ingreso).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: act.hora_salida ? '#f3f4f6' : '#dcfce7', 
                  color: act.hora_salida ? '#6b7280' : '#166534', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 'bold' 
                }}>
                  {act.hora_salida ? 'Salió' : 'Dentro'}
                </div>
              </div>
            ))}

            {actividad.length === 0 && (
              <p style={{ textAlign: 'center', color: '#888' }}>No hay actividad de vehículos registrada hoy.</p>
            )}

          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;