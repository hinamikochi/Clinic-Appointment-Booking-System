import { useEffect, useState } from 'react';
import api from '../api';

export default function AvailableSlots({ doctorId, date, value, onChange }) {
  const [state, setState] = useState({ key: '', slots: [], loading: false, error: '' });
  const [retry, setRetry] = useState(0);
  const key = `${doctorId}|${date}`;
  useEffect(() => {
    let active = true;
    if (!doctorId || !date) return;
    setState({ key, slots: [], loading: true, error: '' });
    api.get('/availability', { params: { doctorId, date } }).then(res => {
      if (active) setState({ key, slots: res.data, loading: false, error: '' });
    }).catch(() => {
      if (active) setState({ key, slots: [], loading: false, error: 'Không tải được giờ trống.' });
    });
    return () => { active = false; };
  }, [doctorId, date, key, retry]);
  const ready = state.key === key && !state.loading && !state.error;
  const available = ready ? state.slots.filter(slot => slot.available) : [];
  const selected = available.some(slot => slot.slot === value) ? value : '';
  return <>
    <select required aria-label="Khung giờ khám" value={selected} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 16, border: '1px solid #e6e6df', marginTop: 4 }}>
      <option value="">{!doctorId ? 'Chọn bác sĩ' : state.error ? 'Không tải được giờ trống' : !ready ? 'Đang tải giờ trống…' : !available.length ? 'Không còn giờ trống' : 'Chọn giờ khám'}</option>
      {ready && state.slots.map(item => <option key={item.slot} value={item.slot} disabled={!item.available}>{item.slot}{item.available ? '' : ' — Không còn trống'}</option>)}
    </select>
    {state.error && <div role="alert">{state.error} <button type="button" onClick={() => setRetry(n => n + 1)}>Thử lại</button></div>}
    {ready && <button type="button" onClick={() => setRetry(n => n + 1)} style={{ marginTop: 6 }}>Cập nhật giờ trống</button>}
  </>;
}
