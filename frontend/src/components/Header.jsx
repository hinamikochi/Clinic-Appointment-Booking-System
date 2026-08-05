import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Home, Plus } from 'lucide-react';

export function Header({ title }) {
  const navigate = useNavigate();

  return (
    <header className="admin-header-bar">
      <div className="header-search">
        <Search size={16} color="#8a8a70" />
        <input type="text" placeholder="Tìm kiếm bác sĩ, chuyên khoa, bệnh nhân..." />
      </div>

      <div className="header-actions">
        <button className="btn-primary-natural">
          <Plus size={16} />
          <span>+ Tạo Lịch Hẹn Mới</span>
        </button>

        <button 
          className="btn-secondary-natural"
          onClick={() => navigate('/')} 
          title="Xem Trang Chủ Phòng Khám"
        >
          <Home size={16} />
          <span>Trang Chủ</span>
        </button>

        <div style={{ position: 'relative', cursor: 'pointer', padding: '8px', borderRadius: '50%', background: '#f0f0ea' }}>
          <Bell size={18} color="#5a5a40" />
          <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#c4820e' }} />
        </div>
      </div>
    </header>
  );
}

export default Header;