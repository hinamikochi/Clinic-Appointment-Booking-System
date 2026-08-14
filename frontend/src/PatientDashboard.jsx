import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  History, 
  User, 
  LogOut, 
  Stethoscope, 
  Home
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

  const [myAppointments, setMyAppointments] = useState([]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const availableDoctors = doctors.filter(d => String(d.specialtyId) === String(specialtyId));

  return (
    <div className="admin-layout">
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
                          {apt.status === 'pending' && (
                            <button 
                              onClick={() => handleCancelAppointment(apt.id)}
                              style={{ background: 'none', border: 'none', color: '#b84343', cursor: 'pointer', fontSize: '13px' }}
                            >
                              Hủy Phiếu
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

          {activeTab === 'booking' && (
            <div className="natural-section-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
              <h3 className="section-title-garamond" style={{ marginBottom: '6px' }}>📝 Đăng Ký Khám Bệnh</h3>
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

          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;