import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, FileText, Pill, Calendar, X } from 'lucide-react';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // State Modal xem Bệnh án dành cho Admin
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

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

  const handleOpenRecordModal = (apt) => {
    setSelectedRecord({
      appointment: apt,
      medicalRecord: apt.MedicalRecord
    });
    setShowRecordModal(true);
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
          style={{ padding: '8px 16px', borderRadius: '99px', border: '1px solid #e6e6df', backgroundColor: '#fdfbf7', fontSize: '13px', outline: 'none' }}
        >
          <option value="all">-- Tất cả trạng thái --</option>
          <option value="pending">Chờ duyệt</option>
          <option value="confirmed">Đã duyệt</option>
          <option value="completed">Đã khám xong</option>
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
                    <span className={`badge-status ${apt.status === 'completed' ? 'active' : apt.status === 'confirmed' ? 'active' : 'pending'}`}>
                      {apt.status === 'completed' ? 'Đã khám xong' : apt.status === 'confirmed' ? 'Đã duyệt' : apt.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    {/* THAO TÁC 1: DUYỆT / HỦY KHI Ở DẠNG CHỜ DUYỆT */}
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

                    {/* THAO TÁC 2: NÚT XEM KẾT QUẢ KHÁM NẾU ĐÃ KHÁM XONG */}
                    {apt.status === 'completed' && (
                      <button 
                        onClick={() => handleOpenRecordModal(apt)}
                        className="btn-primary-natural"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={14} /> Xem Kết Quả Khám
                      </button>
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

      {/* MODAL XEM CHI TIẾT BỆNH ÁN DÀNH CHO ADMIN */}
      {showRecordModal && selectedRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '650px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: '1px solid #e6e6df', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#5a5a40', color: '#ffffff', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'serif' }}>
                   CHI TIẾT KẾT QUẢ KHÁM BỆNH
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                  Bệnh nhân: {selectedRecord.appointment.patient_name} • Mã phiếu: LH-{selectedRecord.appointment.id}
                </div>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#fdfbf7', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e6e6df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8a8a70', textTransform: 'uppercase', fontWeight: '700' }}>Bác sĩ khám</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d2d2a', marginTop: '2px' }}>
                    {selectedRecord.appointment.DoctorInfo?.User?.full_name || 'Bác sĩ chuyên khoa'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#8a8a70', textTransform: 'uppercase', fontWeight: '700' }}>Chuyên khoa</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#5a5a40', marginTop: '2px' }}>
                    {selectedRecord.appointment.Specialty?.name || 'Đa khoa'}
                  </div>
                </div>
              </div>

              {selectedRecord.medicalRecord ? (
                <>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <FileText size={16} /> CHẨN ĐOÁN CỦA BÁC SĨ
                    </div>
                    <div style={{ backgroundColor: '#fdfbf7', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', color: '#2d2d2a', fontWeight: '600', lineHeight: '1.5' }}>
                      {selectedRecord.medicalRecord.diagnosis}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5a5a40', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Pill size={16} /> ĐƠN THUỐC KÊ ĐƠN
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e6e6df', fontSize: '13px', color: '#2d2d2a', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                      {selectedRecord.medicalRecord.prescription || 'Không kê đơn thuốc.'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#8a8a70', marginBottom: '4px' }}>Lời dặn bác sĩ</div>
                      <div style={{ fontSize: '13px', color: '#2d2d2a', fontStyle: 'italic' }}>
                        "{selectedRecord.medicalRecord.advice || 'Không có lời dặn thêm.'}"
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#8a8a70', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> Ngày hẹn tái khám
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#b84343' }}>
                        {selectedRecord.medicalRecord.re_visit_date || 'Không có hẹn tái khám'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8a8a70' }}>
                  Chưa có chi tiết đơn thuốc cho phiếu khám này.
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fdfbf7', padding: '16px 24px', borderTop: '1px solid #e6e6df', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary-natural" onClick={() => setShowRecordModal(false)}>
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsView;