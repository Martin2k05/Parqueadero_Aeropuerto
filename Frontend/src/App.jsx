
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import ClienteDashboard from './pages/ClienteDashboard';
import OperarioDashboard from './pages/OperarioDashboard';
import ControlAcceso from './pages/ControlAcceso';
import ProtectedRoute from './components/ProtectedRoute';

import MiPlan from './pages/MiPlan';
import MiPerfil from './pages/MiPerfil';

const Clientes = () => <div style={{ padding: '20px', color: 'white' }}><h2>Gestión de Clientes</h2></div>;
const Reportes = () => <div style={{ padding: '20px', color: 'white' }}><h2>Reportes y Estadísticas</h2></div>;
const Tarifas = () => <div style={{ padding: '20px', color: 'white' }}><h2>Configuración de Tarifas</h2></div>;

function App() {
  return (
    <BrowserRouter>
      {/* Añade el ToastContainer aquí */}
      <ToastContainer position="top-right" theme="dark" autoClose={3000} />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard-cliente" element={
          <ProtectedRoute rolesPermitidos={['Cliente']}>
            <ClienteDashboard />
          </ProtectedRoute>
        } />
        <Route path="/mi-plan" element={
          <ProtectedRoute rolesPermitidos={['Cliente']}>
            <MiPlan />
          </ProtectedRoute>
        } />
        <Route path="/mi-perfil" element={
          <ProtectedRoute rolesPermitidos={['Cliente']}>
            <MiPerfil />
          </ProtectedRoute>
        } />

        <Route path="/dashboard-monitoreo" element={
          <ProtectedRoute rolesPermitidos={['Operario', 'Admin']}>
            <OperarioDashboard />
          </ProtectedRoute>
        } />

        <Route path="/control-acceso" element={
          <ProtectedRoute rolesPermitidos={['Operario', 'Admin']}>
            <ControlAcceso />
          </ProtectedRoute>
        } />

        <Route path="/clientes" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <Clientes />
          </ProtectedRoute>
        } />
        <Route path="/reportes" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <Reportes />
          </ProtectedRoute>
        } />
        <Route path="/tarifas" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <Tarifas />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;