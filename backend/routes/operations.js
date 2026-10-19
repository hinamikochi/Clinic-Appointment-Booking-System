const router = require('express').Router();
const { Op } = require('sequelize');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const User = require('../models/User');
const Doctor = require('../models/DoctorInfo');
const Appointment = require('../models/Appointment');
const Record = require('../models/MedicalRecord');
const Specialty = require('../models/Specialty');
const { Notification, AppointmentEvent, PatientProfile, RecordDraft, PasswordReset, EmailDelivery } = require('../models/Operations');
const { authMiddleware: auth, checkRole: roles } = require('../middlewares/auth');
const limit = require('../middlewares/rateLimit');
const { allowedDoctor } = require('../services/appointments');
const { appointmentChanged } = require('../services/notifications');
const v = require('../validators/clinic');
const handler = action => async (req, res, next) => { try { await action(req, res); } catch (error) { next(error); } };
async function accessible(id, actor) {
    const apt = await Appointment.findByPk(id);
    if (!apt) v.fail('Không tìm thấy lịch hẹn.', 404);
    if (actor.role === 'patient') { if (apt.userId !== actor.id) v.fail('Không có quyền truy cập lịch hẹn.', 403); }
    else await allowedDoctor(actor, apt.doctorId);
    return apt;
}
router.get('/api/clinic', (req, res) => res.json({ name: process.env.CLINIC_NAME || 'MyClinic', address: process.env.CLINIC_ADDRESS || '', phone: process.env.CLINIC_PHONE || '', instructions: process.env.CLINIC_INSTRUCTIONS || 'Mang giấy tờ tùy thân và các kết quả khám liên quan. Đến trước giờ hẹn để làm thủ tục tiếp nhận.', passwordRecoveryAvailable: !!(process.env.SMTP_HOST && (process.env.SMTP_FROM || process.env.SMTP_USER)) }));

router.post('/api/forgot-password', limit(5), handler(async (req, res) => {
    const email = v.text(req.body.email, 'Email', 254, true).toLowerCase();
    if (!process.env.SMTP_HOST || !(process.env.SMTP_FROM || process.env.SMTP_USER)) v.fail('Khôi phục mật khẩu qua email chưa được cấu hình. Vui lòng liên hệ phòng khám.', 503);
    const user = await User.findOne({ where: { email, isActive: true, emailVerified: true } });
    if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        await db.transaction(async transaction => {
            await User.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE });
            await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null, purpose: 'password' }, transaction });
            await PasswordReset.create({ userId: user.id, tokenHash: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 30 * 60000) }, { transaction });
            const origin = process.env.PUBLIC_APP_URL || 'http://localhost:8080';
            await EmailDelivery.create({ recipient: email, subject: 'Đặt lại mật khẩu MyClinic', body: `Mở liên kết sau trong 30 phút để đặt lại mật khẩu: ${origin}/reset-password#${token}\nNếu không yêu cầu, bạn có thể bỏ qua email này.`, nextAttemptAt: new Date() }, { transaction });
        });
    }
    res.json({ message: 'Nếu email thuộc tài khoản đang hoạt động, hướng dẫn sẽ được gửi tới email đó.' });
}));
router.post('/api/reset-password', limit(10), handler(async (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.body.token || '')) v.fail('Liên kết không hợp lệ hoặc đã hết hạn.');
    const password = req.body.password;
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) v.fail('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.');
    const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const snapshot = await PasswordReset.findOne({ where: { tokenHash: hash, purpose: 'password' } });
    if (!snapshot) v.fail('Liên kết không hợp lệ hoặc đã hết hạn.');
    const encrypted = await bcrypt.hash(password, 10);
    await db.transaction(async transaction => {
        const user = await User.findByPk(snapshot.userId, { transaction, lock: transaction.LOCK.UPDATE });
        const reset = await PasswordReset.findByPk(snapshot.id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!user || !user.isActive || !reset || reset.usedAt || reset.expiresAt <= new Date()) v.fail('Liên kết không hợp lệ hoặc đã hết hạn.');
        await user.update({ password: encrypted, tokenVersion: user.tokenVersion + 1 }, { transaction });
        await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null }, transaction });
    });
    res.json({ message: 'Đã đặt lại mật khẩu. Vui lòng đăng nhập lại.' });
}));

