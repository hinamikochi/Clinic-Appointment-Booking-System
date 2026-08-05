import React, { useState, useEffect } from 'react';
import SpecialtyManager from './SpecialtyManager';
import DoctorManager from './DoctorManager';
import axios from 'axios';

function AdminDashboard() {
  const [specCount, setSpecCount] = useState(0);
  const [docCount, setDocCount] = useState(0);

  //  lấy dữ liệu từ server về và đếm
  const fetchCounts = async () => {
    try {
      const resSpec = await axios.get('http://localhost:5001/api/specialties');
      setSpecCount(resSpec.data.length);

      const resDoc = await axios.get('http://localhost:5001/api/users/doctors');
      setDocCount(resDoc.data.length);
    } catch (err) {
      console.error("Lỗi khi cập nhật số lượng thống kê:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div style={{ marginTop: '100px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        backgroundColor: '#e3f2fd', 
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '900px',
        textAlign: 'center',
        border: '1px solid #bbdefb'
      }}>
        <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>Trang dành cho Quản trị viên</h1>
        <p style={{ color: '#555' }}>Chào mừng Admin. Tại đây bạn có thể quản lý bác sĩ và chuyên khoa</p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
          {/* HIỆN SỐ LƯỢNG BÁC SĨ */}
          <div style={cardStyle}>
            <h3>Bác sĩ</h3>
            <span style={{fontSize: '24px', fontWeight: 'bold'}}>{docCount}</span>
          </div>
          
          {/* HIỆN SỐ LƯỢNG CHUYÊN KHOA */}
          <div style={cardStyle}>
            <h3>Chuyên khoa</h3>
            <span style={{fontSize: '24px', fontWeight: 'bold'}}>{specCount}</span>
          </div>
        </div>

        <SpecialtyManager onUpdate={fetchCounts} /> 
         <DoctorManager onUpdate={fetchCounts} /> 
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#fff', padding: '15px', borderRadius: '10px', width: '140px', color: '#1976d2' };

export default AdminDashboard;