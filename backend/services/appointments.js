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
        if (!['confirmed', 'arrived', 'in_progress', 'completed'].includes(apt.status)) v.fail('Chỉ khám lịch đã xác nhận.');
        if (new Date(`${apt.appointment_date}T${apt.time_slot.slice(0, 5)}:00+07:00`) > new Date()) v.fail('Chưa đến giờ khám.');
        const re_visit_date = body.re_visit_date || null;
        let record = await MedicalRecord.findOne({ where: { appointmentId: apt.id }, transaction });
        if (re_visit_date && (!v.validDate(re_visit_date) || (re_visit_date !== record?.re_visit_date && re_visit_date <= v.clinicDate()))) v.fail('Ngày đề nghị tái khám mới phải sau hôm nay.');
        if (record && Number(body.version) !== record.version) v.fail('Bệnh án đã thay đổi. Vui lòng tải lại trước khi sửa.', 409);
        const before = record ? record.toJSON() : null;
        const data = { version: record ? record.version + 1 : 1, patientProfileId: apt.patientProfileId, appointmentId: apt.id, patientId: apt.userId, doctorId: apt.doctorId, diagnosis, prescription: prescriptionItems.length ? prescriptionItems.map(i => `${i.name}: ${i.dosage}; ${i.frequency}; ${i.duration}${i.instructions ? `; ${i.instructions}` : ''}`).join('\n') : prescription, prescriptionItems, advice, re_visit_date, updatedBy: user.id };
        if (record) await record.update(data, { transaction });
        else record = await MedicalRecord.create(data, { transaction });
        await apt.update({ status: 'completed', version: (apt.version || 1) + 1 }, { transaction });
        await MedicalRecordAudit.create({ medicalRecordId: record.id, actorId: user.id, before, after: record.toJSON() }, { transaction });
        await require('../models/Operations').RecordDraft.destroy({ where: { appointmentId: apt.id, authorId: user.id }, transaction });
        await require('./notifications').appointmentChanged(apt, 'Đã có kết quả khám', `Phiếu LH-${apt.id} đã hoàn thành. Xem kết quả trong tài khoản của bạn.`, `record:${record.id}:${data.version}`, transaction);
        return record;
    });
}
module.exports = { allowedDoctor, ...require('./bookingLifecycle'), saveRecord };