router.get('/api/notifications', auth, handler(async (req, res) => {
    const items = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 50 });
    res.json({ items, unread: await Notification.count({ where: { userId: req.user.id, readAt: null } }) });
}));
router.put('/api/notifications/read', auth, handler(async (req, res) => { await Notification.update({ readAt: new Date() }, { where: { userId: req.user.id, readAt: null } }); res.json({ message: 'Đã đánh dấu đã đọc.' }); }));
router.get('/api/appointments/:id/events', auth, handler(async (req, res) => { await accessible(req.params.id, req.user); res.json(await AppointmentEvent.findAll({ where: { appointmentId: req.params.id }, order: [['createdAt', 'DESC'], ['id', 'DESC']] })); }));
router.get('/api/appointments/:id/receipt', auth, handler(async (req, res) => {
    await accessible(req.params.id, req.user);
    const apt = await Appointment.findByPk(req.params.id, { include: [Specialty, { model: Doctor, include: [{ model: User, attributes: ['full_name'] }] }] });
    res.json(apt);
}));
router.put('/api/appointments/:id/reschedule', auth, roles(['patient', 'admin']), handler(async (req, res) => res.json({ message: 'Đã đổi lịch; đang chờ xác nhận lại.', data: await require('../services/reschedule').reschedule(req.params.id, req.body, req.user) })));
router.put('/api/appointments/:id/meeting', auth, roles(['admin', 'doctor']), handler(async (req, res) => {
    const apt = await accessible(req.params.id, req.user);
    const url = v.text(req.body.url, 'Liên kết khám trực tuyến', 1000);
    if (url && !/^https:\/\//.test(url)) v.fail('Liên kết phải sử dụng HTTPS.');
    if (!['pending', 'confirmed'].includes(apt.status)) v.fail('Chỉ cấu hình cuộc hẹn chưa khám.');
    await apt.update({ meetingUrl: url || null });
    res.json({ message: 'Đã cập nhật liên kết khám trực tuyến.' });
}));

router.get('/api/patient-profiles', auth, roles(['patient']), handler(async (req, res) => res.json(await PatientProfile.findAll({ where: { ownerId: req.user.id }, order: [['id', 'ASC']] }))));
function profileData(body) {
    if (!v.validDate(body.birthDate) || body.birthDate > v.clinicDate() || Number(body.birthDate.slice(0, 4)) < new Date().getUTCFullYear() - 130) v.fail('Ngày sinh không hợp lệ.');
    if (!['Nam', 'Nữ', 'Khác'].includes(body.gender)) v.fail('Vui lòng chọn giới tính.');
    return { fullName: v.text(body.fullName, 'Họ tên', 150, true), birthDate: body.birthDate, gender: body.gender, phone: v.text(body.phone, 'Số điện thoại', 20), allergies: v.text(body.allergies, 'Dị ứng', 5000), medicalHistory: v.text(body.medicalHistory, 'Tiền sử bệnh', 5000) };
}
router.post('/api/patient-profiles', auth, roles(['patient']), handler(async (req, res) => res.status(201).json(await PatientProfile.create({ ...profileData(req.body), ownerId: req.user.id }))));
router.put('/api/patient-profiles/:id', auth, roles(['patient']), handler(async (req, res) => {
    const profile = await PatientProfile.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!profile) v.fail('Không tìm thấy hồ sơ.', 404);
    await profile.update(profileData(req.body)); res.json(profile);
}));
router.get('/api/appointments/:id/context', auth, roles(['doctor', 'admin']), handler(async (req, res) => {
    const apt = await accessible(req.params.id, req.user);
    const profile = apt.patientProfileId ? await PatientProfile.findByPk(apt.patientProfileId) : null;
    const history = profile ? await Record.findAll({ where: { patientProfileId: profile.id, ...(req.user.role === 'doctor' ? { doctorId: apt.doctorId } : {}) }, order: [['createdAt', 'DESC']], limit: 20 }) : [];
    res.json({ profile, history, symptoms: apt.symptoms });
}));

router.get('/api/appointments/:id/draft', auth, roles(['doctor', 'admin']), handler(async (req, res) => { await accessible(req.params.id, req.user); res.json(await RecordDraft.findOne({ where: { appointmentId: req.params.id, authorId: req.user.id } })); }));
router.put('/api/appointments/:id/draft', auth, roles(['doctor', 'admin']), handler(async (req, res) => {
    const apt = await accessible(req.params.id, req.user);
    if (!['confirmed', 'arrived', 'in_progress', 'completed'].includes(apt.status)) v.fail('Không thể lưu nháp ca khám này.');
    const data = req.body.data;
    if (!data || typeof data !== 'object' || JSON.stringify(data).length > 50000) v.fail('Bản nháp không hợp lệ.');
    const draft = await db.transaction(async transaction => {
        await Appointment.findByPk(apt.id, { transaction, lock: transaction.LOCK.UPDATE });
        let row = await RecordDraft.findOne({ where: { appointmentId: apt.id, authorId: req.user.id }, transaction });
        if (row) { if (Number(req.body.version) !== row.version) v.fail('Bản nháp đã thay đổi ở cửa sổ khác.', 409); await row.update({ data, version: row.version + 1 }, { transaction }); }
        else row = await RecordDraft.create({ appointmentId: apt.id, doctorId: apt.doctorId, authorId: req.user.id, data }, { transaction });
        return row;
    }); res.json(draft);
}));

