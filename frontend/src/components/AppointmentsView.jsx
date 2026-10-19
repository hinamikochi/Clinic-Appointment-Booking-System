import RecordAudit from './RecordAudit';
import { formatDate, formatMoney } from '../utils/clinicDate';
import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { CalendarDays, FileText, Pill, Calendar, X, Printer } from 'lucide-react';
import { printPrescription } from '../utils/printHelper';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // State Modal xem Bệnh án dành cho Admin
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      api.get('/appointments', { params: { page: currentPage, limit: itemsPerPage, status: filterStatus, search, date, doctorId, specialtyId } }).then(res => {
        if (!active) return;
        setAppointments(res.data.items);
        setTotalPages(res.data.totalPages);
        if (currentPage > res.data.totalPages) setCurrentPage(res.data.totalPages);
      }).catch(err => {
        if (active) { setError(err.response?.data?.message || 'Không tải được lịch hẹn.'); setAppointments([]); }
      }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [currentPage, filterStatus, search, date, doctorId, specialtyId, refresh]);
  useEffect(() => {
    Promise.all([api.get('/doctors'), api.get('/specialties')]).then(([docs, specs]) => { setDoctors(docs.data); setSpecialties(specs.data); }).catch(() => setError('Không tải được bộ lọc.'));
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success("Cập nhật trạng thái lịch hẹn thành công!");
      setRefresh(n => n + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật trạng thái lịch hẹn');
    }
  };

  const handleOpenRecordModal = (apt) => {
    setSelectedRecord({
      appointment: apt,
      medicalRecord: apt.MedicalRecord
    });
    setShowRecordModal(true);
  };


  const paginated = appointments;
  const changeFilter = setter => event => { setter(event.target.value); setCurrentPage(1); };

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
          onChange={changeFilter(setFilterStatus)}
          style={{ padding: '8px 16px', borderRadius: '99px', border: '1px solid #e6e6df', backgroundColor: '#fdfbf7', fontSize: '13px', outline: 'none' }}
        >
          <option value="all">-- Tất cả trạng thái --</option>
          <option value="pending">Chờ duyệt</option>
          <option value="confirmed">Đã duyệt</option>
          <option value="completed">Đã khám xong</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="clinic-flex-wrap">
        <input className="clinic-input" style={{ maxWidth: 260 }} aria-label="Tìm bệnh nhân" placeholder="Tên hoặc số điện thoại" value={search} onChange={changeFilter(setSearch)} />
        <input className="clinic-input" style={{ maxWidth: 180 }} aria-label="Lọc ngày khám" type="date" value={date} onChange={changeFilter(setDate)} />
        <select aria-label="Lọc chuyên khoa" value={specialtyId} onChange={changeFilter(setSpecialtyId)}><option value="">Tất cả chuyên khoa</option>{specialties.map(spec => <option key={spec.id} value={spec.id}>{spec.name}</option>)}</select>
        <select aria-label="Lọc bác sĩ" value={doctorId} onChange={changeFilter(setDoctorId)}><option value="">Tất cả bác sĩ</option>{doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.User?.full_name}</option>)}</select>
      </div>
      {loading && <p role="status">Đang tải lịch hẹn…</p>}
      {error && <p role="alert" className="clinic-feedback">{error} <button onClick={() => setRefresh(n => n + 1)}>Thử lại</button></p>}
      {/* Bảng Danh Sách Lịch Hẹn Thực */}
      <div className="natural-section-card" style={{ width: '100%' }}>
       <div className="natural-table-container">
        <table className="natural-table">
          <thead>
            <tr>
              <th>Mã Lịch</th>
              <th>Bệnh Nhân</th>
              <th>Số Điện Thoại</th>
              <th>Chuyên Khoa</th>
              <th>Bác Sĩ Khám</th>
              <th>Ngày & Khung Giờ</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && paginated.length > 0 ? (
              paginated.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: '700', color: '#5a5a40' }}>LH-{apt.id}</td>
                  <td style={{ fontWeight: '600' }}>{apt.patient_name}</td>
                  <td>{apt.patient_phone}</td>
                  <td>{apt.Specialty?.name || 'Chuyên Khoa'}</td>
                  <td>{apt.DoctorInfo?.User?.full_name || 'Bác Sĩ'}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{formatDate(apt.appointment_date)}</div>
                    <div style={{ fontSize: '12px', color: '#8a8a70' }}>{apt.time_slot}</div><small>Phí khám: {formatMoney(apt.consultationFee)}</small>
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

                    {/* 2. XOÁ LỊCH HẸN KHI Ở TRẠNG THÁI ĐÃ DUYỆT:*/}
                      {apt.status === 'confirmed' && (
                        <button 
                          onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                          style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #b84343', backgroundColor: '#fdf2f2', color: '#b84343', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Hủy Lịch Hẹn
                        </button>
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

       {/* Thanh Phân Trang */}
       {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px', paddingBottom: '8px' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px', borderRadius: '50%',
              border: '1px solid #e6e6df', 
              backgroundColor: currentPage === 1 ? '#f5f5f0' : '#ffffff', 
              color: currentPage === 1 ? '#cccccc' : '#5a5a40', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                minWidth: '34px', height: '34px', padding: '0 8px', borderRadius: '99px',
                border: page === currentPage ? '1px solid #5a5a40' : '1px solid #e6e6df',
                backgroundColor: page === currentPage ? '#5a5a40' : '#ffffff',
                color: page === currentPage ? '#ffffff' : '#2d2d2a',
                fontWeight: page === currentPage ? '700' : '500',
                fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: page === currentPage ? '0 3px 8px rgba(90, 90, 64, 0.2)' : 'none'
              }}
            >
              {page}
            </button>
          ))}

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px', borderRadius: '50%',
              border: '1px solid #e6e6df', 
              backgroundColor: currentPage === totalPages ? '#f5f5f0' : '#ffffff', 
              color: currentPage === totalPages ? '#cccccc' : '#5a5a40', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ›
          </button>
        </div>
       )}
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
              {selectedRecord.medicalRecord && <RecordAudit recordId={selectedRecord.medicalRecord.id} />}
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
                        <Calendar size={13} /> Ngày đề nghị tái khám (chưa đặt lịch)
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

            <div style={{ backgroundColor: '#fdfbf7', padding: '16px 24px', borderTop: '1px solid #e6e6df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => printPrescription(selectedRecord.appointment, selectedRecord.medicalRecord)}
                className="btn-primary-natural"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                  <Printer size={16} />  In Kết Quả Khám
              </button>

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