import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays } from 'lucide-react';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách lịch hẹn:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5001/api/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) {
      alert("Lỗi cập nhật trạng thái lịch hẹn");
    }
  };

  const filtered = appointments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Header */}
      <div className="section-header-flex" style={{ backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '20px', border: '1px solid #e6e6df', width: '100%' }}>
        <div>
          <h2 className="section-title-garamond" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={24} color="#5a5a40" /> Quản Lý Lịch Hẹn Khám Bệnh
          </h2>
          <p style={{ fontSize: '13px', color: '#8a8a70', margin: '4px 0 0 0' }}>
            Danh sách phiếu đặt lịch khám bệnh trực tuyến từ Bệnh Nhân
          </p>
        </div>

        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: '99px', border: '1px solid #e6e6df', backgroundColor: '#fdfbf7', fontSize: '13px' }}
        >
          <option value="all">-- Tất cả trạng thái --</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã duyệt</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Bảng Danh Sách Lịch Hẹn Thực */}
      <div className="natural-section-card" style={{ width: '100%' }}>
        <table className="natural-table">
          <thead>
            <tr>
              <th>Mã Lịch</th>
              <th>Bệnh Nhân</th>
              <th>Số Điện Thoại</th>
              <th>Chuyên Khoa</th>
              <th>Bác Sĩ Duyện Khám</th>
              <th>Ngày & Khung Giờ</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                  <td style={{ fontWeight: '600' }}>{apt.patient_name}</td>
                  <td>{apt.patient_phone}</td>
                  <td>{apt.Specialty?.name || 'Chuyên Khoa'}</td>
                  <td>{apt.DoctorInfo?.User?.full_name || 'Bác Sĩ'}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{apt.appointment_date}</div>
                    <div style={{ fontSize: '12px', color: '#8a8a70' }}>{apt.time_slot}</div>
                  </td>
                  <td>
                    <span className={`badge-status ${apt.status === 'confirmed' ? 'active' : 'pending'}`}>
                      {apt.status === 'confirmed' ? 'Đã duyệt' : apt.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                    </span>
                  </td>
                  <td>
                    {apt.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                          style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: '#2e6f40', color: 'white', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                          style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: '#b84343', color: 'white', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#8a8a70' }}>
                  Chưa có phiếu đặt lịch hẹn khám nào trong danh sách
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppointmentsView;