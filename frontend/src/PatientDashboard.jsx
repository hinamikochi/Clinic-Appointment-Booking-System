import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  History, 
  User, 
  LogOut, 
  Stethoscope, 
  Home,
  FileText,
  Pill,
  Calendar,
  X
} from 'lucide-react';
import ProfileView from './components/ProfileView';
import './AdminDashboard.css';

function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-appointments');

  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : { id: 0, full_name: 'Bệnh Nhân', email: '' };

  const [userInfo, setUserInfo] = useState(initialUser);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientName, setPatientName] = useState(initialUser.full_name || '');
  const [patientPhone, setPatientPhone] = useState(initialUser.phone || '');
  const [patientGender, setPatientGender] = useState('Nam');
  const [patientAge, setPatientAge] = useState(30);
  const [specialtyId, setSpecialtyId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:00 - 09:30');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);

  // Lịch hẹn cá nhân của tôi
  const [myAppointments, setMyAppointments] = useState([]);

  // State Modal Xem Đơn Thuốc / Kết Quả Khám
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Tải dữ liệu tự động
  const fetchData = async () => {
    try {
      const resSpecs = await axios.get('http://localhost:5001/api/specialties');
      setSpecialties(resSpecs.data);

      const resDocs = await axios.get('http://localhost:5001/api/doctors');
      setDoctors(resDocs.data);

      if (resSpecs.data.length > 0) {
        const firstSpecId = resSpecs.data[0].id;
        setSpecialtyId(firstSpecId);
        const docsInSpec = resDocs.data.filter(d => String(d.specialtyId) === String(firstSpecId));
        if (docsInSpec.length > 0) setDoctorId(docsInSpec[0].id);
      }

      if (initialUser.id) {
        const resUser = await axios.get(`http://localhost:5001/api/users/${initialUser.id}`);
        if (resUser.data) {
          setUserInfo(resUser.data);
          localStorage.setItem('user', JSON.stringify(resUser.data));
        }

        // Tải danh sách lịch hẹn kèm theo thông tin Bệnh án (MedicalRecord)
        const resApts = await axios.get(`http://localhost:5001/api/patient/appointments/${initialUser.id}`);
        setMyAppointments(resApts.data);
      }
    } catch (err) {
      console.error("Lỗi nạp dữ liệu Bệnh Nhân:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSpecialtyChange = (spId) => {
    setSpecialtyId(spId);
    const availableDocs = doctors.filter(d => String(d.specialtyId) === String(spId));
    if (availableDocs.length > 0) {
      setDoctorId(availableDocs[0].id);
    } else {
      setDoctorId('');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert("Vui lòng điền họ tên và số điện thoại!");
      return;
    }
    if (!doctorId) {
      alert("Vui lòng chọn bác sĩ khám!");
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/appointments', {
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_gender: patientGender,
        patient_age: Number(patientAge),
        specialtyId,
        doctorId,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        symptoms,
        userId: userInfo.id
      });

      alert("🎉 Đặt lịch khám bệnh thành công! Phiếu đặt của bạn đang chờ phòng khám duyệt.");
      setSymptoms('');
      fetchData();
      setActiveTab('my-appointments');
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi đặt lịch khám");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy phiếu đặt lịch này?")) return;
    try {
      await axios.put(`http://localhost:5001/api/appointments/${id}/cancel`);
      alert("Đã hủy lịch hẹn thành công.");
      fetchData();
    } catch (err) {
      alert("Lỗi khi hủy lịch hẹn");
    }
  };

  // Mở Modal xem Đơn Thuốc & Kết Quả Khám
  const handleOpenRecordModal = (apt) => {
    setSelectedRecord({
      appointment: apt,
      medicalRecord: apt.MedicalRecord
    });
    setShowRecordModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const availableDoctors = doctors.filter(d => String(d.specialtyId) === String(specialtyId));

  return (
    <div className="admin-layout">
      {/* Sidebar Bệnh Nhân */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="brand-title">
              MyClinic <span className="brand-tag">PATIENT</span>
            </div>
            <div className="brand-sub">Cổng Thông Tin Bệnh Nhân</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">DANH MỤC CÁ NHÂN</div>

          <button
            onClick={() => setActiveTab('my-appointments')}
            className={`sidebar-nav-item ${activeTab === 'my-appointments' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <History size={18} color={activeTab === 'my-appointments' ? '#5a5a40' : '#8a8a70'} />
              <span>Lịch Hẹn Của Tôi</span>
            </div>
            {myAppointments.length > 0 && (
              <span className="nav-badge active">{myAppointments.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`sidebar-nav-item ${activeTab === 'booking' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <CalendarCheck size={18} color={activeTab === 'booking' ? '#5a5a40' : '#8a8a70'} />
              <span>Đặt Lịch Khám Mới</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <User size={18} color={activeTab === 'profile' ? '#5a5a40' : '#8a8a70'} />
              <span>Hồ Sơ & Đổi Mật Khẩu</span>
            </div>
          </button>
        </nav>

        {/* Footer User */}
        <div className="sidebar-footer">
          <div className="user-avatar">
            {userInfo.full_name ? userInfo.full_name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d2d2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userInfo.full_name}
            </div>
            <div style={{ fontSize: '11px', color: '#8a8a70' }}>Bệnh nhân</div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất" style={{ background: 'none', border: 'none', color: '#8a8a70', cursor: 'pointer' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main-content">
        <header className="admin-header-bar">
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#5a5a40' }}>
            {activeTab === 'my-appointments' && ' Lịch Sử Phiếu Đặt Khám Của Tôi'}
            {activeTab === 'booking' && ' Đăng Ký Khám Bệnh Trực Tuyến'}
            {activeTab === 'profile' && ' Quản Lý Hồ Sơ Cá Nhân & Đổi Mật Khẩu'}
          </div>

          <div className="header-actions">
            <button className="btn-secondary-natural" onClick={() => navigate('/')}>
              <Home size={16} /> Trang Chủ
            </button>
          </div>
        </header>

        <div className="admin-body">
          {/* TAB 1: LỊCH HẸN CỦA TÔI */}
          {activeTab === 'my-appointments' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond" style={{ marginBottom: '16px' }}> Danh Sách Phiếu Đặt Lịch Của Tôi</h3>

              <table className="natural-table">
                <thead>
                  <tr>
                    <th>Mã Phiếu</th>
                    <th>Chuyên Khoa</th>
                    <th>Bác Sĩ Đảm Nhận</th>
                    <th>Ngày & Khung Giờ</th>
                    <th>Lý Do Khám</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {myAppointments.length > 0 ? (
                    myAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                        <td>{apt.Specialty?.name || 'Chuyên Khoa'}</td>
                        <td style={{ fontWeight: '600' }}>{apt.DoctorInfo?.User?.full_name || 'Bác Sĩ'}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{apt.appointment_date}</div>
                          <div style={{ fontSize: '12px', color: '#8a8a70' }}>{apt.time_slot}</div>
                        </td>
                        <td>{apt.symptoms}</td>
                        <td>
                          <span className={`badge-status ${apt.status === 'completed' ? 'active' : apt.status === 'confirmed' ? 'active' : 'pending'}`}>
                            {apt.status === 'completed' ? 'Khám xong' : apt.status === 'confirmed' ? 'Đã duyệt' : apt.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td>
                          {/* NÚT 1: HỦY PHIẾU NẾU DẠNG CHỜ DUYỆT */}
                          {apt.status === 'pending' && (
                            <button 
                              onClick={() => handleCancelAppointment(apt.id)}
                              style={{ background: 'none', border: 'none', color: '#b84343', cursor: 'pointer', fontSize: '13px' }}
                            >
                              Hủy Phiếu
                            </button>
                          )}

                          {/* NÚT 2: XEM ĐƠN THUỐC & KẾT QUẢ NẾU ĐÃ KHÁM XONG */}
                          {apt.status === 'completed' && (
                            <button 
                              onClick={() => handleOpenRecordModal(apt)}
                              className="btn-primary-natural"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={14} /> Xem Chẩn Đoán
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#8a8a70' }}>
                        Bạn chưa đăng ký phiếu đặt lịch khám nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: ĐẶT LỊCH KHÁM MỚI */}
          {activeTab === 'booking' && (
            <div className="natural-section-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
              <h3 className="section-title-garamond" style={{ marginBottom: '6px' }}> Đăng Ký Khám Bệnh</h3>
              <p style={{ fontSize: '13px', color: '#8a8a70', marginBottom: '24px' }}>
                Chọn chuyên khoa, bác sĩ và thời gian khám mong muốn. Phiếu hẹn sẽ được gửi đến hệ thống phòng khám.
              </p>

              <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase' }}>
                    1. Thông tin bệnh nhân
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Họ và tên *</label>
                      <input 
                        type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Số điện thoại *</label>
                      <input 
                        type="text" required placeholder="0912 xxx xxx" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase' }}>
                    2. Chuyên khoa & Bác sĩ tiếp nhận
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Chuyên khoa</label>
                      <select 
                        value={specialtyId} onChange={(e) => handleSpecialtyChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      >
                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Bác sĩ khám</label>
                      <select 
                        value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      >
                        {availableDoctors.length > 0 ? (
                          availableDoctors.map(d => <option key={d.id} value={d.id}>{d.User?.full_name}</option>)
                        ) : (
                          <option value="">-- Chưa có bác sĩ --</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Ngày khám</label>
                      <input 
                        type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Khung giờ khám</label>
                      <select 
                        value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      >
                        <option value="08:00 - 08:30">08:00 - 08:30</option>
                        <option value="08:30 - 09:00">08:30 - 09:00</option>
                        <option value="09:00 - 09:30">09:00 - 09:30</option>
                        <option value="09:30 - 10:00">09:30 - 10:00</option>
                        <option value="14:00 - 14:30">14:00 - 14:30</option>
                        <option value="14:30 - 15:00">14:30 - 15:00</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600' }}>Triệu chứng / Lý do khám</label>
                  <textarea 
                    rows={3} placeholder="Mô tả sơ qua các dấu hiệu mệt mỏi, đau nhức..."
                    value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <button type="submit" className="btn-primary-natural" disabled={loading} style={{ justifyContent: 'center', padding: '14px' }}>
                  {loading ? 'Đang gửi phiếu đặt...' : 'Xác Nhận Đặt Lịch Khám'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU */}
          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </div>
      </div>

      {/* MODAL XEM ĐƠN THUỐC & KẾT QUẢ KHÁM BỆNH */}
      {showRecordModal && selectedRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '650px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: '1px solid #e6e6df', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {/* Header Modal */}
            <div style={{
              backgroundColor: '#5a5a40', color: '#ffffff', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'serif' }}>
                   KẾT QUẢ KHÁM BỆNH & ĐƠN THUỐC
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                  Mã phiếu: LH-{selectedRecord.appointment.id} • Ngày khám: {selectedRecord.appointment.appointment_date}
                </div>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body Modal */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Thẻ Bác sĩ & Chuyên Khoa */}
              <div style={{ backgroundColor: '#fdfbf7', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8a8a70', textTransform: 'uppercase', fontWeight: '700' }}>Bác sĩ khám</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d2d2a', marginTop: '2px' }}>
                    {selectedRecord.appointment.DoctorInfo?.User?.full_name || 'Bác sĩ chuyên khoa'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#8a8a70', textTransform: 'uppercase', fontWeight: '700' }}>Chuyên khoa</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#5a5a40', marginTop: '2px' }}>
                    {selectedRecord.appointment.Specialty?.name || 'Đa khoa'}
                  </div>
                </div>
              </div>

              {selectedRecord.medicalRecord ? (
                <>
                  {/* 1. CHẨN ĐOÁN BỆNH */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <FileText size={16} /> CHẨN ĐOÁN CỦA BÁC SĨ
                    </div>
                    <div style={{ backgroundColor: '#fdfbf7', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', color: '#2d2d2a', fontWeight: '600', lineHeight: '1.5' }}>
                      {selectedRecord.medicalRecord.diagnosis}
                    </div>
                  </div>

                  {/* 2. ĐƠN THUỐC & LIỀU DÙNG */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Pill size={16} /> ĐƠN THUỐC & HƯỚNG DẪN LIỀU DÙNG
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', color: '#2d2d2a', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                      {selectedRecord.medicalRecord.prescription || 'Không có đơn thuốc chỉ định.'}
                    </div>
                  </div>

                  {/* 3. LỜI KHUYÊN & NGÀY TÁI KHÁM */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#8a8a70', marginBottom: '4px' }}>Lời khuyên & Dặn dò</div>
                      <div style={{ fontSize: '13px', color: '#2d2d2a', fontStyle: 'italic' }}>
                        "{selectedRecord.medicalRecord.advice || 'Nghỉ ngơi và uống đủ nước ấm.'}"
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#8a8a70', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> Ngày hẹn tái khám
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#b84343' }}>
                        {selectedRecord.medicalRecord.re_visit_date || 'Không có hẹn tái khám'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8a8a70' }}>
                  Phiếu hẹn đã hoàn thành nhưng chưa có chi tiết đơn thuốc được ghi nhận.
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div style={{ backgroundColor: '#fdfbf7', padding: '16px 24px', borderTop: '1px solid #e6e6df', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary-natural" onClick={() => setShowRecordModal(false)}>
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;