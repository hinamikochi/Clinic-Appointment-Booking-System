const { Op } = require('sequelize');
const { Notification, EmailDelivery } = require('../models/Operations');
const User = require('../models/User');
const Doctor = require('../models/DoctorInfo');
const Appointment = require('../models/Appointment');
const v = require('../validators/clinic');

async function notify(userId, title, message, appointmentId, key, transaction) {
    if (!userId) return;
    if (!transaction) return require('../db').transaction(tx => notify(userId, title, message, appointmentId, key, tx));
    const user = await User.findByPk(userId, { transaction, attributes: ['id', 'email', 'isActive', 'emailVerified'] });
    if (!user || user.isActive === false) return;
    const eventKey = `${key}:${userId}`;
    const [, created] = await Notification.findOrCreate({ where: { eventKey }, defaults: { userId, title, message, appointmentId }, transaction });
    if (created && user.email && user.emailVerified && process.env.SMTP_HOST) await EmailDelivery.create({ recipient: user.email, subject: title, body: message, eventKey, nextAttemptAt: new Date() }, { transaction });
}
async function appointmentChanged(apt, title, message, key, transaction) {
    const doctor = await Doctor.findByPk(apt.doctorId, { transaction });
    for (const userId of [...new Set([apt.userId, doctor?.userId].filter(Boolean))]) await notify(userId, title, message, apt.id, key, transaction);
}
let ticking = false;
async function tick() {
    if (ticking) return;
    ticking = true;
    try {
        const now = new Date(), end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const appointments = await Appointment.findAll({ where: { status: 'confirmed', appointment_date: { [Op.between]: [v.clinicDate(now), v.clinicDate(end)] } } });
        for (const apt of appointments) {
            const start = new Date(`${apt.appointment_date}T${apt.time_slot.slice(0, 5)}:00+07:00`);
            if (start <= now || start > end) continue;
            await notify(apt.userId, 'Nhắc lịch khám', `Lịch LH-${apt.id}: ${apt.appointment_date}, ${apt.time_slot}. Vui lòng đến trước giờ hẹn và mang giấy tờ, kết quả khám liên quan.`, apt.id, `reminder:${apt.id}:${apt.appointment_date}:${apt.time_slot}`);
        }
        if (process.env.SMTP_HOST) await deliverEmails();
    } finally { ticking = false; }
}
async function deliverEmails() {
    const nodemailer = require('nodemailer');
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined, connectionTimeout: 10000, socketTimeout: 15000 });
    // Claim a delivery inside a transaction; recovery after worker termination is bounded.
    for (let i = 0; i < 20; i++) {
        const delivery = await require('../db').transaction(async transaction => {
            const row = await EmailDelivery.findOne({ where: { status: { [Op.in]: ['pending', 'retry'] }, nextAttemptAt: { [Op.lte]: new Date() } }, transaction, lock: transaction.LOCK.UPDATE, skipLocked: true });
            if (!row) return null;
            await row.update({ status: 'sending', attempts: row.attempts + 1 }, { transaction });
            return row;
        });
        if (!delivery) break;
        try {
            await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: delivery.recipient, subject: delivery.subject, text: delivery.body });
            await delivery.update({ status: 'sent', sentAt: new Date(), body: '', lastError: null });
        } catch {
            await delivery.update({ status: delivery.attempts >= 5 ? 'failed' : 'retry', nextAttemptAt: new Date(Date.now() + 60000 * 2 ** delivery.attempts), lastError: 'Không gửi được email. Kiểm tra cấu hình SMTP.' });
        }
    }
    await EmailDelivery.update({ status: 'retry', nextAttemptAt: new Date() }, { where: { status: 'sending', updatedAt: { [Op.lt]: new Date(Date.now() - 10 * 60000) } } });
}
function startWorker() { const timer = setInterval(() => tick().catch(error => console.error('Notification worker:', error.message)), 60000); timer.unref(); tick().catch(error => console.error('Notification worker:', error.message)); return () => clearInterval(timer); }
module.exports = { notify, appointmentChanged, tick, startWorker };
