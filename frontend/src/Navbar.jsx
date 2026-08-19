import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, ShieldCheck, LogOut, LogIn, UserPlus, CalendarCheck } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/" className="nav-brand-link">
          <div className="brand-icon-mini">
            <Stethoscope size={18} color="#ffffff" />
          </div>
          <span className="brand-text-garamond">
            MyClinic <span className="brand-tag-mini">MEDICAL</span>
          </span>
        </Link>
      </div>

      <div className="nav-links">
        {user ? (
          <div className="user-nav-box">
            <span className="user-welcome-text">
              Chào, <strong className="user-name-serif">{user.full_name}</strong>
            </span>

            {/* Nút Quản trị cho Admin */}
            {user.role === 'admin' && (
              <Link to="/admin" className="nav-btn-admin">
                <ShieldCheck size={16} /> Trang Quản Trị
              </Link>
            )}

            {/* Nút Bệnh Nhân */}
            {user.role === 'patient' && (
              <Link to="/patient" className="nav-btn-admin">
                <CalendarCheck size={16} /> Trang Đặt Khám Của Tôi
              </Link>
            )}

            {/* Nút Bác sĩ */}
            {user.role === 'doctor' && (
              <Link to="/doctor" className="nav-btn-doctor">
                🩺 Lịch Khám
              </Link>
            )}

            <button onClick={handleLogout} className="nav-btn-logout">
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="nav-btn-login">
              <LogIn size={15} /> Đăng nhập
            </Link>
            <Link to="/register" className="nav-btn-register">
              <UserPlus size={15} /> Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;