const { DataTypes } = require('sequelize');
const sequelize = require('../db');
module.exports = sequelize.define('MedicalRecordAudit', {
    medicalRecordId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: false },
    before: { type: DataTypes.JSON, allowNull: true },
    after: { type: DataTypes.JSON, allowNull: false }
}, { tableName: 'medicalrecordaudits', updatedAt: false });
