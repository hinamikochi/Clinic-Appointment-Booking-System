import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
export default function EmailAccount() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  async function save(event) { event.preventDefault(); setBusy(true); try { const res = await api.post('/account/email', { email, password }); setMessage(res.data.message); setPassword(''); } catch (err) { setMessage(err.response?.data?.message || 'Không cập nhật được email.'); } finally { setBusy(false); } }
  return <section className="natural-section-card clinic-typography clinic-subsection"><h3>Email và khôi phục tài khoản</h3><p>Tài khoản thử nghiệm vẫn dùng được khi email chưa có thật. Chỉ email đã xác minh mới nhận thư nhắc hẹn và khôi phục mật khẩu.</p><form onSubmit={save}><label>Email thật của bạn<input className="clinic-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Mật khẩu hiện tại<input className="clinic-input" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <p role="status">{message}</p>}<button className="btn-primary-natural" disabled={busy}>{busy ? 'Đang cập nhật…' : 'Lưu email / gửi xác minh'}</button></form><p><Link to="/verify-email">Mở trang xác minh email</Link></p></section>;
}
export function VerifyEmail() {
  const [message, setMessage] = useState('Đăng nhập đúng tài khoản rồi bấm xác minh liên kết từ email.');
  async function verify() { try { const res = await api.post('/account/verify-email', { token: location.hash.slice(1) }); setMessage(res.data.message); history.replaceState(null, '', location.pathname); } catch (err) { setMessage(err.response?.data?.message || 'Không xác minh được.'); } }
  return <main className="clinic-recovery natural-section-card"><h1>Xác minh email</h1><p role="status">{message}</p><button className="btn-primary-natural" onClick={verify}>Xác minh email</button><p><Link to="/login">Đăng nhập</Link></p></main>;
}
