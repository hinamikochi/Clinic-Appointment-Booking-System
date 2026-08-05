import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DoctorManager({ onUpdate }) {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', specialtyId: '', degree: '', image: '', description: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
     try {
        // 1. Gọi API lấy danh sách chuyên khoa
        const resS = await axios.get('http://localhost:5001/api/specialties');
        console.log("Danh sách chuyên khoa nhận được:", resS.data); 
        setSpecialties(resS.data);

        // 2. Gọi API lấy danh sách bác sĩ
        const resD = await axios.get('http://localhost:5001/api/doctors');
        setDoctors(resD.data);
    } catch (err) {
        console.error("Lỗi khi lấy dữ liệu cho DoctorManager:", err);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/admin/doctors', formData);
      alert("Đã tạo tài khoản và hồ sơ bác sĩ thành công!");
      setFormData({ full_name: '', email: '', password: '', specialtyId: '', degree: '', image: '', description: '' });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi tạo bác sĩ");
    }
  };

  return (
    <div style={{ marginTop: '30px', textAlign: 'left', background: '#fff', padding: '20px', borderRadius: '10px', color: '#333' }}>
      <h3 style={{ color: '#2e7d32' }}>+ Thêm mới Bác sĩ vào hệ thống</h3>
      <form onSubmit={handleCreateDoctor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <input type="text" placeholder="Họ tên bác sĩ" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required style={{padding:'10px'}}/>
        <input type="email" placeholder="Email đăng nhập" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{padding:'10px'}}/>
        <input type="password" placeholder="Mật khẩu" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={{padding:'10px'}}/>
        
        <select value={formData.specialtyId} onChange={e => setFormData({...formData, specialtyId: e.target.value})} required style={{padding:'10px'}}>
          <option value="">-- Chọn Chuyên khoa --</option>
          {specialties && specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <input type="text" placeholder="Học vị (VD: Thạc sĩ, Bác sĩ CKI)" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} style={{padding:'10px'}}/>
        <input type="text" placeholder="Link ảnh (URL)" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} style={{padding:'10px'}}/>
        
        <textarea placeholder="Giới thiệu bác sĩ" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{padding:'10px', gridColumn: 'span 2'}} />
        
        <button type="submit" className="register-btn" style={{background: '#2e7d32', margin: 0, gridColumn: 'span 2'}}>Tạo tài khoản bác sĩ</button>
      </form>

      
            <table width="100%" style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'center' }}>
            <th style={{ padding: '12px 10px' }}>Ảnh</th>
            <th style={{ padding: '12px 10px' }}>Bác sĩ</th>
            <th style={{ padding: '12px 10px' }}>Khoa</th>
            <th style={{ padding: '12px 10px' }}>Học vị</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid #eee', textAlign: 'center' }}>
              <td style={{ padding: '10px' }}>
                <img 
                  src={d.image} 
                  width="40" 
                  height="40" 
                  style={{ borderRadius: '50%', objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle' }} 
                  alt="dr" 
                />
              </td>
              <td style={{ padding: '10px' }}>{d.User?.full_name}</td>
              <td style={{ padding: '10px' }}>{d.Specialty?.name}</td>
              <td style={{ padding: '10px' }}>{d.degree}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DoctorManager;