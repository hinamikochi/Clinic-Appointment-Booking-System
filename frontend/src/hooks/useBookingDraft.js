export function readBookingDraft(key) {
  try { const saved = JSON.parse(sessionStorage.getItem(key)); if (saved && saved.expiresAt > Date.now()) return saved.data; sessionStorage.removeItem(key); } catch { /* Ignore unavailable storage. */ }
  return {};
}
export function saveBookingDraft(key, data) { try { sessionStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + 30 * 60000 })); } catch { /* Booking works without storage. */ } }
export function clearBookingDraft(key) { sessionStorage.removeItem(key); }
