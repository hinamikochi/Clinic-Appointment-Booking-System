const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    patient_phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    patient_gender: {
        type: DataTypes.STRING,
        defaultValue: 'Nam'
    },
    patient_age: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    specialtyId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    appointment_date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time_slot: {
        type: DataTypes.STRING,
        allowNull: false
    },
    symptoms: {
        type: DataTypes.TEXT,
        defaultValue: 'Khám bệnh theo yêu cầu'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    patientProfileId: { type: DataTypes.INTEGER, allowNull: true },
    version: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    bookingRequestKey: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    bookingFingerprint: { type: DataTypes.STRING(64), allowNull: true },
    meetingUrl: { type: DataTypes.STRING(1000), allowNull: true },
    consultationFee: { type: DataTypes.INTEGER, allowNull: true },
    claimCodeHash: { type: DataTypes.STRING(64), allowNull: true },
    activeSlot: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'appointments',
    defaultScope: { attributes: { exclude: ['claimCodeHash'] } }
});

module.exports = Appointment;
