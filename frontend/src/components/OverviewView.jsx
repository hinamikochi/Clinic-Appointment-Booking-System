import React, { useState, useEffect, useCallback } from 'react';
import AppointmentStatus from './AppointmentStatus';
import { statusLabels } from '../utils/appointmentStatus';
import api from '../api';
import StatCard from './StatCard';
import {
  Stethoscope,
  Building2,
  CalendarDays,
  CalendarX,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';

export function OverviewView({ docCount, specCount, setActiveTab }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // State nhận dữ liệu tính toán sẵn từ CSDL Backend
  const [stats, setStats] = useState({
    totalApts: 0,
    completedCount: 0,
    confirmedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    successRate: 0,
    specialtyStats: [],
    recentAppointments: []
  });

  const fetchDashboardStats = useCallback(async () => {
      try {
        const res = await api.get('/admin/dashboard-stats');
        setStats(res.data);
        setError('');
      } catch (err) {
        console.error("Lỗi nạp dữ liệu thống kê Dashboard từ CSDL:", err);
        setError('Không tải được thống kê. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
  }, []);
  useEffect(() => {
    fetchDashboardStats();
    const timer = setInterval(fetchDashboardStats, 30000);
    window.addEventListener('focus', fetchDashboardStats);
    window.addEventListener('clinic-updated', fetchDashboardStats);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', fetchDashboardStats);
      window.removeEventListener('clinic-updated', fetchDashboardStats);
    };
  }, [fetchDashboardStats]);

  const {
    totalApts,
    completedCount,
    successRate,
    specialtyStats,
    recentAppointments
  } = stats;

  const segments = [
    ['completed', stats.completedCount, '#2e6f40'],
    ['confirmed', stats.confirmedCount, '#3b82f6'],
    ['pending', stats.pendingCount, '#c4820e'],
    ['arrived', stats.arrivedCount, '#21758a'],
    ['in_progress', stats.inProgressCount, '#7954a1'],
    ['cancelled', stats.cancelledCount, '#b84343'],
    ['no_show', stats.noShowCount, '#8a6454'],
  ];
  let angle = 0;
  const gradient = segments.map(([, count, color]) => {
    const start = angle;
    angle += totalApts > 0 ? ((count || 0) / totalApts) * 360 : 0;
    return color + ' ' + start + 'deg ' + angle + 'deg';
  }).join(', ');
  if (loading) return <p className="clinic-admin-feedback" role="status">Đang tải thống kê…</p>;
  if (error) return <div className="clinic-admin-feedback" role="alert">{error} <button className="btn-secondary-natural" onClick={fetchDashboardStats}>Thử lại</button></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* GRID 4 THẺ CHỈ SỐ VẬN HÀNH HOẠT ĐỘNG */}
      <div className="stats-grid-container">
        <StatCard
          title="Tổng Lịch Đặt Khám"
          value={`${totalApts} Phiếu`}
          trend="Tất cả phiếu đăng ký"
          icon={CalendarDays}
        />
        <StatCard
          title="Tỷ Lệ Lịch Đã Hoàn Thành"
          value={`${successRate}%`}
          trend={`${completedCount}/${totalApts} ca đã khám xong`}
          icon={TrendingUp}
        />
        <StatCard
          title="Bác Sĩ Hệ Thống"
          value={docCount}
          trend="Tài khoản bác sĩ"
          icon={Stethoscope}
        />
        <StatCard
          title="Chuyên Khoa Y Tế"
          value={specCount}
          trend="Danh mục phục vụ"
          icon={Building2}
        />
      </div>

      {/* BIỂU ĐỒ THỐNG KÊ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>

        {/* BIỂU ĐỒ 1: CA KHÁM THEO TỪNG CHUYÊN KHOA */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e6e6df', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#5a5a40" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#2d2d2a', fontFamily: 'var(--font-ui)' }}>
                Phân Bổ Ca Khám Theo Chuyên Khoa
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#8a8a70' }}>{specCount} Chuyên khoa</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {specialtyStats && specialtyStats.length > 0 ? (
              specialtyStats.map((item, idx) => {
                const colors = ['#5a5a40', '#2e6f40', '#c4820e', '#3b82f6', '#8b5cf6'];
                const barColor = colors[idx % colors.length];
                return (
                  <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600', color: '#2d2d2a' }}>
                      <span>{item.name}</span>
                      <span style={{ color: '#8a8a70' }}>{item.count} ca ({item.percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#f0f0ea', borderRadius: '99px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          height: '100%',
                          backgroundColor: barColor,
                          borderRadius: '99px',
                          transition: 'width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#8a8a70', fontSize: '13px' }}>Chưa có dữ liệu chuyên khoa.</div>
            )}
          </div>
        </div>

        {/* BIỂU ĐỒ 2: BIỂU ĐỒ HÌNH TRÒN TRẠNG THÁI CA KHÁM */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e6e6df', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} color="#5a5a40" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#2d2d2a', fontFamily: 'var(--font-ui)' }}>
                Trạng Thái Phiếu Đặt Khám
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#8a8a70' }}>Tổng: {totalApts} phiếu</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            justifyContent: 'center',
            padding: '10px 0'
          }}>
            {/* VẼ BIỂU ĐỒ HÌNH TRÒN CONIC-GRADIENT */}
            <div style={{
              width: '170px',
              height: '170px',
              borderRadius: '50%',
              background: totalApts > 0 ? `conic-gradient(${gradient})` : '#e6e6df',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              flexShrink: 0
            }}>
              <div style={{
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#2d2d2a' }}>{totalApts}</div>
                <div style={{ fontSize: '13px', color: '#8a8a70', fontWeight: '600' }}>TỔNG CA</div>
              </div>
            </div>

            {/* CHÚ THÍCH CÁC MÀU TRONG BIỂU ĐỒ HÌNH TRÒN */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              maxWidth: '320px'
            }}>
              {segments.map(([status, count, color]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span aria-hidden="true" style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: color }} />
                    <span style={{ color: '#2d2d2a', fontWeight: '600' }}>{statusLabels[status]}</span>
                  </div>
                  <span style={{ fontWeight: '700', color }}>{count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG LỊCH ĐẶT KHÁM GẦN ĐÂY */}
      <div className="natural-section-card">
        <div className="section-header-flex">
          <h3 className="section-title-garamond" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} color="#5a5a40" /> Lịch Đặt Khám Gần Đây
          </h3>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('appointments')}
              style={{ background: 'none', border: 'none', color: '#5a5a40', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              Xem tất cả &rarr;
            </button>
          )}
        </div>

        <div className="natural-table-container"><table className="natural-table">
          <thead>
            <tr>
              <th>Mã Lịch</th>
              <th>Bệnh Nhân</th>
              <th>Số Điện Thoại</th>
              <th>Chuyên Khoa</th>
              <th>Bác Sĩ Đảm Nhận</th>
              <th>Khung Giờ Khám</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {recentAppointments && recentAppointments.length > 0 ? (
              recentAppointments.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                  <td style={{ fontWeight: '600' }}>{apt.patient_name}</td>
                  <td>{apt.patient_phone}</td>
                  <td>{apt.Specialty?.name || 'Chuyên khoa'}</td>
                  <td>{apt.DoctorInfo?.User?.full_name || 'Bác sĩ'}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{apt.appointment_date}</div>
                    <div style={{ fontSize: '12px', color: '#8a8a70' }}>{apt.time_slot}</div>
                  </td>
                  <td>
                    <AppointmentStatus status={apt.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#8a8a70' }}>
                  <CalendarX size={32} color="#8a8a70" style={{ display: 'block', margin: '0 auto 8px auto' }} />
                  Chưa có lịch đặt khám nào trong hệ thống
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

export default OverviewView;
