const { DataTypes } = require('sequelize');
const sequelize = require('../db');
require('../models/associations');
require('../models/MedicalRecordAudit');
require('../models/Operations');

async function migrate() {
    const qi = sequelize.getQueryInterface();
    // MySQL DDL commits implicitly; serialize schema upgrades across processes.
    const connection = await sequelize.connectionManager.getConnection();
    const query = (sql, params = []) => new Promise((resolve, reject) => connection.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
    let locked = false;
    try {
        const result = await query("SELECT GET_LOCK('myclinic_schema_migrations', 30) AS acquired");
        if (Number(result[0].acquired) !== 1) throw new Error('Không thể lấy khóa migration.');
        locked = true;
        await qi.createTable('schema_migrations', { name: { type: DataTypes.STRING, primaryKey: true }, appliedAt: { type: DataTypes.DATE, allowNull: false } });
        const [applied] = await sequelize.query("SELECT name FROM schema_migrations WHERE name = '001_clinic_integrity'");
        if (!applied.length) {
        const tables = await qi.showAllTables();
        if (!tables.includes('users')) await sequelize.sync();
        const additions = {
            appointments: { consultationFee: { type: DataTypes.INTEGER, allowNull: true }, activeSlot: { type: DataTypes.STRING(100), allowNull: true }, claimCodeHash: { type: DataTypes.STRING(64), allowNull: true } },
            doctorinfos: { workSchedule: { type: DataTypes.JSON, allowNull: true } },
            medicalrecords: { prescriptionItems: { type: DataTypes.JSON, allowNull: true }, updatedBy: { type: DataTypes.INTEGER, allowNull: true } }
        };
        for (const [table, columns] of Object.entries(additions)) {
            const existing = await qi.describeTable(table);
            for (const [name, definition] of Object.entries(columns)) if (!existing[name]) await qi.addColumn(table, name, definition);
        }
        const [duplicates] = await sequelize.query("SELECT doctorId, appointment_date, time_slot, COUNT(*) AS count FROM appointments WHERE status <> 'cancelled' GROUP BY doctorId, appointment_date, time_slot HAVING COUNT(*) > 1");
        if (duplicates.length) throw new Error('Database có lịch khám trùng. Hãy xử lý lịch trùng trước khi chạy lại migration; không có lịch nào bị tự động xóa.');
        await sequelize.query("UPDATE appointments SET activeSlot = CASE WHEN status = 'cancelled' THEN NULL ELSE CONCAT(doctorId, '|', appointment_date, '|', time_slot) END");
        const indexes = await qi.showIndex('appointments');
        if (!indexes.some(index => index.unique && index.fields.length === 1 && index.fields[0].attribute === 'activeSlot')) await qi.addIndex('appointments', ['activeSlot'], { unique: true, name: 'appointments_active_slot_unique' });
        // Historical fees stay NULL: current prices cannot establish past prices.
        await sequelize.models.MedicalRecordAudit.sync();
        await sequelize.query("INSERT INTO schema_migrations (name, appliedAt) VALUES ('001_clinic_integrity', NOW())");
        }
        await require('./002_operations')();
    } finally {
        if (locked) await query("SELECT RELEASE_LOCK('myclinic_schema_migrations')");
        await sequelize.connectionManager.releaseConnection(connection);
    }
}
module.exports = { migrate };
if (require.main === module) migrate().then(() => sequelize.close()).catch(async error => { console.error(error.message); await sequelize.close(); process.exitCode = 1; });
