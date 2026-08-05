const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');
const Specialty = require('./Specialty');

const DoctorInfo = sequelize.define('DoctorInfo', {
    userId: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' },
        unique: true
    },
    specialtyId: {
        type: DataTypes.INTEGER,
        references: { model: Specialty, key: 'id' }
    },
    degree: { type: DataTypes.STRING },
    image: { type:  DataTypes.STRING },
    description: { type: DataTypes.TEXT }
});

DoctorInfo.belongsTo(User, { foreignKey: 'userId' });
DoctorInfo.belongsTo(Specialty, { foreignKey: 'specialtyId' });

module.exports = DoctorInfo;