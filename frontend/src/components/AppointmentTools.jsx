import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import AvailableSlots from './AvailableSlots';
import AppointmentStatus from './AppointmentStatus';
import { statusLabels } from '../utils/appointmentStatus';
import { clinicToday, formatDate, formatMoney } from '../utils/clinicDate';
import api from '../api';
import { Stethoscope, CalendarDays, Clock, UserRound, MapPin, Phone, FileDown, ClipboardList, Copy, Video, Building2 } from 'lucide-react';

export function AppointmentReceipt({ appointment, onClose, bookingCode }) {
  const [clinic, setClinic] = useState(null), [error, setError] = useState('');
  useEffect(() => { api.get('/clinic').then(res => setClinic(res.data)).catch(() => setError('Không tải được hướng dẫn của phòng khám.')); }, []);
  function download() {
    const text = `${clinic?.name || 'MyClinic'}\nPhiếu LH-${appointment.id}\n${appointment.patient_name}\n${formatDate(appointment.appointment_date)} - ${appointment.time_slot}\n${statusLabels[appointment.status]}\nPhí khám: ${formatMoney(appointment.consultationFee)}\n${clinic?.address || ''}\n${clinic?.phone || ''}\n${clinic?.instructions || ''}${bookingCode ? '\nMã nhận lịch: ' + bookingCode : ''}`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `phieu-hen-${appointment.id}.txt`; link.click(); URL.revokeObjectURL(url);
  }
  return <Modal title={`Phiếu hẹn LH-${appointment.id}`} onClose={onClose}>
    <div className="appointment-receipt">
      <div className="receipt-heading"><div className="receipt-clinic"><span className="receipt-icon"><Stethoscope size={22} aria-hidden="true" /></span><div><small>THÔNG TIN LỊCH KHÁM</small><h3>{clinic?.name || 'MyClinic'}</h3></div></div><AppointmentStatus status={appointment.status} /></div>
      <p className="receipt-notice">{appointment.status === 'pending' ? 'Phòng khám đã nhận yêu cầu. Lịch chỉ được xác nhận sau khi nhân viên duyệt.' : 'Bạn có thể theo dõi các thay đổi trong phần thông báo.'}</p>
      <dl className="receipt-details">
        <div><dt><UserRound size={15} aria-hidden="true" />Người khám</dt><dd>{appointment.patient_name}</dd></div>
        <div><dt><Stethoscope size={15} aria-hidden="true" />Bác sĩ</dt><dd>{appointment.DoctorInfo?.User?.full_name || 'Theo bác sĩ đã chọn'}</dd></div>
        <div><dt><CalendarDays size={15} aria-hidden="true" />Ngày khám</dt><dd>{formatDate(appointment.appointment_date)}</dd></div>
        <div><dt><Clock size={15} aria-hidden="true" />Khung giờ</dt><dd>{appointment.time_slot}</dd></div>
        {appointment.Specialty?.name && <div><dt><Building2 size={15} aria-hidden="true" />Chuyên khoa</dt><dd>{appointment.Specialty.name}</dd></div>}
        <div><dt><ClipboardList size={15} aria-hidden="true" />Phí khám dự kiến</dt><dd>{formatMoney(appointment.consultationFee)}</dd></div>
      </dl>
      {bookingCode && <div className="receipt-claim"><p>Lưu mã để nhận lịch vào tài khoản bệnh nhân:</p><code>{bookingCode}</code><button type="button" className="btn-secondary-natural" onClick={() => navigator.clipboard.writeText(bookingCode).then(() => toast.success('Đã sao chép mã.')).catch(() => toast.error('Hãy chọn và sao chép mã bằng tay.'))}><Copy size={14} aria-hidden="true" />Sao chép mã</button></div>}
      {clinic && <section className="receipt-instructions"><h3><ClipboardList size={17} aria-hidden="true" />Hướng dẫn đi khám</h3>{clinic.address && <p><MapPin size={15} aria-hidden="true" /><span>{clinic.address}</span></p>}{clinic.phone && <p><Phone size={15} aria-hidden="true" /><a href={`tel:${clinic.phone}`}>{clinic.phone}</a></p>}{clinic.instructions && <p className="receipt-instruction-text">{clinic.instructions}</p>}</section>}
      {error && <p role="alert" className="clinic-feedback">{error}</p>}
      <div className="receipt-footer">{appointment.meetingUrl && <a className="btn-secondary-natural" href={appointment.meetingUrl} target="_blank" rel="noopener noreferrer"><Video size={16} aria-hidden="true" />Mở phòng khám trực tuyến</a>}<button type="button" className="btn-primary-natural" onClick={download}><FileDown size={16} aria-hidden="true" />Tải phiếu hẹn</button></div>
    </div>
  </Modal>;
}
export default function AppointmentTools({ appointment, admin = false, onUpdated }) {
  const [mode, setMode] = useState(''), [reason, setReason] = useState(''), [date, setDate] = useState(appointment.appointment_date), [slot, setSlot] = useState(''), [doctorId, setDoctorId] = useState(appointment.doctorId), [doctors, setDoctors] = useState([]), [busy, setBusy] = useState(false), [events, setEvents] = useState([]), [error, setError] = useState('');
  const changeable = ['pending', 'confirmed'].includes(appointment.status) && new Date(`${appointment.appointment_date}T${appointment.time_slot.slice(0, 5)}:00+07:00`) > new Date();
  useEffect(() => { if (mode === 'reschedule' && admin) api.get('/doctors').then(res => setDoctors(res.data)).catch(() => setError('Không tải được bác sĩ.')); if (mode === 'history') api.get(`/appointments/${appointment.id}/events`).then(res => setEvents(res.data)).catch(() => setError('Không tải được lịch sử.')); }, [mode, admin, appointment.id]);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      if (mode === 'reschedule') await api.put(`/appointments/${appointment.id}/reschedule`, { appointment_date: date, time_slot: slot, doctorId, version: appointment.version, reason });
      else await api.put(`/appointments/${appointment.id}/${admin ? 'status' : 'cancel'}`, { status: 'cancelled', reason });
      toast.success(mode === 'reschedule' ? 'Đã đổi lịch, đang chờ xác nhận lại.' : 'Đã hủy lịch.'); setMode(''); onUpdated?.(); window.dispatchEvent(new Event('clinic-updated'));
    } catch (err) { toast.error(err.response?.data?.message || 'Không cập nhật được lịch hẹn.'); } finally { setBusy(false); }
  }
  const open = next => { setMode(next); setError(''); setReason(''); };
  async function meeting() { const url = window.prompt('Liên kết phòng khám trực tuyến HTTPS (để trống để xóa):', appointment.meetingUrl || ''); if (url === null) return; try { await api.put(`/appointments/${appointment.id}/meeting`, { url }); toast.success('Đã lưu liên kết khám.'); onUpdated?.(); } catch (err) { toast.error(err.response?.data?.message || 'Không lưu được liên kết.'); } }
  return <div className="clinic-flex-wrap clinic-row-actions"><button type="button" onClick={() => open('receipt')}>Phiếu hẹn</button><button type="button" onClick={() => open('history')}>Lịch sử</button>{admin && changeable && <button type="button" onClick={meeting}>Liên kết khám</button>}{changeable && <><button type="button" onClick={() => open('reschedule')}>Đổi lịch</button><button type="button" onClick={() => open('cancel')}>Hủy lịch</button></>}
    {mode === 'receipt' && <AppointmentReceipt appointment={appointment} onClose={() => setMode('')} />}
    {['reschedule', 'cancel'].includes(mode) && <Modal title={mode === 'reschedule' ? 'Đổi lịch khám' : 'Hủy lịch khám'} onClose={() => setMode('')}><form onSubmit={submit}>
      {mode === 'reschedule' && <>{admin && <label>Bác sĩ<select className="clinic-input" value={doctorId} onChange={e => { setDoctorId(Number(e.target.value)); setSlot(''); }}>{doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.User?.full_name} — {doc.Specialty?.name}</option>)}</select></label>}<label>Ngày mới<input className="clinic-input" type="date" required min={clinicToday()} value={date} onChange={e => { setDate(e.target.value); setSlot(''); }} /></label><AvailableSlots doctorId={doctorId} date={date} value={slot} onChange={setSlot} /><p>Lịch mới sẽ chờ xác nhận lại. Lịch cũ được giữ nếu giờ mới không còn trống.</p></>}
      <label>Lý do<textarea className="clinic-input" required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<button className="btn-primary-natural" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</button>
    </form></Modal>}
    {mode === 'history' && <Modal title="Lịch sử thay đổi lịch hẹn" onClose={() => setMode('')}>{error && <p role="alert">{error}</p>}{!events.length && <p>Chưa có thay đổi được ghi nhận.</p>}{events.map(item => <article key={item.id}><strong>{new Date(item.createdAt).toLocaleString('vi-VN')}</strong><p>{({ created: 'Tạo yêu cầu', rescheduled: 'Đổi lịch', status: 'Cập nhật trạng thái', doctor_unavailable: 'Bác sĩ ngừng nhận lịch' })[item.kind] || item.kind} {item.details?.after && typeof item.details.after === 'string' ? `— ${statusLabels[item.details.after]}` : ''}</p>{item.reason && <p>Lý do: {item.reason}</p>}</article>)}</Modal>}
  </div>;
}
