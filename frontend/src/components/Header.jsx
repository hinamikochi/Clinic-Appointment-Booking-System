import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Home, Plus, CheckCircle2, AlertCircle, X, Stethoscope, Building2, User } from 'lucide-react';

export function Header({ title, onOpenBooking, setActiveTab, onSelectSearchItem }) {
  const navigate = useNavigate();

  // State Tìm Kiếm & Dữ Liệu Tra Cứu
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // State Thông Báo
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);

  const fetchData = async () => {
    try {
      const resDocs = await axios.get('http://localhost:5001/api/doctors');
      setDoctors(resDocs.data);

      const resSpecs = await axios.get('http://localhost:5001/api/specialties');
      setSpecialties(resSpecs.data);

      const resApts = await axios.get('http://localhost:5001/api/appointments');
      setAppointments(resApts.data);

      const pending = resApts.data.filter(a => a.status === 'pending');
      setPendingAppointments(pending);
    } catch (err) {
      console.error("Lỗi nạp dữ liệu Header:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const query = searchTerm.trim().toLowerCase();
  
  const filteredDoctors = query ? doctors.filter(d => 
    d.User?.full_name?.toLowerCase().includes(query) || 
    d.Specialty?.name?.toLowerCase().includes(query)
  ) : [];

  const filteredSpecialties = query ? specialties.filter(s => 
    s.name?.toLowerCase().includes(query)
  ) : [];

  const filteredAppointments = query ? appointments.filter(a => 
    a.patient_name?.toLowerCase().includes(query) || 
    a.patient_phone?.includes(query)
  ) : [];

  const hasResults = filteredDoctors.length > 0 || filteredSpecialties.length > 0 || filteredAppointments.length > 0;

  // ẤN Enter để tìm kiếm
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!searchTerm.trim()) return;
      
      setShowSearchDropdown(false);

      // Tự động phân loại và chuyển sang tab khớp từ khóa nhất khi ấn ENTER
      if (filteredDoctors.length > 0) {
        if (onSelectSearchItem) onSelectSearchItem('doctors', searchTerm);
      } else if (filteredSpecialties.length > 0) {
        if (onSelectSearchItem) onSelectSearchItem('specialties', searchTerm);
      } else {
        if (onSelectSearchItem) onSelectSearchItem('appointments', searchTerm);
      }
    }
  };

  return (
    <header className="admin-header-bar" style={{ position: 'relative' }}>
      {/* 1. THANH TÌM KIẾM HỆ THỐNG */}
      <div className="header-search" style={{ position: 'relative' }}>
        <Search size={16} color="#8a8a70" />
        <input 
          type="text" 
          placeholder="Tìm kiếm bác sĩ, chuyên khoa, bệnh nhân... (Ấn Enter)" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSearchDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSearchDropdown(true)}
        />

        {/* DROPDOWN KẾT QUẢ GỢI Ý */}
        {showSearchDropdown && query && (
          <div style={{
            position: 'absolute', top: '48px', left: 0, width: '100%', minWidth: '380px',
            backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.18)',
            border: '1px solid #e6e6df', zIndex: 1000, overflow: 'hidden', padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 8px 8px', borderBottom: '1px solid #f0f0ea' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#8a8a70', textTransform: 'uppercase' }}>
                KẾT QUẢ GỢI Ý (Bấm chuột hoặc ấn Enter)
              </span>
              <button onClick={() => setShowSearchDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8a70' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', marginTop: '8px' }}>
              {/* NHÓM 1: BÁC SĨ */}
              {filteredDoctors.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a40', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Stethoscope size={12} /> BÁC SĨ ({filteredDoctors.length})
                  </div>
                  {filteredDoctors.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => {
                        if (onSelectSearchItem) {
                          onSelectSearchItem('doctors', doc.User?.full_name);
                        }
                        setShowSearchDropdown(false);
                      }}
                      style={{ padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#2d2d2a' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdfbf7'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <b>{doc.degree} {doc.User?.full_name}</b> - <span style={{ color: '#8a8a70', fontSize: '12px' }}>{doc.Specialty?.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* NHÓM 2: CHUYÊN KHOA */}
              {filteredSpecialties.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a40', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} /> CHUYÊN KHOA ({filteredSpecialties.length})
                  </div>
                  {filteredSpecialties.map(spec => (
                    <div 
                      key={spec.id}
                      onClick={() => {
                        if (onSelectSearchItem) {
                          onSelectSearchItem('specialties', spec.name);
                        }
                        setShowSearchDropdown(false);
                      }}
                      style={{ padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#2d2d2a' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdfbf7'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <b>{spec.name}</b>
                    </div>
                  ))}
                </div>
              )}

              {/* NHÓM 3: BỆNH NHÂN */}
              {filteredAppointments.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a40', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} /> BỆNH NHÂN / PHIẾU ĐẶT ({filteredAppointments.length})
                  </div>
                  {filteredAppointments.map(apt => (
                    <div 
                      key={apt.id}
                      onClick={() => {
                        if (onSelectSearchItem) {
                          onSelectSearchItem('appointments', apt.patient_name, apt);
                        }
                        setShowSearchDropdown(false);
                      }}
                      style={{ padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#2d2d2a' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdfbf7'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <b>{apt.patient_name}</b> ({apt.patient_phone}) - <span style={{ color: '#8a8a70', fontSize: '12px' }}>Mã: LH-{apt.id}</span>
                    </div>
                  ))}
                </div>
              )}

              {!hasResults && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8a8a70', fontSize: '13px' }}>
                  Không tìm thấy kết quả nào cho từ khóa "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. CÁC NÚT THAO TÁC */}
      <div className="header-actions">
        <button className="btn-primary-natural" onClick={onOpenBooking}>
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

        {/* NÚT THÔNG BÁO */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              position: 'relative', cursor: 'pointer', padding: '10px', borderRadius: '50%', 
              background: showNotifications ? '#e6e6df' : '#f0f0ea', transition: 'all 0.2s ease' 
            }}
            title="Thông báo hệ thống"
          >
            <Bell size={18} color="#5a5a40" />
            {pendingAppointments.length > 0 && (
              <span style={{ 
                position: 'absolute', top: '4px', right: '4px', width: '9px', height: '9px', 
                borderRadius: '50%', background: '#b84343', border: '2px solid #ffffff' 
              }} />
            )}
          </div>

          {/* POPUP THÔNG BÁO */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '50px', right: 0, width: '340px',
              backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              border: '1px solid #e6e6df', zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 18px', backgroundColor: '#fdfbf7', borderBottom: '1px solid #e6e6df',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} /> Thông Báo Hệ Thống ({pendingAppointments.length})
                </div>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8a70' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '10px' }}>
                {pendingAppointments.length > 0 ? (
                  pendingAppointments.map((apt) => (
                    <div 
                      key={apt.id}
                      onClick={() => {
                        if (onSelectSearchItem) onSelectSearchItem('appointments', apt.patient_name, apt);
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '12px', borderRadius: '12px', marginBottom: '6px',
                        backgroundColor: '#fdfbf7', border: '1px solid #f0f0ea', cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdfbf7'}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#2d2d2a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={14} color="#c4820e" /> Phiếu đặt lịch mới: LH-{apt.id}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5a5a40', marginTop: '4px' }}>
                        Bệnh nhân: <b>{apt.patient_name}</b> ({apt.patient_phone})
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#8a8a70', fontSize: '13px' }}>
                    <CheckCircle2 size={24} color="#2e6f40" style={{ display: 'block', margin: '0 auto 6px auto' }} />
                    Hiện tại không có thông báo mới.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;