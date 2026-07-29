import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">🏥 MyClinic</Link>
      </div>
      <div className="nav-links">
        <Link to="/login" className="nav-btn login-btn">Đăng nhập</Link>
        <Link to="/register" className="nav-btn register-btn">Đăng ký</Link>
      </div>
    </nav>
  );
}

export default Navbar;