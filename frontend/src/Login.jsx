import React, { useState } from 'react';
import api from './api';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Stethoscope, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  X,
  Sparkles
} from 'lucide-react';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
  
    try {
      const res = await api.post('/login', formData);
      const user = res.data.user;

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-auth-wrapper">
      <div className="split-auth-card">
        <button className="auth-close-btn" onClick={() => navigate('/')} title="Về trang chủ">
          <X size={18} />
        </button>

        <div className="auth-banner-side">
          <div className="banner-overlay"></div>
          
          <div className="banner-brand-box">
            <div className="banner-brand-icon">
              <Stethoscope size={26} color="#ffffff" />
            </div>
            <div>
              <div className="banner-brand-name">MyClinic</div>
              <div className="banner-brand-sub">Hệ Thống Đặt Lịch Khám Trực Tuyến</div>
            </div>
          </div>

          <div className="banner-main-content">
            <h1 className="banner-headline">
              Đặt Lịch Khám Bệnh <br />
              <span className="highlight-text">Nhanh Chóng & Tiện Lợi</span>
            </h1>
            <p className="banner-description">
              Kết nối trực tiếp với đội ngũ Bác sĩ CKI/CKII giàu kinh nghiệm. Thăm khám không phải chờ đợi.
            </p>
          </div>

          <div className="banner-footer-note">
            © 2026 MyClinic Health Portal • Bảo mật & Tin cậy
          </div>
        </div>

        <div className="auth-form-side">
          <div className="form-header">
            <h2>Chào mừng bạn trở lại </h2>
            <p>Vui lòng nhập thông tin tài khoản để tiếp tục</p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-field-group">
              <label>Địa chỉ Email</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  placeholder="email@example.com" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-field-group">
              <label>Mật khẩu</label>
              <div className="input-icon-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
                <button 
                  type="button" 
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-icon" /> Đang xác thực...
                </>
              ) : (
                <>
                  Đăng Nhập Hệ Thống <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <span>Bạn chưa có tài khoản?</span>
            <Link to="/register" className="auth-link">Đăng ký tài khoản mới</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;