import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookingModal from './BookingModal';
import { 
  CalendarCheck, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Clock, 
  Award, 
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

function Home() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(null);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Tải dữ liệu từ db
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSpecs = await axios.get('http://localhost:5001/api/specialties');
        setSpecialties(resSpecs.data);

        const resDocs = await axios.get('http://localhost:5001/api/doctors');
        setDoctors(resDocs.data);
      } catch (err) {
        console.error("Lỗi nạp dữ liệu trang chủ:", err);
      }
    };
    fetchData();
  }, []);

  // Mở Modal chung
  const handleOpenGeneralBooking = () => {
    setSelectedDoctorId(null);
    setSelectedSpecialtyId(null);
    setShowBookingModal(true);
  };

  // Mở Modal đặt lịch đích danh cho 1 Bác sĩ
  const handleBookSpecificDoctor = (doc) => {
    setSelectedDoctorId(doc.id);
    setSelectedSpecialtyId(doc.specialtyId);
    setShowBookingModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* 1. HERO BANNER SECTION */}
      <section style={{ 
        textAlign: 'center', 
        color: '#ffffff', 
        padding: '120px 20px 80px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
          backdropFilter: 'blur(10px)',
          padding: '8px 20px', 
          borderRadius: '99px',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          Hệ Thống Y Tế Chất Lượng Cao 
        </div>

        <h1 style={{ 
          fontSize: '3.6rem', 
          textShadow: '0 4px 12px rgba(0,0,0,0.5)',
          marginBottom: '20px',
          fontWeight: '800',
          fontFamily: 'serif',
          lineHeight: '1.2'
        }}>
          Chăm Sóc Sức Khỏe Toàn Diện <br /> 
          <span style={{ color: '#e2f0d9', fontStyle: 'italic', fontWeight: '400' }}>Đặt Lịch Nhanh Chóng - Không Chờ Đợi</span>
        </h1>

        <p style={{ 
          fontSize: '1.25rem', 
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
          marginBottom: '40px',
          maxWidth: '750px',
          margin: '0 auto 40px auto',
          opacity: 0.95,
          lineHeight: '1.6'
        }}>
          Kết nối trực tiếp với đội ngũ Giáo sư, Bác sĩ hàng đầu. Đăng ký khám chuyên khoa trực tuyến dễ dàng, tiết kiệm thời gian chờ đợi tại phòng khám.
        </p>
        
        <button 
          onClick={handleOpenGeneralBooking}
          className="btn-primary-natural"
          style={{
            padding: '18px 48px',
            fontSize: '1.25rem',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            margin: '0 auto',
            fontWeight: '700'
          }}
        >
          <CalendarCheck size={24} /> Đăng Ký Lịch Khám Ngay
        </button>

        {/* 3 THẺ NỔI BẬT NHANH */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px', 
          marginTop: '60px' 
        }}>
          {/* Thẻ 1: Không Chờ Đợi */}
          <div 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              backdropFilter: 'blur(12px)', 
              padding: '24px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.25)', 
              textAlign: 'left',
              transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), boxShadow 0.3s ease, backgroundColor 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 35px rgba(0,0,0,0.25)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <Clock size={32} color="#ffe082" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>Không Chờ Đợi</h4>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>Đến khám đúng khung giờ đã hẹn, không phải xếp hàng chờ đợi lâu.</p>
          </div>

          {/* Thẻ 2: Bác Sĩ Đầu Ngành */}
          <div 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              backdropFilter: 'blur(12px)', 
              padding: '24px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.25)', 
              textAlign: 'left',
              transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), boxShadow 0.3s ease, backgroundColor 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 35px rgba(0,0,0,0.25)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <Award size={32} color="#ffe082" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>Bác Sĩ Đầu Ngành</h4>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>Đội ngũ Giáo sư, Bác sĩ CKI/CKII giàu kinh nghiệm thăm khám.</p>
          </div>

          {/* Thẻ 3: Bệnh Án Điện Tử */}
          <div 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              backdropFilter: 'blur(12px)', 
              padding: '24px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.25)', 
              textAlign: 'left',
              transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), boxShadow 0.3s ease, backgroundColor 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 35px rgba(0,0,0,0.25)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <ShieldCheck size={32} color="#ffe082" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700' }}>Bệnh Án Điện Tử</h4>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>Tra cứu đơn thuốc và chẩn đoán của bác sĩ trực tuyến 24/7.</p>
          </div>
        </div>
      </section>

      {/* 2. CHUYÊN KHOA NỔI BẬT SECTION */}
      <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)', borderRadius: '32px', padding: '40px', border: '1px solid #e6e6df', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase', letterSpacing: '1px' }}>
                DANH MỤC KHÁM BỆNH
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d2d2a', fontFamily: 'serif', margin: '4px 0 0 0' }}>
                 Các Chuyên Khoa Y Tế
              </h2>
            </div>
            <span style={{ fontSize: '13px', color: '#8a8a70' }}>{specialties.length} Chuyên Khoa Hoạt Động</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {specialties.length > 0 ? (
              specialties.map((spec) => (
                <div 
                  key={spec.id}
                  style={{
                    backgroundColor: '#fdfbf7', padding: '24px', borderRadius: '20px', border: '1px solid #e6e6df',
                    transition: 'transform 0.2s ease, boxShadow 0.2s ease', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onClick={handleOpenGeneralBooking}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#e2f0d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#2e6f40' }}>
                    <Building2 size={24} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#2d2d2a' }}>{spec.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#8a8a70', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {spec.description || 'Chăm sóc và điều trị chuyên sâu kỹ thuật cao.'}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ color: '#8a8a70', gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>Đang nạp danh sách chuyên khoa...</div>
            )}
          </div>
        </div>
      </section>

      {/* 3. ĐỘI NGŨ BÁC SĨ TIÊU BIỂU SECTION */}
      <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)', borderRadius: '32px', padding: '40px', border: '1px solid #e6e6df', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a5a40', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ĐỘI NGŨ CHUYÊN GIA
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d2d2a', fontFamily: 'serif', margin: '4px 0 0 0' }}>
              Bác Sĩ Của Phòng Khám
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {doctors.length > 0 ? (
              doctors.map((doc) => (
                <div 
                  key={doc.id}
                  style={{
                    backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', border: '1px solid #e6e6df',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                      {/* Hiển thị Ảnh đại diện Bác sĩ */}
                      {doc.image ? (
                        <img 
                          src={doc.image} 
                          alt={doc.User?.full_name} 
                          style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '2px solid #e6e6df'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '50%', 
                          backgroundColor: '#5a5a40', 
                          color: '#ffffff',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '24px', 
                          fontWeight: '700'
                        }}>
                          {doc.User?.full_name ? doc.User.full_name.charAt(0).toUpperCase() : 'B'}
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#f0f0e8', color: '#5a5a40', padding: '4px 10px', borderRadius: '99px' }}>
                          {doc.Specialty?.name || 'Chuyên Khoa'}
                        </span>
                        <h3 style={{ margin: '6px 0 2px 0', fontSize: '17px', fontWeight: '700', color: '#2d2d2a' }}>
                          {doc.degree || 'Bác sĩ'} {doc.User?.full_name}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#8a8a70' }}>Bác sĩ chuyên khoa khám bệnh</div>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#5a5a40', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.5' }}>
                      "{doc.description || 'Nhiều năm kinh nghiệm chẩn đoán và điều trị lâm sàng.'}"
                    </p>
                  </div>

                  <button 
                    onClick={() => handleBookSpecificDoctor(doc)}
                    className="btn-primary-natural"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}
                  >
                    <Stethoscope size={16} /> Đặt Lịch Khám Với Bác Sĩ
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: '#8a8a70', gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>Đang nạp danh sách bác sĩ...</div>
            )}
          </div>
        </div>
      </section>

      {/* Hiển thị Modal Đặt Lịch Khám */}
      {showBookingModal && (
        <BookingModal 
          initialDoctorId={selectedDoctorId}
          initialSpecialtyId={selectedSpecialtyId}
          onClose={() => setShowBookingModal(false)} 
        />
      )}
    </div>
  );
}

export default Home;