import {readBookingDraft,saveBookingDraft,clearBookingDraft} from './hooks/useBookingDraft';
import AppointmentTools, { AppointmentReceipt } from './components/AppointmentTools';
import AppointmentStatus from './components/AppointmentStatus';
import PatientProfiles, { ProfilePicker } from './components/PatientProfiles';
import NotificationCenter from './components/NotificationCenter';
import useUrlState from './hooks/useUrlState';
import { useRef } from 'react';
import ClaimBooking from './components/ClaimBooking';
import AvailableSlots from './components/AvailableSlots';
import { clinicToday, formatMoney, formatDate } from './utils/clinicDate';
import React, { useState, useEffect, useCallback } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  X,
  Printer
} from 'lucide-react';
import ProfileView from './components/ProfileView';
import { printPrescription } from './utils/printHelper';
import './AdminDashboard.css';

function PatientDashboard() {
  const navigate = useNavigate();
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [activeTab, setActiveTab] = useUrlState('tab', 'my-appointments');

  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : { id: 0, full_name: 'Bệnh Nhân', email: '' };

  const [userInfo, setUserInfo] = useState(initialUser);

  const bookingDraftKey='clinic-booking:'+(initialUser.id);
  const storedDraft=readBookingDraft(bookingDraftKey);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientName, setPatientName] = useState(storedDraft.patientName || (initialUser.full_name || ''));
  const [patientPhone, setPatientPhone] = useState(storedDraft.patientPhone || (initialUser.phone || ''));
  const [patientGender, setPatientGender] = useState(initialUser.gender || '');
  const [patientAge, setPatientAge] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(clinicToday());
  const [timeSlot, setTimeSlot] = useState('09:00 - 09:30');
  const [symptoms, setSymptoms] = useState(storedDraft.symptoms || (''));
  const [loading, setLoading] = useState(false);
  useEffect(()=>{saveBookingDraft(bookingDraftKey,{patientName,patientPhone,symptoms});},[bookingDraftKey,patientName,patientPhone,symptoms]);

  // Lịch hẹn cá nhân của tôi
  const [myAppointments, setMyAppointments] = useState([]);
  const [aptPage, setAptPage] = useState(1);
  const aptsPerPage = 5;

  // State Modal Xem Đơn Thuốc / Kết Quả Khám
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [patientProfileId, setPatientProfileId] = useState('');
  const requestKey = useRef(storedDraft.requestKey || crypto.randomUUID());
  const requestMounted=useRef(false);
  useEffect(() => { if(requestMounted.current) requestKey.current = crypto.randomUUID(); else requestMounted.current=true; }, [patientName, patientPhone, patientGender, patientAge, specialtyId, doctorId, appointmentDate, timeSlot, symptoms, patientProfileId]);

  // Tải dữ liệu tự động
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const resSpecs = await api.get('/specialties');
      setSpecialties(resSpecs.data);

      const resDocs = await api.get('/doctors');
      setDoctors(resDocs.data);

      if (resSpecs.data.length > 0) {
        const firstSpecId = resSpecs.data[0].id;
        setSpecialtyId(previous => previous || firstSpecId);
        const docsInSpec = resDocs.data.filter(d => String(d.specialtyId) === String(firstSpecId));
        if (docsInSpec.length > 0) setDoctorId(previous => previous || docsInSpec[0].id);
      }

      if (initialUser.id) {
        const resUser = await api.get(`/users/${initialUser.id}`);
        if (resUser.data) {
          setUserInfo(resUser.data);
          localStorage.setItem('user', JSON.stringify(resUser.data));
        }

        // Tải danh sách lịch hẹn kèm theo thông tin Bệnh án (MedicalRecord)
        const resApts = await api.get(`/patient/appointments/${initialUser.id}`);
        setMyAppointments(resApts.data);
      }
    } catch (err) {
      setDataError(err.response?.data?.message || 'Không tải được dữ liệu.');
    } finally { setDataLoading(false); }
  }, [initialUser.id]);

  useEffect(() => {
    document.title = "MyClinic - Cổng Thông Tin Bệnh Nhân";
    fetchData();
    const timer=setInterval(fetchData,30000); window.addEventListener('focus',fetchData); window.addEventListener('clinic-updated',fetchData);
    return () => { clearInterval(timer); window.removeEventListener('focus',fetchData); window.removeEventListener('clinic-updated',fetchData); };
  }, [fetchData]);

    // Hàm tính thời gian đến ngày khám
    const getCountdownBadge = (dateStr, status) => {
    if (status === 'cancelled' || status === 'completed') return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aptDate = new Date(dateStr);
    aptDate.setHours(0, 0, 0, 0);

    const diffTime = aptDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#e2f0d9', color: '#2e6f40', padding: '3px 10px', borderRadius: '99px', display: 'inline-block' }}>🟢 Hôm nay</span>;
    } else if (diffDays === 1) {
      return <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 10px', borderRadius: '99px', display: 'inline-block' }}>🔵 Ngày mai</span>;
    } else if (diffDays > 1) {
      return <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 10px', borderRadius: '99px', display: 'inline-block' }}>🔵 Còn {diffDays} ngày</span>;
    } else {
      return <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#f0f0ea', color: '#62624d', padding: '3px 10px', borderRadius: '99px', display: 'inline-block' }}>⚪ Đã qua</span>;
    }
  };

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
      toast.error('Vui lòng điền họ tên và số điện thoại!');
      return;
    }
    if (!doctorId) {
      toast.error("Vui lòng chọn bác sĩ khám!");
      return;
    }

    setLoading(true);
    try {
      saveBookingDraft(bookingDraftKey,{patientName,patientPhone,symptoms,requestKey:requestKey.current});
      const response = await api.post('/appointments', {
        requestKey: requestKey.current, patientProfileId: patientProfileId || null,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_gender: patientGender,
        patient_age: Number(patientAge),
        specialtyId,
        doctorId,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        symptoms,
        // Tài khoản được backend xác định từ JWT.
      });

      clearBookingDraft(bookingDraftKey);
      toast.success(" Đặt lịch khám bệnh thành công!");
      setReceipt({ ...response.data.data, DoctorInfo: doctors.find(d => String(d.id) === String(doctorId)) });
      setSymptoms('');
      fetchData();
      setActiveTab('my-appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi đặt lịch khám");
    } finally {
      setLoading(false);
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

  // phân trang lịch khám
  const [appointmentGroup,setAppointmentGroup]=useUrlState('group','upcoming');
  const visibleAppointments=myAppointments.filter(a=>appointmentGroup==='all'||(appointmentGroup==='upcoming'?['pending','confirmed','arrived','in_progress'].includes(a.status)&&a.appointment_date>=clinicToday():['completed','cancelled','no_show'].includes(a.status)||a.appointment_date<clinicToday()));
  const totalAptPages = Math.ceil(visibleAppointments.length / aptsPerPage) || 1;
  const paginatedAppointments = visibleAppointments.slice((aptPage - 1) * aptsPerPage, aptPage * aptsPerPage);

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

        <nav className="sidebar-nav"><button type="button" aria-label="Hồ sơ người khám" title="Hồ sơ người khám" className={`sidebar-nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}><User size={18} /><span>Hồ sơ người khám</span></button>
          <div className="nav-section-title">DANH MỤC CÁ NHÂN</div>

          <button
            aria-label="Lịch hẹn của tôi" title="Lịch hẹn của tôi" onClick={() => setActiveTab('my-appointments')}
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
            aria-label="Đặt lịch khám mới" title="Đặt lịch khám mới" onClick={() => setActiveTab('booking')}
            className={`sidebar-nav-item ${activeTab === 'booking' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <CalendarCheck size={18} color={activeTab === 'booking' ? '#5a5a40' : '#8a8a70'} />
              <span>Đặt Lịch Khám Mới</span>
            </div>
          </button>

          <button
            aria-label="Hồ sơ và đổi mật khẩu" title="Hồ sơ và đổi mật khẩu" onClick={() => setActiveTab('profile')}
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
            <div style={{ fontSize: '11px', color: '#62624d' }}>Bệnh nhân</div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất" style={{ background: 'none', border: 'none', color: '#62624d', cursor: 'pointer' }}>
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

          <div className="header-actions"><NotificationCenter />
            <button className="btn-secondary-natural" onClick={() => navigate('/')}>
              <Home size={16} /> Trang Chủ
            </button>
          </div>
        </header>

        <div className="admin-body">
          {receipt && <AppointmentReceipt appointment={receipt} onClose={() => setReceipt(null)} />}
          {activeTab === 'patients' && <PatientProfiles />}
          {dataLoading && <p role="status">Đang tải dữ liệu…</p>}
          {dataError && <p role="alert" className="clinic-feedback">{dataError} <button type="button" onClick={fetchData}>Thử lại</button></p>}
          {activeTab === 'my-appointments' && <label className="clinic-flex-wrap">Lịch hẹn<select aria-label="Nhóm lịch hẹn" value={appointmentGroup} onChange={e=>{setAppointmentGroup(e.target.value);setAptPage(1);}}><option value="upcoming">Sắp tới</option><option value="history">Lịch sử</option><option value="all">Tất cả</option></select></label>}
          {activeTab === 'my-appointments' && <details className="natural-section-card"><summary>Thêm lịch đã đặt khi chưa đăng nhập</summary><ClaimBooking onSuccess={fetchData} /></details>}
          {/* TAB 1: LỊCH HẸN CỦA TÔI */}
          {activeTab === 'my-appointments' && (
            <div className="natural-section-card">
              <h3 className="section-title-garamond" style={{ marginBottom: '16px' }}> Danh Sách Phiếu Đặt Lịch Của Tôi</h3>

            <div className="natural-table-container">
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
                  {paginatedAppointments.length > 0 ? (
                    paginatedAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                        <td>{apt.Specialty?.name || 'Chuyên Khoa'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '600', color: '#2d2d2a' }}>
                            {apt.DoctorInfo?.degree ? `${apt.DoctorInfo.degree} ` : ''}{apt.DoctorInfo?.User?.full_name || 'Bác Sĩ'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#5a5a40', marginTop: '2px', fontWeight: '500' }}>
                             {apt.DoctorInfo?.roomNumber || 'Phòng 101 - Tầng 1'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#2d2d2a' }}>{formatDate(apt.appointment_date)}</div>
                          <div style={{ fontSize: '12px', color: '#62624d', marginTop: '2px' }}>{apt.time_slot}</div><small>Phí khám: {formatMoney(apt.consultationFee)}</small>
                          <div style={{ marginTop: '4px' }}>
                            {getCountdownBadge(apt.appointment_date, apt.status)}
                          </div>
                        </td>
                        <td>{apt.symptoms}</td>
                        <td>
                          <AppointmentStatus status={apt.status} />
                        </td>
                        <td>
                          {/* NÚT 1: HỦY PHIẾU NẾU DẠNG CHỜ DUYỆT */}
                          <AppointmentTools appointment={apt} onUpdated={fetchData} />

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
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#62624d' }}>
                        Bạn chưa đăng ký phiếu đặt lịch khám nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>

              {/* Thanh điều khiển phân trang */}
              {totalAptPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                  <button
                    disabled={aptPage === 1}
                    onClick={() => setAptPage(prev => Math.max(prev - 1, 1))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '34px', height: '34px', borderRadius: '50%',
                      border: '1px solid #e6e6df',
                      backgroundColor: aptPage === 1 ? '#f5f5f0' : '#ffffff',
                      color: aptPage === 1 ? '#cccccc' : '#5a5a40',
                      cursor: aptPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalAptPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setAptPage(page)}
                      style={{
                        minWidth: '34px', height: '34px', padding: '0 8px', borderRadius: '99px',
                        border: page === aptPage ? '1px solid #5a5a40' : '1px solid #e6e6df',
                        backgroundColor: page === aptPage ? '#5a5a40' : '#ffffff',
                        color: page === aptPage ? '#ffffff' : '#2d2d2a',
                        fontWeight: page === aptPage ? '700' : '500',
                        fontSize: '13px', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: page === aptPage ? '0 3px 8px rgba(90, 90, 64, 0.2)' : 'none'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={aptPage === totalAptPages}
                    onClick={() => setAptPage(prev => Math.min(prev + 1, totalAptPages))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '34px', height: '34px', borderRadius: '50%',
                      border: '1px solid #e6e6df',
                      backgroundColor: aptPage === totalAptPages ? '#f5f5f0' : '#ffffff',
                      color: aptPage === totalAptPages ? '#cccccc' : '#5a5a40',
                      cursor: aptPage === totalAptPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ĐẶT LỊCH KHÁM MỚI */}
          {activeTab === 'booking' && (
            <div className="natural-section-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
              <h3 className="section-title-garamond" style={{ marginBottom: '6px' }}> Đăng Ký Khám Bệnh</h3>
              <p style={{ fontSize: '13px', color: '#62624d', marginBottom: '24px' }}>
                Chọn chuyên khoa, bác sĩ và thời gian khám mong muốn. Phiếu hẹn sẽ được gửi đến hệ thống phòng khám.
              </p>

              <form className="clinic-booking-form" onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ProfilePicker value={patientProfileId} onChange={setPatientProfileId} onSelect={profile => { setPatientName(profile.fullName); setPatientGender(profile.gender); const today=clinicToday(); setPatientAge(Number(today.slice(0,4))-Number(profile.birthDate.slice(0,4))-(today.slice(5)<profile.birthDate.slice(5)?1:0)); if(profile.phone)setPatientPhone(profile.phone); }} />
                <div className="clinic-flex-wrap"><label>Giới tính<select className="clinic-input" required value={patientGender} onChange={e => setPatientGender(e.target.value)}><option value="">Chọn giới tính</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></label><label>Tuổi<input className="clinic-input" type="number" required min="0" max="130" value={patientAge} onChange={e => setPatientAge(e.target.value)} /></label></div>

                <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase' }}>
                    1. Thông tin bệnh nhân
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }} htmlFor="patientdashboard-field-1">Họ và tên *</label>
                      <input id="patientdashboard-field-1"
                        type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }} htmlFor="patientdashboard-field-2">Số điện thoại *</label>
                      <input id="patientdashboard-field-2"
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
                      <label style={{ fontSize: '12px', fontWeight: '600' }} htmlFor="patientdashboard-field-3">Chuyên khoa</label>
                      <select id="patientdashboard-field-3"
                        value={specialtyId} onChange={(e) => handleSpecialtyChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      >
                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }} htmlFor="patientdashboard-field-4">Bác sĩ khám</label>
                      <select id="patientdashboard-field-4"
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
                      <label style={{ fontSize: '12px', fontWeight: '600' }} htmlFor="patientdashboard-field-5">Ngày khám</label>
                      <input id="patientdashboard-field-5"
                        type="date" required min={clinicToday()} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Khung giờ khám</label>
                      <AvailableSlots doctorId={doctorId} date={appointmentDate} value={timeSlot} onChange={setTimeSlot} />
                <small>Phí khám: {formatMoney(doctors.find(d => String(d.id) === String(doctorId))?.consultationFee)}</small>
                    </div>
                  </div>
                  {doctorId && (
                    <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', display: 'flex', justifyContent: 'space-between', color: '#5a5a40', marginTop: '8px' }}>
                      {(() => {
                        const selDoc = doctors.find(d => String(d.id) === String(doctorId));
                        return (
                          <>
                            <span> Vị trí: <strong>{selDoc?.roomNumber || 'Phòng 101 - Tầng 1'}</strong></span>
                            <span> Giá khám dự kiến: <strong style={{ color: '#2e6f40' }}>{selDoc?.consultationFee ? `${Number(selDoc.consultationFee).toLocaleString('vi-VN')} VNĐ` : '200.000 VNĐ'}</strong></span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600' }} htmlFor="patientdashboard-field-6">Triệu chứng / Lý do khám</label>
                  <textarea id="patientdashboard-field-6"
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
                <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-ui)' }}>
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
                  <div style={{ fontSize: '11px', color: '#62624d', textTransform: 'uppercase', fontWeight: '700' }}>Bác sĩ khám</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d2d2a', marginTop: '2px' }}>
                    {selectedRecord.appointment.DoctorInfo?.User?.full_name || 'Bác sĩ chuyên khoa'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#62624d', textTransform: 'uppercase', fontWeight: '700' }}>Chuyên khoa</div>
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
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#62624d', marginBottom: '4px' }}>Lời khuyên & Dặn dò</div>
                      <div style={{ fontSize: '13px', color: '#2d2d2a', fontStyle: 'italic' }}>
                        "{selectedRecord.medicalRecord.advice || 'Không có lời dặn được ghi nhận.'}"
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#62624d', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> Ngày đề nghị tái khám (chưa đặt lịch)
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#b84343' }}>
                        {selectedRecord.medicalRecord.re_visit_date || 'Không có hẹn tái khám'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#62624d' }}>
                  Phiếu hẹn đã hoàn thành nhưng chưa có chi tiết đơn thuốc được ghi nhận.
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div style={{ backgroundColor: '#fdfbf7', padding: '16px 24px', borderTop: '1px solid #e6e6df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => printPrescription(selectedRecord.appointment, selectedRecord.medicalRecord)}
                className="btn-primary-natural"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} />  In Kết Quả Khám
              </button>
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
