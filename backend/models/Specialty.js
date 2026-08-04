const { DataTypes } = require('sequelize');
const sequelize = require('../db');
require('dotenv').config();


const Specialty = sequelize.define('Specialty', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
});

module.exports =  Specialty ;

