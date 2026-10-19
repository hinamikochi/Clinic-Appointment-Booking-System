import { useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

const slots = ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00', '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30'];
export default function ScheduleEditor({ doctor, onSaved }) {
  const initial = doctor.workSchedule || { weekdays: [1, 2, 3, 4, 5, 6], timeSlots: slots, daysOff: [] };
  const [work, setWork] = useState(initial);
  const [days, setDays] = useState(initial.daysOff.join(', '));
  const [saving, setSaving] = useState(false);
  const toggle = (field, value) => setWork(old => ({ ...old, [field]: old[field].includes(value) ? old[field].filter(item => item !== value) : [...old[field], value] }));
  async function save() {
    setSaving(true);
    try {
      await api.put(`/doctors/${doctor.id}/schedule`, { ...work, daysOff: days.split(',').map(d => d.trim()).filter(Boolean) });
      toast.success('Đã lưu lịch làm việc.');
      onSaved?.();
    } catch (error) { toast.error(error.response?.data?.message || 'Không lưu được lịch làm việc.'); }
    finally { setSaving(false); }
  }
  return <section className="natural-section-card">
    <h3>Lịch làm việc và ngày nghỉ</h3>
    <div className="clinic-flex-wrap">{['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'].map((label, day) => <label key={day}><input type="checkbox" checked={work.weekdays.includes(day)} onChange={() => toggle('weekdays', day)} /> {label}</label>)}</div>
    <div className="clinic-flex-wrap">{slots.map(slot => <label key={slot}><input type="checkbox" checked={work.timeSlots.includes(slot)} onChange={() => toggle('timeSlots', slot)} /> {slot}</label>)}</div>
    <label>Ngày nghỉ (YYYY-MM-DD, cách nhau bằng dấu phẩy)<input className="clinic-input" value={days} onChange={e => setDays(e.target.value)} placeholder="2026-12-25, 2027-01-01" /></label>
    <button type="button" className="btn-primary-natural" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu lịch làm việc'}</button>
  </section>;
}
