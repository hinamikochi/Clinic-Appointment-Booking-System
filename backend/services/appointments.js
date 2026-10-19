const { Op } = require('sequelize');
const { randomBytes, createHash } = require('node:crypto');
const sequelize = require('../db');
const Appointment = require('../models/Appointment');
const DoctorInfo = require('../models/DoctorInfo');
const MedicalRecord = require('../models/MedicalRecord');
const MedicalRecordAudit = require('../models/MedicalRecordAudit');
const v = require('../validators/clinic');

async function allowedDoctor(user, doctorId, transaction) {
    if (user.role === 'admin') return;
    const doctor = await DoctorInfo.findByPk(doctorId, { transaction });
    if (user.role !== 'doctor' || !doctor || doctor.userId !== user.id) v.fail('Bạn không được xử lý ca khám này.', 403);
}
async function createBooking(body, user) {
    const data = v.booking(body);
    return sequelize.transaction(async transaction => {
        // Serialize all bookings for one doctor, including different Node processes.
        const doctor = await DoctorInfo.findByPk(data.doctorId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!doctor || doctor.specialtyId !== data.specialtyId) v.fail('Bác sĩ không thuộc chuyên khoa đã chọn.');
        if (!v.worksOn(doctor, data.appointment_date, data.time_slot)) v.fail('Bác sĩ không làm việc trong khung giờ này.');
        const existing = await Appointment.findOne({ where: { doctorId: data.doctorId, appointment_date: data.appointment_date, time_slot: data.time_slot, status: { [Op.ne]: 'cancelled' } }, transaction, lock: transaction.LOCK.UPDATE });
        if (existing) v.fail('Khung giờ đã được đặt. Vui lòng chọn khung giờ khác.', 409);
        const bookingCode = user?.role === 'patient' ? null : randomBytes(16).toString('hex');
        const appointment = await Appointment.create({ ...data, userId: user?.role === 'patient' ? user.id : null, status: 'pending', consultationFee: doctor.consultationFee || 0,
            claimCodeHash: bookingCode ? createHash('sha256').update(bookingCode).digest('hex') : null,
            activeSlot: `${data.doctorId}|${data.appointment_date}|${data.time_slot}` }, { transaction });
        const result = appointment.toJSON ? appointment.toJSON() : { ...appointment };
        delete result.claimCodeHash;
        return { ...result, bookingCode };
    });
}
async function changeStatus(id, status, user, patientCancel = false) {
    return sequelize.transaction(async transaction => {
        const apt = await Appointment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!apt) v.fail('Không tìm thấy lịch hẹn.', 404);
        if (patientCancel && user.role === 'patient') {
            if (apt.userId !== user.id) v.fail('Bạn không có quyền hủy lịch này.', 403);
            if (!v.futureSlot(apt.appointment_date, apt.time_slot)) v.fail('Chỉ được hủy trước giờ khám.');
        } else await allowedDoctor(user, apt.doctorId, transaction);
        const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['cancelled'], completed: [], cancelled: [] };
        if (!transitions[apt.status]?.includes(status)) v.fail('Không thể chuyển trạng thái lịch hẹn. Hoàn thành ca khám bằng cách lưu bệnh án.');
        await apt.update({ status, ...(status === 'cancelled' ? { activeSlot: null } : {}) }, { transaction });
        return apt;
    });
}
async function saveRecord(body, user) {
    const diagnosis = v.text(body.diagnosis, 'Chẩn đoán', 10000, true);
    const advice = v.text(body.advice, 'Lời dặn', 10000);
    const prescription = v.text(body.prescription, 'Đơn thuốc', 10000);
    const items = body.prescriptionItems ?? [];
    if (!Array.isArray(items) || items.length > 100) v.fail('Danh sách thuốc không hợp lệ.');
    const prescriptionItems = items.map(item => ({ name: v.text(item.name, 'Tên thuốc', 200, true), dosage: v.text(item.dosage, 'Liều lượng', 200, true), frequency: v.text(item.frequency, 'Số lần dùng', 200, true), duration: v.text(item.duration, 'Thời gian dùng', 200, true), instructions: v.text(item.instructions, 'Hướng dẫn', 500) }));
    return sequelize.transaction(async transaction => {
        const apt = await Appointment.findByPk(body.appointmentId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!apt) v.fail('Không tìm thấy lịch hẹn.', 404);
        await allowedDoctor(user, apt.doctorId, transaction);
        if (!['confirmed', 'completed'].includes(apt.status)) v.fail('Chỉ khám lịch đã xác nhận.');
        if (new Date(`${apt.appointment_date}T${apt.time_slot.slice(0, 5)}:00+07:00`) > new Date()) v.fail('Chưa đến giờ khám.');
        const re_visit_date = body.re_visit_date || null;
        let record = await MedicalRecord.findOne({ where: { appointmentId: apt.id }, transaction });
        if (re_visit_date && (!v.validDate(re_visit_date) || (re_visit_date !== record?.re_visit_date && re_visit_date <= v.clinicDate()))) v.fail('Ngày đề nghị tái khám mới phải sau hôm nay.');
        const before = record ? record.toJSON() : null;
        const data = { appointmentId: apt.id, patientId: apt.userId, doctorId: apt.doctorId, diagnosis, prescription: prescriptionItems.length ? prescriptionItems.map(i => `${i.name}: ${i.dosage}; ${i.frequency}; ${i.duration}${i.instructions ? `; ${i.instructions}` : ''}`).join('\n') : prescription, prescriptionItems, advice, re_visit_date, updatedBy: user.id };
        if (record) await record.update(data, { transaction });
        else record = await MedicalRecord.create(data, { transaction });
        await apt.update({ status: 'completed' }, { transaction });
        await MedicalRecordAudit.create({ medicalRecordId: record.id, actorId: user.id, before, after: record.toJSON() }, { transaction });
        return record;
    });
}
module.exports = { allowedDoctor, createBooking, changeStatus, saveRecord };
