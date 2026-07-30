import React from 'react';

function AdminDashboard() {
    return (
        <div className="auth-container" style={{maxWidth: '800px', marginTop: '100px',  color: '#64B5F6', backgroundColor: '#f1f8e9'}}>
            <h1 style={{color: '#64B5F6'}}>Trang dành cho Quản trị viên</h1>
            <p>Chào mừng Admin. Tại đây bạn có thể quản lý bác sĩ và lịch hẹn</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
             <div style={{padding: '20px', background: '#f0f0f0', borderRadius: '10px', color: '#64B5F6'}}>Tổng Bác sĩ: 0</div>
             <div style={{padding: '20px', background: '#f0f0f0', borderRadius: '10px', color: '#64B5F6'}}>Lịch hẹn mới: 0</div>
          </div>   
        </div>
    );
}

export default AdminDashboard;