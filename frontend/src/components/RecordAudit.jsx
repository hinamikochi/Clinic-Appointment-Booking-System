import { useEffect, useState } from 'react';
import api from '../api';
export default function RecordAudit({ recordId }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/medical-records/${recordId}/audit`).then(res => { if (active) setRows(res.data); }).catch(() => { if (active) setError('Không tải được lịch sử chỉnh sửa.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [recordId, retry]);
  return <details><summary>Lịch sử chỉnh sửa bệnh án</summary>
    {loading && <p role="status">Đang tải…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => setRetry(n => n + 1)}>Thử lại</button></p>}
    {!loading && !error && !rows.length && <p>Chưa có lịch sử chỉnh sửa được ghi nhận.</p>}
    {rows.map(row => <article key={row.id} style={{ borderBottom: '1px solid #e6e6df', padding: 12 }}>
      <p>{new Date(row.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} — Tài khoản #{row.actorId}</p>
      <p>Chẩn đoán: {row.after.diagnosis}</p><p style={{ whiteSpace: 'pre-line' }}>Đơn thuốc: {row.after.prescription || 'Không có'}</p>
      <p>Lời dặn: {row.after.advice || 'Không có'}</p>
    </article>)}
  </details>;
}
