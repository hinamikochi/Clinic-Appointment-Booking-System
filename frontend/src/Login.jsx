import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/login', formData);
      alert("Đăng nhập thành công!");
      console.log("Token của bạn:", res.data.token);
      // Lưu token vào trình duyệt để dùng cho các trang sau
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard'); // Chuyển hướng đến trang dashboard sau khi đăng nhập thành công
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi đăng nhập');
    }
  };

  return (
    <div className="auth-container">
       <span className="close-btn" onClick={() => navigate('/')}>&times;</span>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Mật khẩu" onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}

export default Login;