import LegacyDialogSupport from './components/LegacyDialogSupport';
import PasswordRecovery from './PasswordRecovery';
import { VerifyEmail } from './components/EmailAccount';
import React, {lazy, Suspense} from 'react';
import './AdminDashboard.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Home from './Home';
import Register from './Register';
import Login from './Login';
const AdminDashboard=lazy(()=>import('./AdminDashboard'));
const DoctorDashboard=lazy(()=>import('./DoctorDashboard'));
const PatientDashboard=lazy(()=>import('./PatientDashboard'));
import './App.css';


// Bảo vệ quyền Admin
const ProtectedAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr || !localStorage.getItem('token')) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'admin') return children;
  } catch (e) { console.error(e); }

  return <Navigate to="/login" replace />;
};

// Bảo vệ quyền Bác Sĩ
const ProtectedDoctorRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr || !localStorage.getItem('token')) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'doctor') return children;
  } catch (e) { console.error(e); }

  return <Navigate to="/login" replace />;
};

// Bảo vệ quyền Bệnh Nhân
const ProtectedPatientRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr || !localStorage.getItem('token')) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'patient') return children;
  } catch (e) { console.error(e); }

  return <Navigate to="/login" replace />;
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
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<PasswordRecovery reset />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

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
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 9999999
        }}
        toastOptions={{
          style: {
            zIndex: 9999999
          }
        }}
      />
      <LegacyDialogSupport /><Suspense fallback={<p role="status">Đang tải trang…</p>}><MainLayout /></Suspense>
    </Router>
  );
}

export default App;