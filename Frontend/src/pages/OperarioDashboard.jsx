import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Sidebar from '../components/Sidebar';
import styles from '../pages/Styles/OperarioDashboard.module.css';

const OperarioDashboard = () => {
  const [dash, setDash] = useState(null);
  const [cargando, setCargando] = useState(true);

  const formatearEtiqueta = (texto) => {
    return texto
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/dashboard/monitoreo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      const data = await res.json();
      setDash(data);
      setCargando(false);
    } catch (err) { 
      console.error("Error al obtener datos:", err);
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []);

  if (cargando || !dash) return <div className={styles.loading}>Cargando centro de control...</div>;

  // Adaptación flexible: Detecta el nombre de la propiedad unificada del backend o usa la anterior como fallback
  const datosGraficoIngresos = (dash.ingresosSemanales || dash.ingresosData || [])
    .map(d => ({ ...d, total: Math.max(0, parseFloat(d.total || 0)) }));

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Dashboard de Monitoreo</h1>
          <p>AeroParking: Inteligencia operativa en tiempo real</p>
        </div>
        
        {/* Métricas rápidas */}
        <div className={styles.metricasGrid}>
           {dash.metricas && Object.entries(dash.metricas).map(([key, val]) => (
             <div key={key} className={styles.metricaCard}>
               <h3>{val}</h3>
               <p>{formatearEtiqueta(key)}</p>
             </div>
           ))}
        </div>

        <div className={styles.chartsGrid}>
          {/* Gráfico de Ingresos Optimizado */}
          <div className={styles.chartCard}>
            <h3>Flujo de Ingresos Semanal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={datosGraficoIngresos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="dia" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 'auto']} // Ajuste dinámico inteligente para evitar recortes de diseño
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#10b981', 
                    borderRadius: '8px',
                    color: '#fff' 
                  }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Actividad Reciente */}
          <div className={styles.chartCard}>
            <h3>Actividad Reciente</h3>
            <div className={styles.listaActividadInterna}>
              {(dash.actividadReciente || []).map((act, i) => (
                <div key={i} className={styles.itemActividad}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.dot}></span>
                    <span className={styles.textoPlaca}>Placa: {act.placa_vehiculo}</span>
                  </div>
                  <span className={styles.horaTexto}>
                    {act.hora_evento 
                      ? new Date(act.hora_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'N/A'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperarioDashboard;