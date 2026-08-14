import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, KeyRound, Save } from 'lucide-react';

export function ProfileView() {
  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : { id: 0, full_name: '', email: '' };

  const [userInfo, setUserInfo] = useState(initialUser);

  const [fullName, setFullName] = useState(initialUser.full_name || '');
  const [phone, setPhone] = useState(initialUser.phone || '');
  const [gender, setGender] = useState(initialUser.gender || 'Nam');
  const [address, setAddress] = useState(initialUser.address || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchLatestUser = async () => {
      try {
        if (!initialUser.id) return;
        const res = await axios.get(`http://localhost:5001/api/users/${initialUser.id}`);
        if (res.data) {
          setUserInfo(res.data);
          setFullName(res.data.full_name || '');
          setPhone(res.data.phone || '');
          setGender(res.data.gender || 'Nam');
          setAddress(res.data.address || '');
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Lỗi nạp thông tin cá nhân:", err);
      }
    };
    fetchLatestUser();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await axios.put(`http://localhost:5001/api/users/profile/${userInfo.id}`, {
        full_name: fullName,
        phone,
        gender,
        address
      });
      alert("🎉 " + res.data.message);
      setUserInfo(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu mới và Nhập lại mật khẩu không trùng khớp!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await axios.put(`http://localhost:5001/api/users/change-password/${userInfo.id}`, {
        old_password: oldPassword,
        new_password: newPassword
      });
      alert("🎉 " + res.data.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* CẬP NHẬT THÔNG TIN CÁ NHÂN */}
      <div className="natural-section-card">
        <h3 className="section-title-garamond" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} color="#5a5a40" /> Thông Tin Cá Nhân
        </h3>
        <p style={{ fontSize: '12px', color: '#8a8a70', marginBottom: '20px' }}>
          Cập nhật họ tên, số điện thoại liên hệ và địa chỉ của bạn.
        </p>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Họ và tên *</label>
            <input 
              type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#8a8a70' }}>Email đăng ký</label>
            <input 
              type="email" disabled value={userInfo.email || ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', backgroundColor: '#f5f5f0', cursor: 'not-allowed', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Số điện thoại</label>
              <input 
                type="text" placeholder="0912 xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Giới tính</label>
              <select 
                value={gender} onChange={(e) => setGender(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Địa chỉ thường trú</label>
            <input 
              type="text" placeholder="Quận/Huyện, Thành Phố..." value={address} onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <button type="submit" className="btn-primary-natural" disabled={updatingProfile} style={{ justifyContent: 'center', marginTop: '10px' }}>
            <Save size={16} /> {updatingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}
          </button>
        </form>
      </div>

      {/* ĐỔI MẬT KHẨU */}
      <div className="natural-section-card">
        <h3 className="section-title-garamond" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={20} color="#5a5a40" /> Đổi Mật Khẩu Tài Khoản
        </h3>
        <p style={{ fontSize: '12px', color: '#8a8a70', marginBottom: '20px' }}>
          Đổi mật khẩu định kỳ để nâng cao tính bảo mật.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Mật khẩu hiện tại *</label>
            <input 
              type="password" required placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Mật khẩu mới *</label>
            <input 
              type="password" required placeholder="Ít nhất 6 ký tự" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Xác nhận mật khẩu mới *</label>
            <input 
              type="password" required placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <button type="submit" className="btn-primary-natural" disabled={changingPassword} style={{ justifyContent: 'center', marginTop: '10px' }}>
            <KeyRound size={16} /> {changingPassword ? 'Đang xử lý...' : 'Xác Nhận Đổi Mật Khẩu'}
          </button>
        </form>
      </div>

    </div>
  );
}

export default ProfileView;