import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Register from './Register';
import Login from './Login';
import AdminDashboard from './AdminDashboard'; 
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import './App.css';

// Bảo vệ Trang Admin
const ProtectedAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'admin') return children;
  } catch (e) { console.error(e); }

  return <Navigate to="/login" replace />;
};

// Bảo vệ Trang Bác Sĩ
const ProtectedDoctorRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'doctor') return children;
  } catch (e) { console.error(e); }

  return children;
};

// Bảo vệ Trang Bệnh Nhân
const ProtectedPatientRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'patient') return children;
  } catch (e) { console.error(e); }

  return children;
};

function MainLayout() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/admin') || 
                           location.pathname.startsWith('/patient') || 
                           location.pathname.startsWith('/doctor');

  return (
    <div className={isDashboardRoute ? 'App-admin' : 'App'}>
      {/* Ẩn Navbar công khai khi ở các trang Dashboard */}
      {!isDashboardRoute && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Route Admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } 
        />

        {/* Route Bệnh Nhân */}
        <Route 
          path="/patient" 
          element={
            <ProtectedPatientRoute>
              <PatientDashboard />
            </ProtectedPatientRoute>
          } 
        />

        {/* Route Bác Sĩ */}
        <Route 
          path="/doctor" 
          element={
            <ProtectedDoctorRoute>
              <DoctorDashboard />
            </ProtectedDoctorRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;