import {readBookingDraft,saveBookingDraft,clearBookingDraft} from './hooks/useBookingDraft';
import { useRef, useCallback } from 'react';
import useDialogAccessibility from './hooks/useDialogAccessibility';
import { AppointmentReceipt } from './components/AppointmentTools';
import AvailableSlots from './components/AvailableSlots';
import { clinicToday, formatMoney } from './utils/clinicDate';
import React, { useState, useEffect } from 'react';
import api from './api';
import { X, Plus, User, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';

function BookingModal({ onClose, onSuccess, initialDoctorId, initialSpecialtyId }) {
  const bookingDraftKey='clinic-booking:'+(JSON.parse(localStorage.getItem('user') || 'null')?.id || 'guest');
  const storedDraft=readBookingDraft(bookingDraftKey);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Form State
  const [patientName, setPatientName] = useState(storedDraft.patientName || (''));
  const [patientPhone, setPatientPhone] = useState(storedDraft.patientPhone || (''));
  const [patientGender, setPatientGender] = useState('');
  const [patientAge, setPatientAge] = useState('');

  const [specialtyId, setSpecialtyId] = useState(initialSpecialtyId || '');
  const [doctorId, setDoctorId] = useState(initialDoctorId || '');
  const [appointmentDate, setAppointmentDate] = useState(clinicToday());
  const [timeSlot, setTimeSlot] = useState('09:00 - 09:30');
  const [symptoms, setSymptoms] = useState(storedDraft.symptoms || (''));
  const [loading, setLoading] = useState(false);
  useEffect(()=>{saveBookingDraft(bookingDraftKey,{patientName,patientPhone,symptoms});},[bookingDraftKey,patientName,patientPhone,symptoms]);
  const [receipt, setReceipt] = useState(null);
  const dialogRef = useRef(null);
  const requestKey = useRef(storedDraft.requestKey || crypto.randomUUID());
  const requestMounted=useRef(false);
  const close = useCallback(() => onClose(), [onClose]);
  useDialogAccessibility(dialogRef, close, !receipt);
  useEffect(() => { if(requestMounted.current) requestKey.current = crypto.randomUUID(); else requestMounted.current=true; }, [patientName, patientPhone, patientGender, patientAge, specialtyId, doctorId, appointmentDate, timeSlot, symptoms]);

  // Tải danh sách Chuyên khoa & Bác sĩ từ Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSpecs = await api.get('/specialties');
        setSpecialties(resSpecs.data);

        const resDocs = await api.get('/doctors');
        setDoctors(resDocs.data);

        // Tự động chọn Chuyên khoa & Bác sĩ đầu khi mở form đăng ký khám
        if (resSpecs.data.length > 0 && !initialDoctorId) {
          const firstSpecId = initialSpecialtyId || resSpecs.data[0].id;
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
  toast.error('Vui lòng điền họ tên và số điện thoại!');
  return;
    }
    if (!doctorId) {
      toast.error('Vui lòng chọn bác sĩ tiếp nhận!');
      return;
    }

    setLoading(true);
    try {
      saveBookingDraft(bookingDraftKey,{patientName,patientPhone,symptoms,requestKey:requestKey.current});
      const response = await api.post('/appointments', {
        requestKey: requestKey.current,
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

      clearBookingDraft(bookingDraftKey);
      toast.success(' Đặt lịch khám bệnh thành công! Phòng khám sẽ liên hệ xác nhận với bạn.');
      if (onSuccess) onSuccess();
      setReceipt({ ...response.data.data, DoctorInfo: doctors.find(d => String(d.id) === String(doctorId)) });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch khám');
    } finally {
      setLoading(false);
    }
  };

  if (receipt) return <AppointmentReceipt appointment={receipt} bookingCode={receipt.bookingCode} onClose={onClose} />;
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Đặt lịch khám bệnh" tabIndex={-1} className="clinic-booking-dialog" style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(45, 45, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '540px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e6e6df', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>

        {/* Header Modal */}
        <div style={{ backgroundColor: '#5a5a40', color: '#ffffff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Đặt Lịch Khám Bệnh Trực Tuyến</h3>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>Chọn lịch phù hợp, theo dõi trạng thái xác nhận</div>
            </div>
          </div>
          <button aria-label="Đóng form đặt lịch" onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.8 }}>
            <X size={20} />
          </button>
        </div>


        {/* Body Form */}
        <form className="clinic-booking-form" onSubmit={handleSubmit} style={{ padding: '24px', display: receipt ? 'none' : 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>

          {/* Bước 1: Thông tin bệnh nhân */}
          <div style={{ backgroundColor: '#fdfbf7', padding: '16px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> 1. Thông Tin Bệnh Nhân
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-1">Họ và tên *</label>
                <input id="bookingmodal-field-1"
                  type="text" required placeholder="Ví dụ: Nguyễn Văn An"
                  value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-2">Số điện thoại *</label>
                <input id="bookingmodal-field-2"
                  type="text" required placeholder="0912 xxx xxx"
                  value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-3">Giới tính</label>
                <select id="bookingmodal-field-3" required
                  value={patientGender} onChange={(e) => setPatientGender(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-4">Tuổi</label>
                <input id="bookingmodal-field-4"
                  type="number" required min="0" max="130" value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
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
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-5">Chuyên khoa</label>
                <select id="bookingmodal-field-5"
                  value={specialtyId} onChange={(e) => handleSpecialtyChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                >
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-6">Bác sĩ khám</label>
                <select id="bookingmodal-field-6"
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
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-7">Ngày khám</label>
                <input id="bookingmodal-field-7"
                  type="date" required min={clinicToday()} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '99px', border: '1px solid #e6e6df', marginTop: '4px', outline: 'none', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }}>Khung giờ khám</label>
<AvailableSlots doctorId={doctorId} date={appointmentDate} value={timeSlot} onChange={setTimeSlot} />
                <small>Phí khám: {formatMoney(doctors.find(d => String(d.id) === String(doctorId))?.consultationFee)}</small>
              </div>
            </div>
          </div>

          {/* Triệu chứng / Lý do khám */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#2d2d2a' }} htmlFor="bookingmodal-field-8">Lý do khám / Triệu chứng ban đầu</label>
            <textarea id="bookingmodal-field-8"
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
