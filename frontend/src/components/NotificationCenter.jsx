import { useCallback, useEffect, useState } from 'react';
import api from '../api';
export default function NotificationCenter() {
  const [open, setOpen] = useState(false), [state, setState] = useState({ items: [], unread: 0 }), [error, setError] = useState('');
  const load = useCallback(async () => { try { const res = await api.get('/notifications'); setState(res.data); setError(''); } catch { setError('Không tải được thông báo.'); } }, []);
  useEffect(() => { load(); const timer = setInterval(load, 30000); window.addEventListener('focus', load); window.addEventListener('clinic-updated', load); return () => { clearInterval(timer); window.removeEventListener('focus', load); window.removeEventListener('clinic-updated', load); }; }, [load]);
  async function read() { try { await api.put('/notifications/read'); await load(); } catch { setError('Không cập nhật được thông báo.'); } }
  return <section className="clinic-notifications clinic-typography"><button className="btn-secondary-natural" aria-expanded={open} onClick={() => setOpen(value => !value)}>Thông báo {state.unread > 0 && <span>({state.unread})</span>}</button>
    {open && <div className="clinic-notification-list"><h3>Thông báo của bạn</h3><button onClick={read}>Đánh dấu tất cả đã đọc</button>{error && <p role="alert">{error} <button onClick={load}>Thử lại</button></p>}{!state.items.length && <p>Chưa có thông báo.</p>}{state.items.map(item => <article key={item.id} className={!item.readAt ? 'unread' : ''}><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</small></article>)}</div>}
  </section>;
}
