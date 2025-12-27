import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status'); // Lấy chữ 'success' hoặc 'fail' từ URL
  const [countdown, setCountdown] = useState(5);

  // Tự động về trang chủ sau 5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate('/'); // Về trang chủ
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      textAlign: 'center',
      backgroundColor: '#f9f9f9'
    }}>
      {status === 'success' ? (
        // --- GIAO DIỆN THÀNH CÔNG ---
        <div style={{ padding: '40px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '60px', color: 'green', marginBottom: '20px' }}>✓</div>
          <h1 style={{ color: '#333' }}>Thanh toán thành công!</h1>
          <p style={{ color: '#666', fontSize: '18px' }}>
            Cảm ơn bạn đã đặt cọc. Mã đặt bàn của bạn đã được gửi qua Email.
          </p>
          <p style={{ marginTop: '20px', color: '#888' }}>
            Tự động về trang chủ sau <span style={{ fontWeight: 'bold', color: 'black' }}>{countdown}</span> giây...
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '30px',
              padding: '12px 30px',
              backgroundColor: 'green',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Về trang chủ ngay
          </button>
        </div>
      ) : (
        // --- GIAO DIỆN THẤT BẠI ---
        <div style={{ padding: '40px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '60px', color: 'red', marginBottom: '20px' }}>✗</div>
          <h1 style={{ color: '#333' }}>Thanh toán thất bại</h1>
          <p style={{ color: '#666', fontSize: '18px' }}>
            Giao dịch bị hủy hoặc có lỗi xảy ra.
          </p>
          <button 
            onClick={() => navigate('/dat-ban')} // Quay lại trang đặt bàn
            style={{
              marginTop: '30px',
              padding: '12px 30px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentResultPage;