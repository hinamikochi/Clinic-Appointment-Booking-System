const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const Specialty = require('../models/Specialty');
const MedicalRecord = require('../models/MedicalRecord');
const DoctorInfo = require('../models/DoctorInfo');
const User = require('../models/User');
const v = require('../validators/clinic');

async function list(req, res, next) {
    try {
        const where = {};
        if (req.query.status && req.query.status !== 'all') {
            if (!['pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(req.query.status)) v.fail('Trạng thái không hợp lệ.');
            where.status = req.query.status;
        }
        for (const field of ['doctorId', 'specialtyId']) if (req.query[field]) {
            if (!Number.isSafeInteger(Number(req.query[field])) || Number(req.query[field]) < 1) v.fail('Bộ lọc không hợp lệ.');
            where[field] = Number(req.query[field]);
        }
        if (req.query.date) {
            if (!v.validDate(req.query.date)) v.fail('Ngày không hợp lệ.');
            where.appointment_date = req.query.date;
        }
        if (req.query.search) {
            const term = v.text(req.query.search, 'Từ khóa', 150);
            // Escape LIKE wildcards so user input is a literal search term.
            const like = `%${term.replace(/[\\%_]/g, char => `\\${char}`)}%`;
            where[Op.or] = [{ patient_name: { [Op.like]: like } }, { patient_phone: { [Op.like]: like } }];
        }
        const options = { where, include: [Specialty, MedicalRecord, { model: DoctorInfo, include: [{ model: User, attributes: ['full_name'] }] }], order: [['createdAt', 'DESC'], ['id', 'DESC']] };
        // Keep existing dashboard/header consumers compatible.
        if (req.query.page === undefined) return res.json(await Appointment.findAll(options));
        const page = Number(req.query.page), limit = Number(req.query.limit || 8);
        if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) v.fail('Phân trang không hợp lệ.');
        const { rows, count } = await Appointment.findAndCountAll({ ...options, distinct: true, limit, offset: (page - 1) * limit });
        res.json({ items: rows, total: count, page, totalPages: Math.max(1, Math.ceil(count / limit)) });
    } catch (error) { next(error); }
}
module.exports = { list };
