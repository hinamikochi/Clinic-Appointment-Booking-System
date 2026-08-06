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
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true 
    }
});

module.exports = Appointment;