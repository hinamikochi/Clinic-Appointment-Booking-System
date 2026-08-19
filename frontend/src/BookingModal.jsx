import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, User, Stethoscope } from 'lucide-react';

function BookingModal({ onClose, onSuccess, initialDoctorId, initialSpecialtyId }) {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientGender, setPatientGender] = useState('Nam');
  const [patientAge, setPatientAge] = useState(30);

  const [specialtyId, setSpecialtyId] = useState(initialSpecialtyId || '');
  const [doctorId, setDoctorId] = useState(initialDoctorId || '');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:00 - 09:30');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);

  // Tải danh sách Chuyên khoa & Bác sĩ từ Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSpecs = await axios.get('http://localhost:5001/api/specialties');
        setSpecialties(resSpecs.data);

        const resDocs = await axios.get('http://localhost:5001/api/doctors');
        setDoctors(resDocs.data);

        // Tự động chọn Chuyên khoa & Bác sĩ đầu khi mở form đăng ký khám
        if (!initialSpecialtyId && resSpecs.data.length > 0) {
          const firstSpecId = resSpecs.data[0].id;
          setSpecialtyId(firstSpecId);
          const docsInSpec = resDocs.data.filter(d => String(d.specialtyId) === String(firstSpecId));
          if (docsInSpec.length > 0 && !initialDoctorId) {
            setDoctorId(docsInSpec[0].id);
          }
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu đặt lịch:", err);
      }
    };
    fetchData();
  }, [initialSpecialtyId, initialDoctorId]);

  // Tự động lọc bác sĩ khi chuyển chuyên khoa
  const handleSpecialtyChange = (spId) => {
    setSpecialtyId(spId);
    const availableDocs = doctors.filter(d => String(d.specialtyId) === String(spId));
    if (availableDocs.length > 0) {
      setDoctorId(availableDocs[0].id);
    } else {
      setDoctorId('');
    }
  };

  const availableDoctors = doctors.filter(d => String(d.specialtyId) === String(specialtyId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert('Vui lòng điền họ tên và số điện thoại!');
      return;
    }
    if (!doctorId) {
      alert('Vui lòng chọn bác sĩ tiếp nhận!');
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
        symptoms
      });

      alert('🎉 Đặt lịch khám bệnh thành công! Phòng khám sẽ liên hệ xác nhận với bạn.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch khám');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(45, 45, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '540px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e6e6df', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Header Modal */}
        <div style={{ backgroundColor: '#5a5a40', color: '#ffffff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Đặt Lịch Khám Bệnh Trực Tuyến</h3>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>Đăng ký nhanh chóng - Không phải chờ đợi</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* Bước 1: Thông tin bệnh nhân */}
          <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> 1. Thông Tin Bệnh Nhân
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Họ và tên *</label>
                <input 
                  type="text" required placeholder="Ví dụ: Nguyễn Văn An"
                  value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Số điện thoại *</label>
                <input 
                  type="text" required placeholder="0912 xxx xxx"
                  value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Giới tính</label>
                <select 
                  value={patientGender} onChange={(e) => setPatientGender(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Tuổi</label>
                <input 
                  type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Bước 2: Chuyên khoa & Bác sĩ */}
          <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={14} /> 2. Chọn Chuyên Khoa & Bác Sĩ
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Chuyên khoa</label>
                <select 
                  value={specialtyId} onChange={(e) => handleSpecialtyChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                >
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Bác sĩ khám</label>
                <select 
                  value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                >
                  {availableDoctors.length > 0 ? (
                    availableDoctors.map(d => (
                      <option key={d.id} value={d.id}>{d.User?.full_name || 'Bác sĩ'}</option>
                    ))
                  ) : (
                    <option value="">-- Chưa có bác sĩ --</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Ngày khám</label>
                <input 
                  type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Khung giờ khám</label>
                <select 
                  value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                >
                  <option value="08:00 - 08:30">08:00 - 08:30</option>
                  <option value="08:30 - 09:00">08:30 - 09:00</option>
                  <option value="09:00 - 09:30">09:00 - 09:30</option>
                  <option value="09:30 - 10:00">09:30 - 10:00</option>
                  <option value="14:00 - 14:30">14:00 - 14:30</option>
                  <option value="14:30 - 15:00">14:30 - 15:00</option>
                  <option value="15:00 - 15:30">15:00 - 15:30</option>
                </select>
              </div>
            </div>
          </div>

          {/* Triệu chứng / Lý do khám */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Lý do khám / Triệu chứng ban đầu</label>
            <textarea 
              rows={2} placeholder="Mô tả các dấu hiệu mệt mỏi, đau nhức..."
              value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn-secondary-natural" onClick={onClose}>Hủy Bỏ</button>
            <button type="submit" className="btn-primary-natural" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Xác Nhận Đặt Lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;