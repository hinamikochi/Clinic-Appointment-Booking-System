const { DataTypes: D, Op } = require('sequelize');
const db = require('../db');
const operations = require('../models/Operations');
module.exports = async function up() {
    const [done] = await db.query("SELECT name FROM schema_migrations WHERE name = '002_clinic_operations'");
    if (done.length) return;
    const qi = db.getQueryInterface();
    const additions = {
        users: { isActive: { type: D.BOOLEAN, defaultValue: true, allowNull: false }, tokenVersion: { type: D.INTEGER, defaultValue: 0, allowNull: false }, emailVerified: { type: D.BOOLEAN, defaultValue: false, allowNull: false } },
        doctorinfos: { acceptingBookings: { type: D.BOOLEAN, defaultValue: true, allowNull: false }, scheduleVersion: { type: D.INTEGER, defaultValue: 1, allowNull: false } },
        appointments: { patientProfileId: { type: D.INTEGER, allowNull: true }, cancellationReason: { type: D.TEXT, allowNull: true }, version: { type: D.INTEGER, defaultValue: 1, allowNull: false }, bookingRequestKey: { type: D.STRING(64), allowNull: true }, bookingFingerprint: { type: D.STRING(64), allowNull: true }, meetingUrl: { type: D.STRING(1000), allowNull: true } },
        medicalrecords: { patientProfileId: { type: D.INTEGER, allowNull: true }, version: { type: D.INTEGER, defaultValue: 1, allowNull: false } }
    };
    for (const [table, columns] of Object.entries(additions)) {
        const present = await qi.describeTable(table);
        for (const [name, definition] of Object.entries(columns)) if (!present[name]) await qi.addColumn(table, name, definition);
    }
    const indexes = await qi.showIndex('appointments');
    if (!indexes.some(i => i.name === 'appointments_booking_request_unique')) await qi.addIndex('appointments', ['bookingRequestKey'], { name: 'appointments_booking_request_unique', unique: true });
    for (const model of Object.values(operations)) await model.sync();
    // Keep the original account; do not guess a specialty or a consultation fee.
    const User = require('../models/User');
    const Doctor = require('../models/DoctorInfo');
    const users = await User.findAll({ where: { role: 'doctor' }, attributes: ['id'] });
    for (const user of users) await Doctor.findOrCreate({ where: { userId: user.id }, defaults: { acceptingBookings: false, specialtyId: null, description: 'Hồ sơ cần quản trị viên hoàn thiện trước khi nhận lịch.' } });
    await db.query("INSERT INTO schema_migrations (name, appliedAt) VALUES ('002_clinic_operations', NOW())");
};
