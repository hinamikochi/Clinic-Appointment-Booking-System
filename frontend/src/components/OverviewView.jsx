import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './StatCard';
import { 
  Stethoscope, 
  Building2, 
  CalendarDays, 
  CalendarX, 
  BarChart3, 
  PieChart, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Activity,
  TrendingUp
} from 'lucide-react';

export function OverviewView({ docCount, specCount, setActiveTab }) {
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

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/admin/dashboard-stats');
        setStats(res.data);
      } catch (err) {
        console.error("Lỗi nạp dữ liệu thống kê Dashboard từ CSDL:", err);
      }
    };
    fetchDashboardStats();
  }, []);

  const { 
    totalApts, 
    completedCount, 
    confirmedCount, 
    pendingCount, 
    cancelledCount, 
    successRate, 
    specialtyStats, 
    recentAppointments 
  } = stats;

  // Tính góc độ cho Biểu đồ hình tròn
  const degCompleted = totalApts > 0 ? (completedCount / totalApts) * 360 : 0;
  const degConfirmed = totalApts > 0 ? degCompleted + (confirmedCount / totalApts) * 360 : degCompleted;
  const degPending = totalApts > 0 ? degConfirmed + (pendingCount / totalApts) * 360 : degConfirmed;

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
          title="Tỷ Lệ Khám Thành Công" 
          value={`${successRate}%`} 
          trend={`${completedCount}/${totalApts} ca đã khám xong`} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Bác Sĩ Hệ Thống" 
          value={docCount} 
          trend="Đang trực khám" 
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* BIỂU ĐỒ 1: CA KHÁM THEO TỪNG CHUYÊN KHOA */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e6e6df', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#5a5a40" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#2d2d2a', fontFamily: 'serif' }}>
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
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#2d2d2a', fontFamily: 'serif' }}>
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
              background: totalApts > 0 ? `conic-gradient(
                #2e6f40 0deg ${degCompleted}deg,
                #3b82f6 ${degCompleted}deg ${degConfirmed}deg,
                #c4820e ${degConfirmed}deg ${degPending}deg,
                #b84343 ${degPending}deg 360deg
              )` : '#e6e6df',
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#2e6f40' }} />
                  <span style={{ color: '#2d2d2a', fontWeight: '600' }}>Đã khám xong</span>
                </div>
                <span style={{ fontWeight: '700', color: '#2e6f40' }}>{completedCount}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#3b82f6' }} />
                  <span style={{ color: '#2d2d2a', fontWeight: '600' }}>Đã duyệt hẹn</span>
                </div>
                <span style={{ fontWeight: '700', color: '#3b82f6' }}>{confirmedCount}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#c4820e' }} />
                  <span style={{ color: '#2d2d2a', fontWeight: '600' }}>Chờ duyệt hẹn</span>
                </div>
                <span style={{ fontWeight: '700', color: '#c4820e' }}>{pendingCount}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#b84343' }} />
                  <span style={{ color: '#2d2d2a', fontWeight: '600' }}>Đã hủy lịch</span>
                </div>
                <span style={{ fontWeight: '700', color: '#b84343' }}>{cancelledCount}</span>
              </div>
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

        <table className="natural-table">
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
                    <span className={`badge-status ${apt.status === 'completed' ? 'completed' : apt.status === 'confirmed' ? 'confirmed' : apt.status === 'cancelled' ? 'cancelled' : 'pending'}`}>
                      {apt.status === 'completed' ? 'Đã khám xong' : apt.status === 'confirmed' ? 'Đã duyệt' : apt.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt'}
                    </span>
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
        </table>
      </div>
    </div>
  );
}

export default OverviewView;