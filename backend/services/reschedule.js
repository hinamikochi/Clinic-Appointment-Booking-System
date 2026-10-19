const { Op } = require('sequelize');
const db = require('../db');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/DoctorInfo');
const User = require('../models/User');
const { AppointmentEvent } = require('../models/Operations');
const { appointmentChanged } = require('./notifications');
const v = require('../validators/clinic');

async function reschedule(id, body, actor) {
    const reason = v.text(body.reason, 'Lý do đổi lịch', 1000, true);
    if (!v.futureSlot(body.appointment_date, body.time_slot)) v.fail('Vui lòng chọn giờ khám trong tương lai.');
    return db.transaction(async transaction => {
        const snapshot = await Appointment.findByPk(id, { transaction });
        if (!snapshot) v.fail('Không tìm thấy lịch hẹn.', 404);
        if (actor.role !== 'admin' && (actor.role !== 'patient' || snapshot.userId !== actor.id)) v.fail('Không có quyền đổi lịch.', 403);
        const doctorId = actor.role === 'admin' ? Number(body.doctorId || snapshot.doctorId) : snapshot.doctorId;
        // Same lock order as createBooking; both source and destination are protected.
        const doctors = await Doctor.findAll({ where: { id: { [Op.in]: [...new Set([snapshot.doctorId, doctorId])].sort((a, b) => a - b) } }, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
        const doctor = doctors.find(d => d.id === doctorId);
        const apt = await Appointment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (apt.doctorId !== snapshot.doctorId || apt.version !== Number(body.version)) v.fail('Lịch hẹn đã thay đổi. Vui lòng tải lại.', 409);
        if (!['pending', 'confirmed'].includes(apt.status) || !v.futureSlot(apt.appointment_date, apt.time_slot)) v.fail('Chỉ đổi lịch chưa khám và chưa đến giờ.');
        if (!doctor || doctor.acceptingBookings === false || !v.worksOn(doctor, body.appointment_date, body.time_slot)) v.fail('Bác sĩ không nhận lịch trong khung giờ này.');
        const account = await User.findByPk(doctor.userId, { transaction });
        if (!account || account.isActive === false || account.role !== 'doctor') v.fail('Bác sĩ không còn hoạt động.');
        if (apt.doctorId === doctorId && apt.appointment_date === body.appointment_date && apt.time_slot === body.time_slot) v.fail('Hãy chọn lịch mới khác lịch hiện tại.');
        const conflict = await Appointment.findOne({ where: { id: { [Op.ne]: apt.id }, doctorId, appointment_date: body.appointment_date, status: { [Op.notIn]: ['cancelled', 'no_show'] } }, transaction, lock: transaction.LOCK.UPDATE });
        // Check all rows, including overlapping custom-duration slots.
        const occupied = await Appointment.findAll({ where: { id: { [Op.ne]: apt.id }, doctorId, appointment_date: body.appointment_date, status: { [Op.notIn]: ['cancelled', 'no_show'] } }, transaction });
        if (occupied.some(a => v.overlaps(a.time_slot, body.time_slot))) v.fail('Khung giờ mới đã có lịch khám.', 409);
        const before = { doctorId: apt.doctorId, date: apt.appointment_date, slot: apt.time_slot, status: apt.status };
        await apt.update({ doctorId, specialtyId: doctor.specialtyId, appointment_date: body.appointment_date, time_slot: body.time_slot, consultationFee: doctor.consultationFee || 0, status: 'pending', activeSlot: `${doctorId}|${body.appointment_date}|${body.time_slot}`, version: apt.version + 1 }, { transaction });
        await AppointmentEvent.create({ appointmentId: apt.id, actorId: actor.id, kind: 'rescheduled', reason, details: { before, after: { doctorId, date: apt.appointment_date, slot: apt.time_slot } } }, { transaction });
        if (before.doctorId !== doctorId) await require('./notifications').notify(doctors.find(d => d.id === before.doctorId)?.userId, 'Lịch khám được chuyển', `Lịch LH-${apt.id} đã được chuyển sang bác sĩ khác.`, apt.id, `transferred:${apt.id}:${apt.version}`, transaction);
        await appointmentChanged(apt, 'Lịch khám đã thay đổi', `Lịch LH-${apt.id} được đổi sang ${apt.appointment_date}, ${apt.time_slot}; đang chờ xác nhận lại. Lý do: ${reason}`, `rescheduled:${apt.id}:${apt.version}`, transaction);
        return apt;
    });
}
module.exports = { reschedule };
