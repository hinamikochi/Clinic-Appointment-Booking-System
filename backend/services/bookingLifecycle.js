const { Op } = require('sequelize');
const { createHash, createHmac } = require('node:crypto');
const db = require('../db');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/DoctorInfo');
const User = require('../models/User');
const { PatientProfile, AppointmentEvent } = require('../models/Operations');
const { appointmentChanged, notify } = require('./notifications');
const { jwtSecret } = require('../config/security');
const v = require('../validators/clinic');

async function createBooking(body, user) {
    let data = v.booking(body);
    let profile = null;
    if (body.patientProfileId) {
        if (user?.role !== 'patient') v.fail('Vui lòng đăng nhập tài khoản bệnh nhân.', 403);
        profile = await PatientProfile.findOne({ where: { id: body.patientProfileId, ownerId: user.id } });
        if (!profile) v.fail('Không tìm thấy hồ sơ người được khám.', 404);
        const today = v.clinicDate();
        const age = Number(today.slice(0, 4)) - Number(profile.birthDate.slice(0, 4)) - (today.slice(5) < profile.birthDate.slice(5) ? 1 : 0);
        data = { ...data, patient_name: profile.fullName, patient_gender: profile.gender, patient_age: age, patientProfileId: profile.id };
    }
    const userId = user?.role === 'patient' ? user.id : null;
    if (body.requestKey && !/^[a-f0-9-]{32,64}$/i.test(body.requestKey)) v.fail('Mã yêu cầu không hợp lệ.');
    const requestKey = body.requestKey ? createHash('sha256').update(`${userId || 'guest'}:${body.requestKey}`).digest('hex') : null;
    const fingerprint = createHash('sha256').update(JSON.stringify({ ...data, userId })).digest('hex');
    const bookingCode = userId ? null : requestKey ? createHmac('sha256', jwtSecret).update(requestKey).digest('hex').slice(0, 32) : require('node:crypto').randomBytes(16).toString('hex');
    function response(apt) {
        const result = apt.toJSON ? apt.toJSON() : { ...apt };
        delete result.claimCodeHash; delete result.bookingFingerprint;
        return { ...result, bookingCode };
    }
    async function replay(transaction) {
        if (!requestKey) return null;
        const existing = await Appointment.unscoped().findOne({ where: { bookingRequestKey: requestKey }, transaction });
        if (!existing) return null;
        if (existing.bookingFingerprint !== fingerprint) v.fail('Mã yêu cầu đã được dùng cho thông tin khác. Vui lòng gửi yêu cầu mới.', 409);
        return response(existing);
    }
    const previous = await replay();
    if (previous) return previous;
    try {
        return await db.transaction(async transaction => {
            const doctor = await Doctor.findByPk(data.doctorId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!doctor || doctor.specialtyId !== data.specialtyId || doctor.acceptingBookings === false) v.fail('Bác sĩ không nhận lịch cho chuyên khoa đã chọn.');
            const account = await User.findByPk(doctor.userId, { transaction });
            if (!account || account.isActive === false || account.role !== 'doctor') v.fail('Tài khoản bác sĩ không còn hoạt động.');
            if (!v.futureSlot(data.appointment_date, data.time_slot) || !v.worksOn(doctor, data.appointment_date, data.time_slot)) v.fail('Bác sĩ không làm việc trong khung giờ này.');
            const again = await replay(transaction);
            if (again) return again;
            const occupied = await Appointment.findAll({ where: { doctorId: data.doctorId, appointment_date: data.appointment_date, status: { [Op.notIn]: ['cancelled', 'no_show'] } }, transaction, lock: transaction.LOCK.UPDATE });
            if (occupied.some(apt => v.overlaps(apt.time_slot, data.time_slot))) v.fail('Khung giờ đã được đặt. Vui lòng chọn khung giờ khác.', 409);
            const apt = await Appointment.create({ ...data, userId, bookingRequestKey: requestKey, bookingFingerprint: fingerprint, claimCodeHash: bookingCode ? createHash('sha256').update(bookingCode).digest('hex') : null, consultationFee: doctor.consultationFee || 0, status: 'pending', activeSlot: `${data.doctorId}|${data.appointment_date}|${data.time_slot}` }, { transaction });
            await AppointmentEvent.create({ appointmentId: apt.id, actorId: user?.id || null, kind: 'created', details: { status: 'pending' } }, { transaction });
            await appointmentChanged(apt, 'Đã nhận yêu cầu đặt khám', `Phiếu LH-${apt.id}: ${apt.appointment_date}, ${apt.time_slot}. Yêu cầu đang chờ phòng khám xác nhận.`, `created:${apt.id}`, transaction);
            // Staff is informed even when a guest has no account.
            const admins = await User.findAll({ where: { role: 'admin', isActive: true }, attributes: ['id'], transaction });
            for (const admin of admins) await notify(admin.id, 'Yêu cầu đặt khám mới', `Phiếu LH-${apt.id} đang chờ xác nhận.`, apt.id, `staff-created:${apt.id}`, transaction);
            return response(apt);
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && requestKey) { const result = await replay(); if (result) return result; }
        throw error;
    }
}
async function changeStatus(id, status, user, patientCancel = false, reason = '') {
    return db.transaction(async transaction => {
        const apt = await Appointment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!apt) v.fail('Không tìm thấy lịch hẹn.', 404);
        if (patientCancel && user.role === 'patient') {
            if (apt.userId !== user.id) v.fail('Bạn không có quyền hủy lịch này.', 403);
            if (!v.futureSlot(apt.appointment_date, apt.time_slot)) v.fail('Chỉ được hủy trước giờ khám.');
        } else await require('./appointments').allowedDoctor(user, apt.doctorId, transaction);
        const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['arrived', 'cancelled', 'no_show'], arrived: ['in_progress', 'cancelled'], in_progress: [], completed: [], cancelled: [], no_show: [] };
        if (!transitions[apt.status]?.includes(status)) v.fail('Không thể chuyển trạng thái lịch hẹn. Hoàn thành ca khám bằng cách lưu bệnh án.');
        if (status === 'cancelled' || status === 'no_show') reason = v.text(reason, 'Lý do', 1000, true);
        if (status === 'arrived' && apt.appointment_date !== v.clinicDate()) v.fail('Chỉ tiếp nhận trong ngày hẹn.');
        if (status === 'no_show' && new Date(`${apt.appointment_date}T${apt.time_slot.slice(-5)}:00+07:00`) > new Date()) v.fail('Chỉ đánh dấu vắng mặt sau khung giờ hẹn.');
        if (status === 'in_progress' && v.futureSlot(apt.appointment_date, apt.time_slot)) v.fail('Chưa đến giờ khám.');
        const before = apt.status;
        await apt.update({ status, version: (apt.version || 1) + 1, ...(status === 'cancelled' ? { activeSlot: null, cancellationReason: reason } : {}), ...(status === 'no_show' ? { activeSlot: null } : {}) }, { transaction });
        await AppointmentEvent.create({ appointmentId: apt.id, actorId: user.id, kind: 'status', reason, details: { before, after: status } }, { transaction });
        const label = { confirmed: 'Đã xác nhận lịch khám', cancelled: 'Lịch khám đã hủy', arrived: 'Đã tiếp nhận', in_progress: 'Bắt đầu khám', no_show: 'Ghi nhận vắng mặt' }[status];
        await appointmentChanged(apt, label, `Phiếu LH-${apt.id}: ${label}. ${reason ? `Lý do: ${reason}` : ''}`, `status:${apt.id}:${apt.version}`, transaction);
        return apt;
    });
}
module.exports = { createBooking, changeStatus };
