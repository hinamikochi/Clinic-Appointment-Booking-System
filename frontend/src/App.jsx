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

// Kiểm tra quyền Admin
const ProtectedAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'admin') return children;
  } catch (e) { console.error(e); }

  return <Navigate to="/login" replace />;
};

// Kiểm tra quyền Bệnh Nhân
const ProtectedPatientRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'patient') return children;
  } catch (e) { console.error(e); }

  return children; // Mặc định mở
};

function MainLayout() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/patient');

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

        {/* Route Bệnh Nhân Riêng */}
        <Route 
          path="/patient" 
          element={
            <ProtectedPatientRoute>
              <PatientDashboard />
            </ProtectedPatientRoute>
          } 
        />

        <Route path="/doctor" element={<DoctorDashboard />} />
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