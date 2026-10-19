import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
export default function RecordWorkspace({ appointment, data, onRestore }) {
  const [context, setContext] = useState(null), [draft, setDraft] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [saved, setSaved] = useState('');
  const baseline = useRef(JSON.stringify(data)), latest = useRef(data), version = useRef(0);
  latest.current = data;
  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/appointments/${appointment.id}/context`), api.get(`/appointments/${appointment.id}/draft`)]).then(([ctx, dr]) => { if (active) { setContext(ctx.data); setDraft(dr.data); version.current = dr.data?.version || 0; } }).catch(() => { if (active) setError('Không tải được ngữ cảnh hoặc bản nháp.'); });
    const warn = event => { if (JSON.stringify(latest.current) !== baseline.current) { event.preventDefault(); event.returnValue = ''; } };
    const guard = event => { const target = event.target.closest('a,.sidebar-nav-item,button'); const leaving = target && (target.matches('a,.sidebar-nav-item') || /quay lại|hủy bỏ/i.test(target.textContent)); if (leaving && JSON.stringify(latest.current) !== baseline.current && !window.confirm('Có nội dung chưa lưu. Bạn có muốn rời màn hình?')) { event.preventDefault(); event.stopPropagation(); } };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', guard, true);
    return () => { active = false; window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guard, true); };
  }, [appointment.id]);
  async function save() { setBusy(true); try { const res = await api.put(`/appointments/${appointment.id}/draft`, { data: latest.current, version: version.current }); version.current = res.data.version; baseline.current = JSON.stringify(latest.current); setSaved(new Date().toLocaleTimeString('vi-VN')); toast.success('Đã lưu bản nháp trên hệ thống.'); } catch (err) { toast.error(err.response?.data?.message || 'Không lưu được nháp.'); } finally { setBusy(false); } }
  return <section className="clinic-typography"><p>Triệu chứng ban đầu: {appointment.symptoms || 'Chưa ghi nhận'}</p>{error && <p role="alert">{error}</p>}{context?.profile && <div className="clinic-feedback"><strong>{context.profile.fullName}</strong><p>Dị ứng: {context.profile.allergies || 'Chưa ghi nhận'}</p><p>Tiền sử: {context.profile.medicalHistory || 'Chưa ghi nhận'}</p><details><summary>Lịch sử khám trong phạm vi được phép ({context.history.length})</summary>{context.history.map(record => <article key={record.id}><p>{new Date(record.createdAt).toLocaleDateString('vi-VN')}: {record.diagnosis}</p></article>)}</details></div>}{draft && <p>Có bản nháp đã lưu. <button type="button" onClick={() => { onRestore(draft.data); baseline.current = JSON.stringify(draft.data); setDraft(null); }}>Khôi phục bản nháp</button></p>}<button type="button" className="btn-secondary-natural" disabled={busy} onClick={save}>{busy ? 'Đang lưu nháp…' : 'Lưu bản nháp'}</button>{saved && <small role="status"> Đã lưu lúc {saved}</small>}</section>;
}
