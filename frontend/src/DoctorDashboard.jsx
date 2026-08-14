import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  CalendarDays, 
  CheckCircle2, 
  User, 
  LogOut, 
  Home, 
  FileText, 
  Pill, 
  Search
} from 'lucide-react';
import ProfileView from './components/ProfileView';
import './AdminDashboard.css';

function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { id: 0, full_name: 'Bác Sĩ', email: '' };

  const [doctorInfo, setDoctorInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [advice, setAdvice] = useState('');
  const [reVisitDate, setReVisitDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      if (!user.id) return;
      const resDoc = await axios.get(`http://localhost:5001/api/doctor/info/${user.id}`);
      setDoctorInfo(resDoc.data);

      if (resDoc.data?.id) {
        const resApts = await axios.get(`http://localhost:5001/api/doctor/appointments/${resDoc.data.id}`);
        setAppointments(resApts.data);
      }
    } catch (err) {
      console.error("Lỗi nạp dữ liệu Bác sĩ:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenExamination = (apt) => {
    setSelectedAppointment(apt);
    if (apt.MedicalRecord) {
      setDiagnosis(apt.MedicalRecord.diagnosis || '');
      setPrescription(apt.MedicalRecord.prescription || '');
      setAdvice(apt.MedicalRecord.advice || '');
      setReVisitDate(apt.MedicalRecord.re_visit_date || '');
    } else {
      setDiagnosis('');
      setPrescription('');
      setAdvice('');
      setReVisitDate('');
    }
    setActiveTab('examination');
  };

  const handleSaveMedicalRecord = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !diagnosis.trim()) {
      alert("Vui lòng nhập chẩn đoán bệnh cho bệnh nhân!");
      return;
    }

    setSaving(true);
    try {
      await axios.post('http://localhost:5001/api/medical-records', {
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.userId,
        doctorId: doctorInfo.id,
        diagnosis,
        prescription,
        advice,
        re_visit_date: reVisitDate
      });

      alert("🎉 Đã lưu kết quả khám & đơn thuốc thành công! Ca khám hoàn tất.");
      fetchData();
      setActiveTab('appointments');
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi lưu hồ sơ bệnh án");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.patient_name.toLowerCase().includes(q) || a.patient_phone.includes(q);
  });

  const pendingList = filteredAppointments.filter(a => a.status !== 'completed');
  const completedList = filteredAppointments.filter(a => a.status === 'completed');

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="brand-title">
              MyClinic <span className="brand-tag">DOCTOR</span>
            </div>
            <div className="brand-sub">Cổng Làm Việc Bác Sĩ</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">DANH MỤC LÀM VIỆC</div>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`sidebar-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <CalendarDays size={18} color={activeTab === 'appointments' ? '#5a5a40' : '#8a8a70'} />
              <span>Danh Sách Ca Khám</span>
            </div>
            {pendingList.length > 0 && (
              <span className="nav-badge active">{pendingList.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`sidebar-nav-item ${activeTab === 'completed' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <CheckCircle2 size={18} color={activeTab === 'completed' ? '#5a5a40' : '#8a8a70'} />
              <span>Lịch Sử Đã Khám</span>
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

        <div className="sidebar-footer">
          <div className="user-avatar">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d2d2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {doctorInfo ? `${doctorInfo.degree} ${user.full_name}` : user.full_name}
            </div>
            <div style={{ fontSize: '11px', color: '#8a8a70' }}>
              {doctorInfo?.Specialty?.name || 'Bác sĩ chuyên khoa'}
            </div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất" style={{ background: 'none', border: 'none', color: '#8a8a70', cursor: 'pointer' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="admin-main-content">
        <header className="admin-header-bar">
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#5a5a40' }}>
            {activeTab === 'appointments' && ' Danh Sách Bệnh Nhân Đăng Ký Khám'}
            {activeTab === 'examination' && ` Khám Bệnh: ${selectedAppointment?.patient_name || ''}`}
            {activeTab === 'completed' && ' Lịch Sử Ca Khám Đã Hoàn Thành'}
            {activeTab === 'profile' && ' Quản Lý Hồ Sơ Cá Nhân & Đổi Mật Khẩu'}
          </div>

          <div className="header-actions">
            <button className="btn-secondary-natural" onClick={() => navigate('/')}>
              <Home size={16} /> Trang Chủ
            </button>
          </div>
        </header>

        <div className="admin-body">
          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Search size={18} color="#8a8a70" />
                <input 
                  type="text" 
                  placeholder="Tìm theo tên bệnh nhân hoặc số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px' }}
                />
              </div>

              <div className="natural-section-card">
                <h3 className="section-title-garamond" style={{ marginBottom: '16px' }}> Danh Sách Ca Khám Chờ Tiếp Nhận</h3>

                <table className="natural-table">
                  <thead>
                    <tr>
                      <th>Mã Lịch</th>
                      <th>Bệnh Nhân</th>
                      <th>Giới Tính / Tuổi</th>
                      <th>Số Điện Thoại</th>
                      <th>Ngày & Khung Giờ</th>
                      <th>Triệu Chứng Ban Đầu</th>
                      <th>Trạng Thái</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.length > 0 ? (
                      pendingList.map((apt) => (
                        <tr key={apt.id}>
                          <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                          <td style={{ fontWeight: '700', color: '#2d2d2a' }}>{apt.patient_name}</td>
                          <td>{apt.patient_gender} • {apt.patient_age} tuổi</td>
                          <td>{apt.patient_phone}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{apt.appointment_date}</div>
                            <div style={{ fontSize: '12px', color: '#8a8a70' }}>{apt.time_slot}</div>
                          </td>
                          <td style={{ color: '#5a5a40', fontStyle: 'italic' }}>"{apt.symptoms}"</td>
                          <td>
                            <span className={`badge-status ${apt.status === 'confirmed' ? 'active' : 'pending'}`}>
                              {apt.status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleOpenExamination(apt)}
                              className="btn-primary-natural"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              <Stethoscope size={14} /> Khám Bệnh
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#8a8a70' }}>
                          Hiện tại chưa có bệnh nhân nào trong danh sách khám chờ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'examination' && selectedAppointment && (
            <div className="natural-section-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#5a5a40' }}>
                    Bệnh Nhân: {selectedAppointment.patient_name}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#8a8a70', marginTop: '4px' }}>
                    SĐT: {selectedAppointment.patient_phone} • {selectedAppointment.patient_gender} • {selectedAppointment.patient_age} tuổi
                  </div>
                </div>
                <button className="btn-secondary-natural" onClick={() => setActiveTab('appointments')}>
                  Quay Lại
                </button>
              </div>

              <form onSubmit={handleSaveMedicalRecord} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#2d2d2a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <FileText size={16} color="#5a5a40" /> Chẩn Đoán Bệnh Của Bác Sĩ *
                  </label>
                  <textarea 
                    rows={3} required
                    placeholder="Nhập chi tiết chẩn đoán lâm sàng..."
                    value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e6e6df', outline: 'none', fontFamily: 'inherit', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#2d2d2a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Pill size={16} color="#5a5a40" /> Kê Đơn Thuốc & Liều Dùng
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Kê danh sách thuốc..."
                    value={prescription} onChange={(e) => setPrescription(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e6e6df', outline: 'none', fontFamily: 'inherit', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#2d2d2a', marginBottom: '6px', display: 'block' }}>
                      Lời Khuyên & Dặn Dò
                    </label>
                    <input 
                      type="text" placeholder="Dặn dò sinh hoạt..."
                      value={advice} onChange={(e) => setAdvice(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', outline: 'none', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#2d2d2a', marginBottom: '6px', display: 'block' }}>
                      Hẹn Ngày Tái Khám
                    </label>
                    <input 
                      type="date"
                      value={reVisitDate} onChange={(e) => setReVisitDate(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', outline: 'none', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn-secondary-natural" onClick={() => setActiveTab('appointments')}>
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-primary-natural" disabled={saving}>
                    {saving ? 'Đang Lưu...' : 'Lưu Hồ Sơ & Hoàn Thành Ca Khám'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond" style={{ marginBottom: '16px' }}> Danh Sách Ca Khám Đã Hoàn Thành</h3>

              <table className="natural-table">
                <thead>
                  <tr>
                    <th>Mã Lịch</th>
                    <th>Bệnh Nhân</th>
                    <th>Số Điện Thoại</th>
                    <th>Ngày Khám</th>
                    <th>Chẩn Đoán Bác Sĩ</th>
                    <th>Đơn Thuốc</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {completedList.length > 0 ? (
                    completedList.map((apt) => (
                      <tr key={apt.id}>
                        <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                        <td style={{ fontWeight: '700' }}>{apt.patient_name}</td>
                        <td>{apt.patient_phone}</td>
                        <td>{apt.appointment_date}</td>
                        <td style={{ fontWeight: '600', color: '#2e6f40' }}>
                          {apt.MedicalRecord?.diagnosis || 'Đã chẩn đoán'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#5a5a40', whiteSpace: 'pre-line' }}>
                          {apt.MedicalRecord?.prescription || 'Không có đơn thuốc'}
                        </td>
                        <td>
                          <span className="badge-status active">Khám xong</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#8a8a70' }}>
                        Chưa có lịch sử ca khám nào hoàn thành.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;