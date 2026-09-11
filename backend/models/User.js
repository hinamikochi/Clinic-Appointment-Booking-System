const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 
require('dotenv').config();

const User = sequelize.define('User', {
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('admin', 'patient', 'doctor'),
        defaultValue: 'patient'
    }
}, {
    tableName: 'users'
});

module.exports = User;