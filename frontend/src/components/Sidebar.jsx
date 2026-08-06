import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Building2, 
  CalendarDays,
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { full_name: 'Super Admin' };

  // ĐÃ BỔ SUNG TAB QUẢN LÝ LỊCH HẸN
  const navItems = [
    { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'appointments', label: 'Quản Lý Lịch Hẹn', icon: CalendarDays },
    { id: 'doctors', label: 'Quản Lý Bác Sĩ', icon: Stethoscope },
    { id: 'specialties', label: 'Quản Lý Chuyên Khoa', icon: Building2 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon-box">
          <Stethoscope size={22} />
        </div>
        <div>
          <div className="brand-title">
            MyClinic <span className="brand-tag">ADMIN</span>
          </div>
          <div className="brand-sub">Phòng Khám Đa Khoa</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">QUẢN LÝ HỆ THỐNG</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-content">
                <Icon size={18} color={isActive ? '#5a5a40' : '#8a8a70'} />
                <span>{item.label}</span>
              </div>

              {isActive && <ChevronRight size={14} color="#5a5a40" />}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d2d2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.full_name || 'Admin Manager'}
          </div>
          <div style={{ fontSize: '11px', color: '#8a8a70', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} color="#5a5a40" /> System Admin
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          title="Đăng xuất" 
          style={{ background: 'none', border: 'none', padding: '6px', color: '#8a8a70', cursor: 'pointer' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;