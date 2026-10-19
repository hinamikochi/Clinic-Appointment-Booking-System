import { useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { CalendarDays, Clock3, CalendarOff, CalendarRange, Plus, Save, X } from 'lucide-react';
import { formatDate } from '../utils/clinicDate';
import './ScheduleEditor.css';

const slots = ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00', '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30'];
export default function ScheduleEditor({ doctor, onSaved, onClose }) {
  const initial = doctor.workSchedule || { weekdays: [1, 2, 3, 4, 5, 6], timeSlots: slots, daysOff: [] };
  const [work, setWork] = useState(initial);
  const [days, setDays] = useState(initial.daysOff.join(', '));
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(doctor.scheduleVersion || 1);
  const [dayOff, setDayOff] = useState('');
  const [start, setStart] = useState('10:00'), [end, setEnd] = useState('10:30');
  const [overrideDate, setOverrideDate] = useState('');
  const toggle = (field, value) => setWork(old => ({ ...old, [field]: old[field].includes(value) ? old[field].filter(item => item !== value) : [...old[field], value] }));
  async function save() {
    setSaving(true);
    try {
      const res = await api.put(`/doctors/${doctor.id}/schedule`, { ...work, version, daysOff: days.split(',').map(d => d.trim()).filter(Boolean) });
      setVersion(res.data.version);
      toast.success('Đã lưu lịch làm việc.');
      onSaved?.();
    } catch (error) { toast.error(error.response?.data?.message || 'Không lưu được lịch làm việc.'); }
    finally { setSaving(false); }
  }
  return <section className="natural-section-card clinic-typography schedule-editor">
    <header className="schedule-editor-header">
      <div className="schedule-editor-heading"><span className="schedule-heading-icon"><CalendarDays size={22} aria-hidden="true" /></span><div><h3>Lịch làm việc và ngày nghỉ</h3><p>{doctor.User?.full_name ? `Bác sĩ ${doctor.User.full_name} · ` : ''}Thiết lập thời gian nhận lịch khám</p></div></div>
      {onClose && <button type="button" className="btn-secondary-natural schedule-close" onClick={onClose}><X size={14} aria-hidden="true" />Đóng lịch làm việc</button>}
    </header>

    <fieldset className="schedule-block"><legend><CalendarDays size={16} aria-hidden="true" />Ngày làm việc trong tuần</legend><p className="schedule-help">Chọn các ngày bác sĩ nhận lịch khám định kỳ.</p>
      <div className="schedule-weekdays">{['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'].map((label, day) => <label className={`schedule-choice${work.weekdays.includes(day) ? ' is-selected' : ''}`} key={day}><input type="checkbox" checked={work.weekdays.includes(day)} onChange={() => toggle('weekdays', day)} /><span>{label}</span></label>)}</div>
    </fieldset>

    <fieldset className="schedule-block"><legend><Clock3 size={16} aria-hidden="true" />Khung giờ nhận khám</legend><p className="schedule-help">Các khung giờ đang chọn được áp dụng cho ngày làm việc định kỳ.</p>
      <div className="schedule-slots">{[...new Set([...slots, ...work.timeSlots])].sort().map(slot => <label className={`schedule-choice${work.timeSlots.includes(slot) ? ' is-selected' : ''}`} key={slot}><input type="checkbox" checked={work.timeSlots.includes(slot)} onChange={() => toggle('timeSlots', slot)} /><span>{slot}</span></label>)}</div>
      <div className="schedule-add-time"><label>Bắt đầu<input className="clinic-input" type="time" value={start} onChange={e => setStart(e.target.value)} /></label><label>Kết thúc<input className="clinic-input" type="time" value={end} onChange={e => setEnd(e.target.value)} /></label><button type="button" className="btn-secondary-natural" disabled={!start || !end} onClick={() => {const slot=`${start} - ${end}`;if(!work.timeSlots.includes(slot))setWork({...work,timeSlots:[...work.timeSlots,slot]});}}><Plus size={14} aria-hidden="true" />Thêm khung giờ</button></div>
    </fieldset>

    <div className="schedule-exceptions">
      <fieldset className="schedule-block"><legend><CalendarOff size={16} aria-hidden="true" />Ngày nghỉ</legend><p className="schedule-help">Không nhận lịch khám vào các ngày này.</p>
        <div className="schedule-date-action"><label>Chọn ngày nghỉ<input className="clinic-input" type="date" value={dayOff} onChange={e => setDayOff(e.target.value)} /></label><button type="button" className="btn-secondary-natural" disabled={!dayOff} onClick={() => {if(dayOff)setDays([...new Set([...days.split(',').map(d=>d.trim()).filter(Boolean),dayOff])].join(', '));setDayOff('');}}><Plus size={14} aria-hidden="true" />Thêm</button></div>
        <div className="schedule-day-list">{days.split(',').map(d=>d.trim()).filter(Boolean).length ? days.split(',').map(d=>d.trim()).filter(Boolean).map(day=><button className="schedule-date-chip" type="button" key={day} aria-label={`Bỏ ngày nghỉ ${formatDate(day)}`} onClick={()=>setDays(days.split(',').map(d=>d.trim()).filter(d=>d!==day).join(', '))}><CalendarOff size={13} aria-hidden="true" />{formatDate(day)}<X size={12} aria-hidden="true" /></button>) : <p className="schedule-empty">Chưa có ngày nghỉ được thêm.</p>}</div>
      </fieldset>

      <fieldset className="schedule-block"><legend><CalendarRange size={16} aria-hidden="true" />Lịch riêng theo ngày</legend><p className="schedule-help">Áp dụng các khung giờ đang chọn ở trên cho một ngày cụ thể. Ngày nghỉ được ưu tiên hơn lịch riêng.</p>
        <div className="schedule-date-action"><label>Chọn ngày áp dụng<input className="clinic-input" type="date" value={overrideDate} onChange={e=>setOverrideDate(e.target.value)} /></label><button type="button" className="btn-secondary-natural" disabled={!overrideDate} onClick={()=>{if(overrideDate)setWork({...work,dateOverrides:{...work.dateOverrides,[overrideDate]:[...work.timeSlots]}});}}><Plus size={14} aria-hidden="true" />Áp dụng</button></div>
        <div className="schedule-override-list">{Object.entries(work.dateOverrides||{}).length ? Object.entries(work.dateOverrides||{}).map(([date,list])=><article className="schedule-override" key={date}><div><strong>{formatDate(date)}</strong><p>{list.length ? list.join(' · ') : 'Không có khung giờ nhận khám'}</p></div><button className="schedule-remove" type="button" aria-label={`Xóa lịch riêng ${formatDate(date)}`} onClick={()=>{const next={...work.dateOverrides};delete next[date];setWork({...work,dateOverrides:next});}}><X size={14} aria-hidden="true" /></button></article>) : <p className="schedule-empty">Chưa có lịch riêng theo ngày.</p>}</div>
      </fieldset>
    </div>

    <footer className="schedule-editor-footer"><p>Thay đổi chỉ được áp dụng sau khi lưu lịch làm việc.</p><button type="button" className="btn-primary-natural" disabled={saving} onClick={save}><Save size={15} aria-hidden="true" />{saving ? 'Đang lưu…' : 'Lưu lịch làm việc'}</button></footer>
  </section>;
}
