import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await axios.post('http://localhost:5001/api/login', formData);
      const user = res.data.user;

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(user));

      // Phân hướng thông minh theo Vai Trò (Role)
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <span className="close-btn" onClick={() => navigate('/')}>&times;</span>
      <h2>Đăng nhập Hệ Thống</h2>
      
      {errorMsg && <div style={{ color: '#b84343', marginBottom: '12px', fontSize: '14px' }}>{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email của bạn" 
          required
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          required
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}

export default Login;