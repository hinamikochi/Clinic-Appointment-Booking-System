const { DataTypes: D } = require('sequelize');
const db = require('../db');
const Notification = db.define('Notification', {
    userId: { type: D.INTEGER, allowNull: false }, appointmentId: D.INTEGER,
    title: { type: D.STRING, allowNull: false }, message: { type: D.TEXT, allowNull: false },
    eventKey: { type: D.STRING(160), unique: true }, readAt: D.DATE
}, { tableName: 'notifications' });
const AppointmentEvent = db.define('AppointmentEvent', {
    appointmentId: { type: D.INTEGER, allowNull: false }, actorId: D.INTEGER,
    kind: { type: D.STRING, allowNull: false }, reason: D.TEXT, details: D.JSON
}, { tableName: 'appointmentevents', updatedAt: false });
const PatientProfile = db.define('PatientProfile', {
    ownerId: { type: D.INTEGER, allowNull: false }, fullName: { type: D.STRING(150), allowNull: false },
    birthDate: { type: D.STRING(10), allowNull: false }, gender: { type: D.STRING, allowNull: false },
    phone: D.STRING(20), allergies: D.TEXT, medicalHistory: D.TEXT
}, { tableName: 'patientprofiles' });
const RecordDraft = db.define('RecordDraft', {
    appointmentId: { type: D.INTEGER, allowNull: false }, doctorId: { type: D.INTEGER, allowNull: false },
    authorId: { type: D.INTEGER, allowNull: false }, data: { type: D.JSON, allowNull: false }, version: { type: D.INTEGER, defaultValue: 1 }
}, { tableName: 'recorddrafts', indexes: [{ unique: true, fields: ['appointmentId', 'authorId'] }] });
const PasswordReset = db.define('PasswordReset', {
    purpose: { type: D.STRING, defaultValue: 'password', allowNull: false },
    userId: { type: D.INTEGER, allowNull: false }, tokenHash: { type: D.STRING(64), unique: true, allowNull: false },
    expiresAt: { type: D.DATE, allowNull: false }, usedAt: D.DATE
}, { tableName: 'passwordresets' });
const EmailDelivery = db.define('EmailDelivery', {
    recipient: { type: D.STRING, allowNull: false }, subject: { type: D.STRING, allowNull: false },
    body: { type: D.TEXT, allowNull: false }, eventKey: { type: D.STRING(160), unique: true },
    status: { type: D.STRING, defaultValue: 'pending' }, attempts: { type: D.INTEGER, defaultValue: 0 },
    nextAttemptAt: { type: D.DATE, allowNull: false }, sentAt: D.DATE, lastError: D.STRING
}, { tableName: 'emaildeliveries' });
module.exports = { Notification, AppointmentEvent, PatientProfile, RecordDraft, PasswordReset, EmailDelivery };
