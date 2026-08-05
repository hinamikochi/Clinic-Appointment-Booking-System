import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Register from './Register';
import Login from './Login';
import AdminDashboard from './AdminDashboard'; 
import DoctorDashboard from './DoctorDashboard';
import './App.css';

// Component kiểm tra quyền truy cập Admin
const ProtectedAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'admin') {
      return children;
    }
  } catch (e) {
    console.error(e);
  }

  return <Navigate to="/login" replace />;
};

// Component chính giúp ẩn Navbar công khai khi ở trang Admin
function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={isAdminRoute ? 'App-admin' : 'App'}>
      {/* Chỉ hiển thị Navbar chính khi KHÔNG ở trang Admin */}
      {!isAdminRoute && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
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