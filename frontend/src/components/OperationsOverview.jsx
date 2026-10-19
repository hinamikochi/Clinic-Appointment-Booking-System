import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import AppointmentStatus from './AppointmentStatus';
import { formatDate } from '../utils/clinicDate';
export default function OperationsOverview({ docCount, specCount, setActiveTab }) {
  const [stats, setStats] = useState(null), [error, setError] = useState('');
  const load = useCallback(async () => { try { const res = await api.get('/admin/dashboard-stats'); setStats(res.data); setError(''); } catch { setError('Không tải được thống kê.'); } }, []);
  useEffect(() => { load(); const timer = setInterval(load, 30000); window.addEventListener('focus', load); window.addEventListener('clinic-updated', load); return () => { clearInterval(timer); window.removeEventListener('focus', load); window.removeEventListener('clinic-updated', load); }; }, [load]);
  if (error) return <p role="alert">{error} <button onClick={load}>Thử lại</button></p>;
  if (!stats) return <p role="status">Đang tải thống kê…</p>;
  const counts = { pending: stats.pendingCount, confirmed: stats.confirmedCount, arrived: stats.arrivedCount || 0, in_progress: stats.inProgressCount || 0, completed: stats.completedCount, cancelled: stats.cancelledCount, no_show: stats.noShowCount || 0 };
  return <div><div className="stats-grid-container">{[['Tổng lịch hẹn', stats.totalApts], ['Tỷ lệ lịch đã hoàn thành', `${stats.successRate}%`], ['Bác sĩ trong hệ thống', docCount], ['Chuyên khoa', specCount]].map(([label, value]) => <article className="stat-card-natural" key={label}><div><strong className="stat-number">{value}</strong><p>{label}</p></div></article>)}</div>
    <div className="clinic-form-grid" style={{ marginTop: 24 }}><section className="natural-section-card"><h3>Phân bố theo chuyên khoa</h3>{stats.specialtyStats.map(spec => <p key={spec.id}>{spec.name}: <strong>{spec.count}</strong> ({spec.percentage}%)</p>)}</section><section className="natural-section-card"><h3>Trạng thái lịch hẹn</h3>{Object.entries(counts).map(([status, count]) => <p key={status}><AppointmentStatus status={status} /> <strong>{count}</strong></p>)}</section></div>
    <section className="natural-section-card"><h3>Lịch hẹn mới nhất</h3><button onClick={() => setActiveTab('appointments')}>Xem tất cả lịch hẹn</button><div className="natural-table-container"><table className="natural-table"><thead><tr><th>Mã</th><th>Người khám</th><th>Bác sĩ</th><th>Ngày khám</th><th>Trạng thái</th></tr></thead><tbody>{stats.recentAppointments.map(apt => <tr key={apt.id}><td>LH-{apt.id}</td><td>{apt.patient_name}</td><td>{apt.DoctorInfo?.User?.full_name}</td><td>{formatDate(apt.appointment_date)} · {apt.time_slot}</td><td><AppointmentStatus status={apt.status} /></td></tr>)}</tbody></table></div></section>
  </div>;
}
