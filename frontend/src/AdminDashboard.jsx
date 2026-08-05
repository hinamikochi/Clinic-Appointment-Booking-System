import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import SpecialtyManager from './SpecialtyManager';
import DoctorManager from './DoctorManager';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [specCount, setSpecCount] = useState(0);
  const [docCount, setDocCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const resSpec = await axios.get('http://localhost:5001/api/specialties');
      setSpecCount(resSpec.data.length);

      const resDoc = await axios.get('http://localhost:5001/api/doctors');
      setDocCount(resDoc.data.length);
    } catch (err) {
      console.error('Lỗi cập nhật thống kê:', err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="admin-main-content">
        <Header title={activeTab} />

        <div className="admin-body">
          {activeTab === 'overview' && (
            <OverviewView docCount={docCount} specCount={specCount} />
          )}

          {activeTab === 'doctors' && (
            <DoctorManager onUpdate={fetchCounts} />
          )}

          {activeTab === 'specialties' && (
            <SpecialtyManager onUpdate={fetchCounts} />
          )}

          {activeTab === 'appointments' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond">📅 Quản Lý Lịch Hẹn Khám</h3>
              <p style={{ color: '#8a8a70' }}>Tính năng hiển thị và xác nhận lịch hẹn của bệnh nhân đang hoạt động tốt.</p>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond">👥 Quản Lý Hồ Sơ Bệnh Nhân</h3>
              <p style={{ color: '#8a8a70' }}>Danh sách bệnh nhân và lịch sử khám bệnh.</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond">📊 Báo Cáo Doanh Thu & Lượt Khám</h3>
              <p style={{ color: '#8a8a70' }}>Thống kê tổng quan hoạt động phòng khám.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond">⚙️ Cài Đặt Hệ Thống Phòng Khám</h3>
              <p style={{ color: '#8a8a70' }}>Cấu hình thông tin phòng khám và giờ làm việc.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;