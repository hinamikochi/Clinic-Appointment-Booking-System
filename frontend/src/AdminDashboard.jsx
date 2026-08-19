import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import SpecialtyManager from './SpecialtyManager';
import DoctorManager from './DoctorManager';
import AppointmentsView from './components/AppointmentsView';
import ProfileView from './components/ProfileView';
import BookingModal from './BookingModal';
import { FileText, Pill, Calendar, X } from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [specCount, setSpecCount] = useState(0);
  const [docCount, setDocCount] = useState(0);

  // State Từ khóa Tìm kiếm được chọn
  const [initialSearchQuery, setInitialSearchQuery] = useState('');

  // State Modal Đặt Lịch Hẹn Mới
  const [showBookingModal, setShowBookingModal] = useState(false);

  // State Modal Xem Chi Tiết Bệnh Án
  const [selectedAppointmentRecord, setSelectedAppointmentRecord] = useState(null);
  const [showSearchRecordModal, setShowSearchRecordModal] = useState(false);

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

  // Xử lý khi Admin chọn 1 mục cụ thể từ thanh Tìm Kiếm
  const handleSelectSearchItem = (tab, queryText, aptObj) => {
    setActiveTab(tab);
    setInitialSearchQuery(queryText || '');

    // Nếu chọn bệnh nhân thì mở cửa sổ xem bệnh án
    if (aptObj) {
      setSelectedAppointmentRecord(aptObj);
      setShowSearchRecordModal(true);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="admin-main-content">
        <Header 
          title={activeTab} 
          onOpenBooking={() => setShowBookingModal(true)}
          setActiveTab={setActiveTab}
          onSelectSearchItem={handleSelectSearchItem}
        />
        <div className="admin-body">
          {activeTab === 'overview' && (
            <OverviewView docCount={docCount} specCount={specCount} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'doctors' && (
            <DoctorManager onUpdate={fetchCounts} initialSearchQuery={initialSearchQuery} />
          )}
          {activeTab === 'specialties' && (
            <SpecialtyManager onUpdate={fetchCounts} initialSearchQuery={initialSearchQuery} />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsView initialSearchQuery={initialSearchQuery} />
          )}
          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </div>
      </div>

      {/* MODAL TẠO LỊCH HẸN TRỰC TIẾP CHO ADMIN */}
      {showBookingModal && (
        <BookingModal 
          onClose={() => setShowBookingModal(false)}
          onSuccess={fetchCounts}
        />
      )}

      {/* MODAL XEM CHI TIẾT BỆNH ÁN KHI BẤM TÌM KIẾM BỆNH NHÂN */}
      {showSearchRecordModal && selectedAppointmentRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '650px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: '1px solid #e6e6df', overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#5a5a40', color: '#ffffff', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'serif' }}>
                   KẾT QUẢ KHÁM BỆNH BỆNH NHÂN
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                  Bệnh nhân: {selectedAppointmentRecord.patient_name} ({selectedAppointmentRecord.patient_phone})
                </div>
              </div>
              <button onClick={() => setShowSearchRecordModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#fdfbf7', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8a8a70', textTransform: 'uppercase', fontWeight: '700' }}>Bác sĩ đảm nhận</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d2d2a', marginTop: '2px' }}>
                    {selectedAppointmentRecord.DoctorInfo?.User?.full_name || 'Bác sĩ chuyên khoa'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#8a8a70', textTransform: 'uppercase', fontWeight: '700' }}>Chuyên khoa</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#5a5a40', marginTop: '2px' }}>
                    {selectedAppointmentRecord.Specialty?.name || 'Đa khoa'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#8a8a70', marginBottom: '4px' }}>Triệu chứng ban đầu</div>
                <div style={{ fontSize: '13px', color: '#2d2d2a', fontStyle: 'italic' }}>
                  "{selectedAppointmentRecord.symptoms}"
                </div>
              </div>

              {selectedAppointmentRecord.MedicalRecord ? (
                <>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <FileText size={16} /> CHẨN ĐOÁN BÁC SĨ
                    </div>
                    <div style={{ backgroundColor: '#fdfbf7', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', color: '#2d2d2a', fontWeight: '600' }}>
                      {selectedAppointmentRecord.MedicalRecord.diagnosis}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Pill size={16} /> ĐƠN THUỐC KÊ ĐƠN
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', color: '#2d2d2a', whiteSpace: 'pre-line' }}>
                      {selectedAppointmentRecord.MedicalRecord.prescription || 'Không có đơn thuốc.'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8a8a70', fontSize: '13px' }}>
                  Ca khám này chưa có kết quả bệnh án được lưu.
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fdfbf7', padding: '14px 24px', borderTop: '1px solid #e6e6df', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary-natural" onClick={() => setShowSearchRecordModal(false)}>
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;