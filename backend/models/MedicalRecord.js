const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MedicalRecord = sequelize.define('MedicalRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    diagnosis: {
        type: DataTypes.TEXT,
        allowNull: false 
    },
    prescription: {
        type: DataTypes.TEXT,
        allowNull: true 
    },
    advice: {
        type: DataTypes.TEXT,
        allowNull: true 
    },
    re_visit_date: {
        type: DataTypes.STRING,
        allowNull: true 
    }
});

module.exports = MedicalRecord;