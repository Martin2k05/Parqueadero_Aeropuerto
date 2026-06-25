import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import styles from '../pages/Styles/ControlAcceso.module.css';

const ControlAcceso = () => {
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Automovil');
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [escanearAutomatico, setEscanearAutomatico] = useState(false);
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

  // Lógica de escaneo automático: captura y envía al backend cada 2.5 segundos
  useEffect(() => {
    let interval;
    if (camaraAbierta && escanearAutomatico) {
      interval = setInterval(() => {
        capturarYEnviar();
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [camaraAbierta, escanearAutomatico]);

  const procesarConIA = async (canvas) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      // Asegúrate de que el nombre aquí coincida con upload.single('foto')
      formData.append('foto', blob, 'placa.jpg'); 

      console.log("Enviando foto a la API..."); // Para ver si el Frontend arranca

      try {
        const res = await fetch('http://localhost:5000/api/parking/leer-placa', {
          method: 'POST',
          headers: { 
            // IMPORTANTE: Al usar FormData con fetch, NO pongas 'Content-Type': 'multipart/form-data'
            // El navegador lo genera automáticamente con los boundaries correctos.
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: formData
        });
        
        const data = await res.json();
        console.log("Respuesta del servidor:", data); // Mira esto en la consola del navegador (F12)

        if (res.ok && data.placa) {
          setPlaca(data.placa.toUpperCase());
          toast.success("Placa detectada: " + data.placa);
          cerrarCamara();
        }
      } catch (err) {
        console.error("Error crítico de conexión:", err);
      }
    }, 'image/jpeg', 0.8);
  };
  
  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCamaraAbierta(true);
      setEscanearAutomatico(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 500);
    } catch (err) { toast.error("No se pudo acceder a la cámara."); }
  };

  const cerrarCamara = () => {
    setEscanearAutomatico(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCamaraAbierta(false);
  };

  const capturarYEnviar = () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    procesarConIA(canvas);
  };

  const handleIngreso = async (e) => {
    e.preventDefault();
    const placaLimpia = placa.trim().toUpperCase();
    if(!placaLimpia) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/parking/ingreso', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ placaVehiculo: placaLimpia, tipoVehiculo: tipo })
      });
      const data = await res.json();
      if(res.ok) { 
        setPlaca(''); 
        cargarVehiculos(); 
        toast.success(data.message); 
      } else { 
        toast.error(data.message || "Error al registrar"); 
      }
    } catch (error) { toast.error("Error de conexión con el servidor"); }
  };

  const handleSalida = async (placaSalida) => {
    const res = await fetch('http://localhost:5000/api/parking/salida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ placaVehiculo: placaSalida })
    });
    const data = await res.json();
    if(res.ok) { 
        toast.success(data.message || "Salida registrada"); 
        cargarVehiculos(); 
    } else { 
        toast.error(data.message || "Error al registrar salida"); 
    }
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
            <button type="button" onClick={abrirCamara} className={styles.cameraBtn}>Escaneo IA Automático</button>
            <button type="submit" className={styles.submitBtn}>Registrar</button>
          </form>
        </div>

        {camaraAbierta && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <video ref={videoRef} autoPlay playsInline style={{width: '100%', borderRadius: '10px'}} />
              <button onClick={cerrarCamara} className={styles.salidaBtn} style={{marginTop: '10px'}}>Detener Escaneo</button>
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