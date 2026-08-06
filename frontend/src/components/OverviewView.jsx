import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './StatCard';
import { Stethoscope, Building2, CalendarDays, Users, CalendarX } from 'lucide-react';

export function OverviewView({ docCount, specCount, setActiveTab }) {
  const [appointments, setAppointments] = useState([]);

  // Tải danh sách lịch hẹn thực tế từ Backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error("Lỗi lấy lịch hẹn cho Dashboard:", err);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div>
      {/* Grid 4 Thẻ Thống Kê Dữ Liệu Thực */}
      <div className="stats-grid-container">
        <StatCard title="Bác Sĩ Hệ Thống" value={docCount} trend="Dữ liệu thực" icon={Stethoscope} />
        <StatCard title="Chuyên Khoa Hoạt Động" value={specCount} trend="Dữ liệu thực" icon={Building2} />
        <StatCard title="Tổng Lịch Hẹn Khám" value={appointments.length} trend="Cập nhật trực tiếp" icon={CalendarDays} />
        <StatCard title="Bệnh Nhân Quản Lý" value={appointments.length} trend="Theo phiếu khám" icon={Users} />
      </div>

      {/* Bảng Lịch Đặt Khám Gần Đây */}
      <div className="natural-section-card">
        <div className="section-header-flex">
          <h3 className="section-title-garamond"> Lịch Đặt Khám Gần Đây</h3>
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
              <th>Khung Giờ</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.slice(0, 5).map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                  <td style={{ fontWeight: '600' }}>{apt.patient_name}</td>
                  <td>{apt.patient_phone}</td>
                  <td>{apt.Specialty?.name || 'Chuyên khoa'}</td>
                  <td>{apt.DoctorInfo?.User?.full_name || 'Bác sĩ'}</td>
                  <td>
                    <div>{apt.appointment_date}</div>
                    <div style={{ fontSize: '12px', color: '#8a8a70' }}>{apt.time_slot}</div>
                  </td>
                  <td>
                    <span className={`badge-status ${apt.status === 'confirmed' ? 'active' : 'pending'}`}>
                      {apt.status === 'confirmed' ? 'Đã duyệt' : apt.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt'}
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