router.get('/api/admin/accounts', auth, roles(['admin']), handler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1), search = v.text(req.query.search, 'Từ khóa', 150);
    const where = search ? { [Op.or]: [{ full_name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] } : {};
    const result = await User.findAndCountAll({ where, attributes: ['id', 'full_name', 'email', 'role', 'isActive'], limit: 20, offset: (page - 1) * 20, order: [['id', 'ASC']], include: [{ model: Doctor, attributes: ['id', 'specialtyId', 'acceptingBookings'] }] });
    res.json({ items: result.rows, totalPages: Math.max(1, Math.ceil(result.count / 20)) });
}));
router.put('/api/admin/accounts/:id/active', auth, roles(['admin']), handler(async (req, res) => {
    if (typeof req.body.isActive !== 'boolean') v.fail('Trạng thái không hợp lệ.');
    if (Number(req.params.id) === req.user.id) v.fail('Không thể tự khóa tài khoản đang sử dụng.');
    await db.transaction(async transaction => {
        const user = await User.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!user) v.fail('Không tìm thấy tài khoản.', 404);
        if (user.role === 'admin') v.fail('Không khóa quản trị viên bằng chức năng này.');
        const doctor = await Doctor.findOne({ where: { userId: user.id }, transaction, lock: transaction.LOCK.UPDATE });
        if (!req.body.isActive && doctor && await Appointment.count({ where: { doctorId: doctor.id, status: { [Op.in]: ['pending', 'confirmed', 'arrived', 'in_progress'] } }, transaction })) v.fail('Cần xử lý các lịch hẹn của bác sĩ trước khi khóa tài khoản.', 409);
        await user.update({ isActive: req.body.isActive, tokenVersion: user.tokenVersion + 1 }, { transaction });
    }); res.json({ message: 'Đã cập nhật trạng thái tài khoản.' });
}));
router.put('/api/admin/doctors/:id/availability', auth, roles(['admin']), handler(async (req, res) => {
    if (typeof req.body.acceptingBookings !== 'boolean') v.fail('Trạng thái không hợp lệ.');
    const reason = v.text(req.body.reason, 'Lý do', 1000, true);
    await db.transaction(async transaction => {
        const doctor = await Doctor.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!doctor) v.fail('Không tìm thấy bác sĩ.', 404);
        if (req.body.acceptingBookings && (!doctor.specialtyId || doctor.consultationFee == null)) v.fail('Hãy hoàn thiện chuyên khoa và phí khám trước khi nhận lịch.');
        const apts = await Appointment.findAll({ where: { doctorId: doctor.id, status: { [Op.in]: ['pending', 'confirmed', 'arrived', 'in_progress'] } }, transaction, lock: transaction.LOCK.UPDATE });
        if (!req.body.acceptingBookings && req.body.cancelAppointments) {
            if (apts.some(a => ['arrived', 'in_progress'].includes(a.status))) v.fail('Có bệnh nhân đã tiếp nhận/đang khám; hãy xử lý riêng trước.', 409);
            for (const apt of apts) {
                await apt.update({ status: 'cancelled', activeSlot: null, cancellationReason: reason, version: apt.version + 1 }, { transaction });
                await AppointmentEvent.create({ appointmentId: apt.id, actorId: req.user.id, kind: 'doctor_unavailable', reason }, { transaction });
                await appointmentChanged(apt, 'Phòng khám thay đổi lịch', `Phiếu LH-${apt.id} đã hủy do bác sĩ ngừng nhận lịch. Lý do: ${reason}. Vui lòng liên hệ phòng khám hoặc đặt lịch mới.`, `unavailable:${apt.id}:${apt.version}`, transaction);
            }
        }
        await doctor.update({ acceptingBookings: req.body.acceptingBookings }, { transaction });
    }); res.json({ message: 'Đã cập nhật trạng thái nhận lịch.' });
}));
router.get('/api/admin/reports', auth, roles(['admin']), handler(async (req, res) => {
    const { from, to } = req.query;
    if (!v.validDate(from) || !v.validDate(to) || from > to) v.fail('Khoảng ngày không hợp lệ.');
    const rows = await Appointment.findAll({ where: { appointment_date: { [Op.between]: [from, to] } }, attributes: ['appointment_date', 'status', 'doctorId', 'specialtyId'], raw: true });
    const counts = {}, days = {};
    for (const row of rows) { counts[row.status] = (counts[row.status] || 0) + 1; days[row.appointment_date] = (days[row.appointment_date] || 0) + 1; }
    res.json({ from, to, total: rows.length, counts, days, completedRate: rows.length ? Math.round((counts.completed || 0) * 100 / rows.length) : 0 });
}));
router.get('/api/admin/delivery-status', auth, roles(['admin']), handler(async (req, res) => res.json({ emailConfigured: !!process.env.SMTP_HOST, failed: await EmailDelivery.count({ where: { status: 'failed' } }), queued: await EmailDelivery.count({ where: { status: { [Op.in]: ['pending', 'retry'] } } }) })));
module.exports = router;
