import React from 'react';
import StatCard from './StatCard';
import { Stethoscope, Building2, CalendarDays, Users, CalendarX } from 'lucide-react';

export function OverviewView({ docCount, specCount }) {
  // Danh sách lịch hẹn thực tế (hiện tại chưa có dữ liệu)
  const appointments = [];

  return (
    <div>
      {/* Grid 4 Thẻ Thống Kê Giữ Nguyên Cấu Trúc */}
      <div className="stats-grid-container">
        <StatCard title="Bác Sĩ Hệ Thống" value={docCount} trend="Dữ liệu thực" icon={Stethoscope} />
        <StatCard title="Chuyên Khoa Hoạt Động" value={specCount} trend="Dữ liệu thực" icon={Building2} />
        <StatCard title="Lịch Hẹn Hôm Nay" value="0" trend="Chưa có lượt hẹn" icon={CalendarDays} />
        <StatCard title="Bệnh Nhân Quản Lý" value="0" trend="Chưa có hồ sơ" icon={Users} />
      </div>

      {/* Bảng Lịch Hẹn Khám (Cấu trúc giữ nguyên, hiển thị khi có dữ liệu) */}
      <div className="natural-section-card">
        <div className="section-header-flex">
          <h3 className="section-title-garamond">📅 Lịch Đặt Khám Gần Đây</h3>
          <span style={{ fontSize: '13px', color: '#8a8a70' }}>Cập nhật theo thời gian thực</span>
        </div>

        <table className="natural-table">
          <thead>
            <tr>
              <th>Mã Lịch</th>
              <th>Bệnh Nhân</th>
              <th>Bác Sĩ Đảm Nhận</th>
              <th>Khung Giờ</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: '600', color: '#5a5a40' }}>{apt.id}</td>
                  <td>{apt.patient}</td>
                  <td>{apt.doctor}</td>
                  <td>{apt.time}</td>
                  <td><span className="badge-status active">{apt.status}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#8a8a70' }}>
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