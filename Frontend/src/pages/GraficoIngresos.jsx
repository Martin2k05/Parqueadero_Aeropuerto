import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const GraficoIngresos = ({ data }) => {
  // Aseguramos que los datos sean siempre positivos
  const datosLimpios = data.map(item => ({
    ...item,
    total: Math.max(0, item.total || 0) 
  }));

  return (
    <div style={{ width: '100%', height: 300, backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px' }}>
      <ResponsiveContainer>
        <LineChart data={datosLimpios}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="dia" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 'auto']} />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoIngresos;