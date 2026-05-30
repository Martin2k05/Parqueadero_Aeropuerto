import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import styles from './ControlAcceso.module.css';

const ControlAcceso = () => {
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Automovil');
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const cargarVehiculos = () => {
    fetch('http://localhost:5000/api/parking/activos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setLista(Array.isArray(data) ? data : []))
    .catch(err => { console.error(err); setLista([]); });
  };

  useEffect(() => {
    cargarVehiculos();
    const interval = setInterval(cargarVehiculos, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleIngreso = async (e) => {
    e.preventDefault();
    if(!placa) return;
    
    const res = await fetch('http://localhost:5000/api/parking/ingreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placa, tipoVehiculo: tipo })
    });
    const data = await res.json();
    
    if(res.ok) {
        toast.success("Ingreso registrado con éxito");
        setPlaca('');
        cargarVehiculos();
    } else {
        toast.error(data.message || "Error al registrar ingreso");
    }
  };

  const handleSalida = async (placaSalida) => {
    const res = await fetch('http://localhost:5000/api/parking/salida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placaSalida })
    });
    const data = await res.json();
    
    if(res.ok) {
        toast.success(data.message); // Aquí aparecerá el precio enviado por el backend
        cargarVehiculos();
    } else {
        toast.error("Error al registrar salida");
    }
  };

  const listaFiltrada = lista.filter(v => 
    v.placa_vehiculo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Control de Acceso</h1>
          <p>Registro de ingresos y salidas vehiculares</p>
        </div>

        <div className={styles.panel}>
          <h2>Registrar Ingreso</h2>
          <form onSubmit={handleIngreso} className={styles.formInline}>
            <div className={styles.inputGroup}>
              <label>Identificador ({tipo === 'Bicicleta' ? '10 carac.' : '6 carac.'})</label>
              <input 
                type="text" 
                value={placa} 
                placeholder={tipo === 'Bicicleta' ? "XXXXXXXXXX" : "ABC123"} 
                onChange={e => setPlaca(e.target.value.toUpperCase())} 
                maxLength={tipo === 'Bicicleta' ? 10 : 6} 
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Tipo de Vehículo</label>
              <select value={tipo} onChange={e => { setTipo(e.target.value); setPlaca(''); }}>
                <option value="Automovil">Automóvil</option>
                <option value="Campero">Campero</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Microbus">Microbuses</option>
                <option value="Motocarro">Motocarro</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Bicicleta">Bicicleta</option>
              </select>
            </div>
            <button type="submit" className={styles.submitBtn}>Registrar</button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.listHeader}>
            <h2>Vehículos en Parqueadero</h2>
            <input 
              className={styles.searchBar} 
              placeholder="🔍 Buscar placa..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
          <div className={styles.listaVehiculos}>
            {listaFiltrada.length === 0 ? <p className={styles.vacio}>No hay vehículos registrados.</p> :
              listaFiltrada.map((v, i) => (
                <div key={i} className={styles.itemVehiculo}>
                  <div className={styles.vehiculoInfo}>
                    <h3>{v.placa_vehiculo}</h3>
                    <p>{v.tipo_vehiculo} • ⏱️ {v.minutos_transcurridos || 0} min</p>
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