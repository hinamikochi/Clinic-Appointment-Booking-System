import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';
export default function PasswordRecovery({ reset = false }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (reset && password !== confirm) return setError('Hai mật khẩu không trùng nhau.');
    setBusy(true);
    try { const res = await api.post(reset ? '/reset-password' : '/forgot-password', reset ? { token: window.location.hash.slice(1), password } : { email }); setMessage(res.data.message); if (reset) history.replaceState(null, '', window.location.pathname); }
    catch (err) { setError(err.response?.data?.message || 'Không xử lý được yêu cầu. Vui lòng thử lại.'); } finally { setBusy(false); }
  }
  return <main className="clinic-recovery natural-section-card"><h1>{reset ? 'Đặt lại mật khẩu' : 'Khôi phục tài khoản'}</h1><p>Khôi phục qua email cần email thật đã được xác minh. Nếu bạn dùng tài khoản thử nghiệm, hãy liên hệ quản trị viên.</p><form onSubmit={submit}>
    {!reset ? <label>Email tài khoản<input className="clinic-input" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label> : <><label>Mật khẩu mới<input className="clinic-input" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label>Nhập lại mật khẩu<input className="clinic-input" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label></>}
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}<button className="btn-primary-natural" disabled={busy}>{busy ? 'Đang xử lý…' : reset ? 'Lưu mật khẩu mới' : 'Gửi hướng dẫn'}</button>
  </form><p><Link to="/login">Quay lại đăng nhập</Link></p></main>;
}
