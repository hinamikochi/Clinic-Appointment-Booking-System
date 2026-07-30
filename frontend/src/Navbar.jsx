import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  }

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">🏥 MyClinic</Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span style={{marginRight: '15px', color: '#333'}}>Chào, <strong>{user.full_name}</strong></span>

            {/*Admin */}
            {user.role == 'admin' && 
              <Link to="/admin" className="nav-btn admin-btn" style ={{color: 'blue', marginRight: '10px', 
                fontWeight: 'bold'}}
              >Quản trị</Link>}

              {/* Doctor */}
              {user.role === 'doctor' && <Link to="/doctor" className="nav-btn" style={{color: 'green'}}>Lịch khám</Link>}

            {/* Đăng xuất */}
            <button onClick={handleLogout} className="nav-btn register-btn" style={{cursor: 'pointer'}}>Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn login-btn">Đăng nhập</Link>
            <Link to="/register" className="nav-btn register-btn">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;