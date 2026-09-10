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
    image: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports =  Specialty ;

