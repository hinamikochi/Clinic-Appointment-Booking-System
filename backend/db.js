const { Sequelize } = require('sequelize');  
require('dotenv').config();

if (process.env.NODE_ENV === 'test' && process.env.RUN_DB_TESTS === '1' && !/^[a-zA-Z0-9_]+_test$/.test(process.env.TEST_DB_NAME || '')) {
    throw new Error('Integration tests yêu cầu TEST_DB_NAME kết thúc bằng _test.');
}

const sequelize = new Sequelize(
    (process.env.NODE_ENV === 'test' && process.env.RUN_DB_TESTS === '1' ? process.env.TEST_DB_NAME : process.env.DB_NAME) || 'clinic_db',
    process.env.DB_USER || 'root', 
    process.env.DB_PASS || '', 
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
    }
);

module.exports = sequelize;
