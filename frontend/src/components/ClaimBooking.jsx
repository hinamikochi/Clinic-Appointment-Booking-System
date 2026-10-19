import { useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
export default function ClaimBooking({ onSuccess }) {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  async function claim(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/patient/claim-booking', { code: code.trim(), phone: phone.trim() });
      toast.success('Đã thêm lịch hẹn vào tài khoản.');
      setCode('');
      onSuccess?.();
    } catch (error) { toast.error(error.response?.data?.message || 'Không nhận được lịch hẹn.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={claim} className="natural-section-card">
    <h3>Thêm lịch đã đặt khi chưa đăng nhập</h3>
    <label>Mã nhận lịch<input className="clinic-input" required value={code} onChange={e => setCode(e.target.value)} /></label>
    <label>Số điện thoại đã đặt<input className="clinic-input" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
    <button className="btn-primary-natural" disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Thêm vào lịch của tôi'}</button>
  </form>;
}
