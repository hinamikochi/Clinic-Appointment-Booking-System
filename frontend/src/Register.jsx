import React, { useState } from 'react';
import api from './api';
import { useNavigate, Link } from 'react-router-dom'; 
import { toast } from 'react-hot-toast';
import { 
  Stethoscope, 
  User, 
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

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post('/register', formData);
      toast.success(res.data.message || " Đăng ký tài khoản thành công!");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đăng ký tài khoản');
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
              Tạo Tài Khoản Khám Bệnh <br />
              <span className="highlight-text">Nhanh Chóng & Dễ Dàng</span>
            </h1>
            <p className="banner-description">
              Đăng ký ngay để chủ động đặt lịch khám, theo dõi hồ sơ y tế và nhận thông báo nhắc lịch tự động.
            </p>
          </div>

          <div className="banner-footer-note">
            © 2026 MyClinic Health Portal • Bảo mật & Tin cậy
          </div>
        </div>

        <div className="auth-form-side">
          <div className="form-header">
            <h2>Tạo Tài Khoản Mới </h2>
            <p>Điền thông tin cá nhân để mở hồ sơ theo dõi sức khỏe</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-field-group">
              <label>Họ và Tên</label>
              <div className="input-icon-wrapper">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-field-group">
              <label>Địa chỉ Email</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  placeholder="benhnhan@gmail.com" 
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
                  <Loader2 size={18} className="spinner-icon" /> Đang đăng ký...
                </>
              ) : (
                <>
                  Hoàn Tất Đăng Ký <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <span>Bạn đã có tài khoản?</span>
            <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;