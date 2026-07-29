import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/register', formData);
      alert(res.data.message);
      navigate('/login'); // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
    }
     catch (err) {
      alert(err.response.data.message || 'Lỗi đăng ký');
    }
  };

  return (
    <div className="auth-container">
       <span className="close-btn" onClick={() => navigate('/')}>&times;</span>
      <h2>Đăng ký tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Họ và tên" onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
        <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Mật khẩu" onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default Register;