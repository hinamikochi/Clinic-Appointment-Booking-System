import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      textAlign: 'center', 
      color: 'white', 
      marginTop: '120px',
      padding: '0 20px'
    }}>
      <h1 style={{ 
        fontSize: '3.5rem', 
        textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
        marginBottom: '40px' 
      }}>
        Hệ Thống Đặt Lịch MyClinic
      </h1>
      <p style={{ 
        fontSize: '1.5rem', 
        textShadow: '1px 1px 4px rgba(0,0,0,0.7)',
        marginBottom: '30px'
      }}>
        Chăm sóc sức khỏe toàn diện - Đặt lịch nhanh chóng, không chờ đợi.
      </p>
      
      {/* Nút bấm ở giữa trang chủ */}
      <button 
        onClick={() => navigate('/register')}
        style={{
          padding: '15px 40px',
          fontSize: '1.2rem',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          fontWeight: 'bold'
        }}
      >
        Đăng ký lịch khám ngay
      </button>
    </div>
  );
}

export default Home;