const TIME_SLOTS = ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00', '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30'];
const DEFAULT_SCHEDULE = { weekdays: [1, 2, 3, 4, 5, 6], timeSlots: TIME_SLOTS, daysOff: [] };
function clinicDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const get = type => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}
function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function futureSlot(date, slot, now = new Date()) {
    return validDate(date) && validTimeSlot(slot) && new Date(`${date}T${slot.slice(0, 5)}:00+07:00`) > now;
}
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function text(value, label, max = 255, required = false) {
    if (value === undefined || value === null) { if (required) fail(`Vui lòng nhập ${label}.`); return ''; }
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${label} không hợp lệ.`);
    return value.trim();
}
function credentials(body, registration = false) {
    const email = text(body.email, 'Email', 254, true).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Email không hợp lệ.');
    if (typeof body.password !== 'string' || Buffer.byteLength(body.password) > 72 || body.password.length < (registration ? 8 : 1)) fail('Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte.');
    return { email, password: body.password, ...(registration ? { full_name: text(body.full_name, 'Họ tên', 150, true) } : {}) };
}
function schedule(value) {
    if (!value || !Array.isArray(value.weekdays) || !value.weekdays.length || value.weekdays.some(d => !Number.isInteger(d) || d < 0 || d > 6)
        || !Array.isArray(value.timeSlots) || !value.timeSlots.length || value.timeSlots.some(s => !validTimeSlot(s))
        || !Array.isArray(value.daysOff) || value.daysOff.some(d => !validDate(d))) fail('Lịch làm việc không hợp lệ.');
    const dates = value.dateOverrides || {};
    if (typeof dates !== 'object' || Array.isArray(dates) || Object.entries(dates).some(([day, slots]) => !validDate(day) || !Array.isArray(slots) || slots.some(s => !validTimeSlot(s)))) fail('Lịch riêng theo ngày không hợp lệ.');
    for (const slots of [value.timeSlots, ...Object.values(dates)]) if (slots.some((slot, i) => slots.slice(i + 1).some(other => overlaps(slot, other)))) fail('Các khung giờ làm việc không được chồng lấn.');
    return { weekdays: [...new Set(value.weekdays)], timeSlots: [...new Set(value.timeSlots)].sort(), daysOff: [...new Set(value.daysOff)], dateOverrides: dates };
}
function validTimeSlot(slot) {
    if (typeof slot !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d - ([01]\d|2[0-3]):[0-5]\d$/.test(slot)) return false;
    const [start, end] = slot.split(' - ').map(time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)));
    return end > start && end - start <= 180;
}
function overlaps(a, b) { if (!validTimeSlot(a) || !validTimeSlot(b)) return a === b; return a.slice(0, 5) < b.slice(8) && b.slice(0, 5) < a.slice(8); }
function slotsOn(doctor, date) { const work = doctor.workSchedule || DEFAULT_SCHEDULE; return work.daysOff.includes(date) ? [] : work.dateOverrides?.[date] || (work.weekdays.includes(new Date(date + 'T00:00:00Z').getUTCDay()) ? work.timeSlots : []); }
function worksOn(doctor, date, slot) { return slotsOn(doctor, date).includes(slot); }
function booking(body) {
    const patient_name = text(body.patient_name, 'Họ tên', 150, true);
    const patient_phone = text(body.patient_phone, 'Số điện thoại', 20, true);
    if (!/^\+?[0-9]{9,15}$/.test(patient_phone)) fail('Số điện thoại phải có 9–15 chữ số.');
    const patient_age = Number(body.patient_age ?? 30);
    if (!Number.isInteger(patient_age) || patient_age < 0 || patient_age > 130) fail('Tuổi phải từ 0 đến 130.');
    if (!['Nam', 'Nữ', 'Khác'].includes(body.patient_gender || 'Nam')) fail('Giới tính không hợp lệ.');
    if (![body.doctorId, body.specialtyId].every(id => Number.isSafeInteger(Number(id)) && Number(id) > 0)) fail('Bác sĩ hoặc chuyên khoa không hợp lệ.');
    if (!futureSlot(body.appointment_date, body.time_slot)) fail('Vui lòng chọn ngày và khung giờ trong tương lai.');
    return { patient_name, patient_phone, patient_age, patient_gender: body.patient_gender || 'Nam', doctorId: Number(body.doctorId), specialtyId: Number(body.specialtyId), appointment_date: body.appointment_date, time_slot: body.time_slot, symptoms: text(body.symptoms, 'Triệu chứng', 5000) };
}
module.exports = { validTimeSlot, overlaps, slotsOn, TIME_SLOTS, DEFAULT_SCHEDULE, clinicDate, validDate, futureSlot, fail, text, credentials, schedule, worksOn, booking };
