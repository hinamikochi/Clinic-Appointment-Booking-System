export function clinicToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export const formatMoney = value => value == null ? 'Chưa ghi nhận' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export const formatDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : value || '';
