import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import styles from './Styles/ControlAcceso.module.css';

const ControlAcceso = () => {
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Automovil');
  const [lista, setLista] = useState([]);
  const [msg, setMsg] = useState('');

  const cargarVehiculos = () => {
    fetch('http://localhost:5000/api/parking/vehiculos-activos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setLista(data))
    .catch(err => console.error(err));
  };

  useEffect(() => { cargarVehiculos(); }, []);

  const handleIngreso = async (e) => {
    e.preventDefault();
    if(!placa) return;
    const res = await fetch('http://localhost:5000/api/parking/ingreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placa, tipoVehiculo: tipo })
    });
    const data = await res.json();
    setMsg(data.message);
    setPlaca('');
    cargarVehiculos();
  };

  const handleSalida = async (placaSalida) => {
    const res = await fetch('http://localhost:5000/api/parking/salida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placaSalida, metodoPago: 'Efectivo' })
    });
    const data = await res.json();
    alert(`Salida Procesada\nCobro Total: $${data.datos?.totalCobrado}\n${data.datos?.observacion}`);
    cargarVehiculos();
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Control de Acceso</h1>
          <p>Registro de ingresos y salidas</p>
        </div>

        {msg && <div className={styles.alert}>{msg}</div>}

        <div className={styles.panel}>
          <h2>Registrar Ingreso</h2>
          <form onSubmit={handleIngreso} className={styles.formInline}>
            <div className={styles.inputGroup}>
              <label>Placa del Vehículo</label>
              <input type="text" value={placa} placeholder="ABC123" onChange={e => setPlaca(e.target.value.toUpperCase())} />
            </div>
            <div className={styles.inputGroup}>
              <label>Tipo de Vehículo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="Automovil">Automóvil</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Camioneta">Camioneta</option>
              </select>
            </div>
            <button type="submit" className={styles.submitBtn}>
              Registrar Ingreso
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <h2>Vehículos en Parqueadero</h2>
          <div className={styles.listaVehiculos}>
            {lista.length === 0 ? <p className={styles.vacio}>No hay vehículos dentro en este momento.</p> :
              lista.map((v, i) => (
                <div key={i} className={styles.itemVehiculo}>
                  <div className={styles.vehiculoInfo}>
                    <h3>{v.placa_vehiculo}</h3>
                    <p>{v.tipo_vehiculo} • ⏱️ {v.minutos_transcurridos} min</p>
                  </div>
                  <button onClick={() => handleSalida(v.placa_vehiculo)} className={styles.salidaBtn}>
                    Registrar Salida
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlAcceso;