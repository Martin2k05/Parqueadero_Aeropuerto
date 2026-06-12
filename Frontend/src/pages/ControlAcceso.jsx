import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import Tesseract from 'tesseract.js';
import Sidebar from '../components/Sidebar';
import styles from './ControlAcceso.module.css';

const ControlAcceso = () => {
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Automovil');
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const videoRef = useRef(null);

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

  // Nueva función: Escaneo único (usada por el bucle automático)
  const realizarEscaneo = async () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const val = avg > 120 ? 255 : 0; 
      data[i] = data[i + 1] = data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      });
      const textoLimpio = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const match = textoLimpio.match(/([A-Z]{3}[0-9]{3})/);
      return match ? match[1] : null;
    } catch { return null; }
  };

  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCamaraAbierta(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Bucle automático de detección cada 1.5 segundos
          const intervalo = setInterval(async () => {
            if (!videoRef.current || !videoRef.current.srcObject) {
              clearInterval(intervalo);
              return;
            }
            
            const placaDetectada = await realizarEscaneo();
            if (placaDetectada) {
              setPlaca(placaDetectada);
              toast.success("¡Placa detectada automáticamente: " + placaDetectada + "!");
              stream.getTracks().forEach(t => t.stop());
              setCamaraAbierta(false);
              clearInterval(intervalo);
            }
          }, 1500);
        }
      }, 500);
    } catch (err) {
      toast.error("No se pudo acceder a la cámara.");
    }
  };

  const handleIngreso = async (e) => {
    e.preventDefault();
    if(!placa) return;
    const res = await fetch('http://localhost:5000/api/parking/ingreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placa, tipoVehiculo: tipo })
    });
    if(res.ok) { setPlaca(''); cargarVehiculos(); toast.success("Ingreso registrado"); }
    else { const data = await res.json(); toast.error(data.message || "Error al registrar"); }
  };

  const handleSalida = async (placaSalida) => {
    const res = await fetch('http://localhost:5000/api/parking/salida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placaSalida })
    });
    const data = await res.json();
    if(res.ok) { toast.success(data.message || "Salida registrada"); cargarVehiculos(); }
    else { toast.error(data.message || "Error al registrar salida"); }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}><h1>Control de Acceso</h1></div>
        
        <div className={styles.panel}>
          <h2>Registrar Ingreso</h2>
          <form onSubmit={handleIngreso} className={styles.formInline}>
            <div className={styles.inputGroup}>
              <input type="text" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="Placa / ID" />
            </div>
            <div className={styles.inputGroup}>
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="Automovil">Automóvil</option>
                <option value="Campero">Campero</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Microbus">Microbuses</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Bicicleta">Bicicleta</option>
              </select>
            </div>
            <button type="button" onClick={abrirCamara} className={styles.cameraBtn}> Escaneo Automático</button>
            <button type="submit" className={styles.submitBtn}>Registrar</button>
          </form>
        </div>

        {camaraAbierta && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <p style={{color: 'white', textAlign: 'center'}}> Escaneando placa automáticamente...</p>
              <video ref={videoRef} autoPlay playsInline style={{width: '100%', borderRadius: '10px'}} />
              <button onClick={() => { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setCamaraAbierta(false); }} className={styles.salidaBtn} style={{marginTop: '15px'}}>Cancelar Escaneo</button>
            </div>
          </div>
        )}

        <div className={styles.panel}>
          <h2>Vehículos en Parqueadero</h2>
          <input className={styles.searchBar} placeholder="🔍 Buscar..." onChange={(e) => setBusqueda(e.target.value)} />
          <div className={styles.listaVehiculos}>
            {lista.filter(v => v.placa_vehiculo.toLowerCase().includes(busqueda.toLowerCase())).map((v, i) => (
              <div key={i} className={styles.itemVehiculo}>
                <div className={styles.vehiculoInfo}><h3>{v.placa_vehiculo}</h3><p>{v.tipo_vehiculo}</p></div>
                <button onClick={() => handleSalida(v.placa_vehiculo)} className={styles.salidaBtn}>Salida</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ControlAcceso;