import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { clinicToday, formatDate } from '../utils/clinicDate';
const blank = { fullName: '', birthDate: '', gender: '', phone: '', allergies: '', medicalHistory: '' };
export default function PatientProfiles() {
  const [items, setItems] = useState([]), [form, setForm] = useState(blank), [id, setId] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setItems((await api.get('/patient-profiles')).data); setError(''); } catch { setError('Không tải được hồ sơ.'); } }, []);
  useEffect(() => { load(); }, [load]);
  async function save(event) { event.preventDefault(); setBusy(true); try { if (id) await api.put(`/patient-profiles/${id}`, form); else await api.post('/patient-profiles', form); setForm(blank); setId(null); await load(); toast.success('Đã lưu hồ sơ người khám.'); } catch (err) { toast.error(err.response?.data?.message || 'Không lưu được hồ sơ.'); } finally { setBusy(false); } }
  return <section className="natural-section-card clinic-typography"><h2>Hồ sơ người được khám</h2><p>Mỗi người có một hồ sơ riêng. Bạn có thể đặt lịch cho mình hoặc người thân bằng hồ sơ tương ứng.</p>{error && <p role="alert">{error} <button onClick={load}>Thử lại</button></p>}
    <div className="clinic-flex-wrap">{items.map(item => <article key={item.id} className="clinic-profile-card"><strong>{item.fullName}</strong><p>{formatDate(item.birthDate)} · {item.gender}</p><button type="button" onClick={() => { setId(item.id); setForm(item); }}>Chỉnh sửa</button></article>)}</div>
    <form onSubmit={save} className="clinic-form-grid"><h3>{id ? 'Sửa hồ sơ' : 'Thêm hồ sơ'}</h3><label>Họ tên<input className="clinic-input" required maxLength={150} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label><label>Ngày sinh<input className="clinic-input" type="date" required max={clinicToday()} value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} /></label><label>Giới tính<select className="clinic-input" required value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">Chọn giới tính</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></label><label>Số điện thoại liên hệ<input className="clinic-input" type="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label>Dị ứng đã biết<textarea className="clinic-input" maxLength={5000} value={form.allergies || ''} onChange={e => setForm({ ...form, allergies: e.target.value })} /></label><label>Tiền sử bệnh<textarea className="clinic-input" maxLength={5000} value={form.medicalHistory || ''} onChange={e => setForm({ ...form, medicalHistory: e.target.value })} /></label><div><button className="btn-primary-natural" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>{id && <button type="button" onClick={() => { setId(null); setForm(blank); }}>Hủy chỉnh sửa</button>}</div></form>
  </section>;
}
export function ProfilePicker({ value, onChange, onSelect }) {
  const [profiles, setProfiles] = useState([]), [error, setError] = useState('');
  useEffect(() => { api.get('/patient-profiles').then(res => setProfiles(res.data)).catch(() => setError('Không tải được hồ sơ người khám.')); }, []);
  return <label>Đặt lịch cho ai?<select className="clinic-input" value={value} onChange={e => { onChange(e.target.value); const profile = profiles.find(p => String(p.id) === e.target.value); if (profile) onSelect(profile); }}><option value="">Nhập thông tin trực tiếp</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.fullName} — {formatDate(p.birthDate)}</option>)}</select>{!profiles.length && <small>Bạn có thể tạo hồ sơ của mình/người thân tại mục “Hồ sơ người khám”.</small>}{error && <span role="alert">{error}</span>}</label>;
}
