import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import SpecialtyManager from './SpecialtyManager';
import DoctorManager from './DoctorManager';
import AppointmentsView from './components/AppointmentsView';
import ProfileView from './components/ProfileView';
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="admin-main-content">
        <Header title={activeTab} />
        <div className="admin-body">
          {activeTab === 'overview' && (
            <OverviewView docCount={docCount} specCount={specCount} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'doctors' && (
            <DoctorManager onUpdate={fetchCounts} />
          )}
          {activeTab === 'specialties' && (
            <SpecialtyManager onUpdate={fetchCounts} />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsView />
          )}
          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;