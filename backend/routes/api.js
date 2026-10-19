const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sequelize = require('../db');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const DoctorInfo = require('../models/DoctorInfo');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { authMiddleware, optionalAuth, checkRole, ownAccount } = require('../middlewares/auth');
const { jwtSecret } = require('../config/security');
const v = require('../validators/clinic');
const appointmentService = require('../services/appointments');
const app = express.Router();
// Phân tầng và tìm phòng khám trống
async function findFirstAvailableRoom(specialtyId) {
    const specId = parseInt(specialtyId, 10) || 1;

    const floor = specId;
    const baseRoomNumber = floor * 100;

    const doctors = await DoctorInfo.findAll({ where: { specialtyId: specId } });

    const usedRoomNumbers = doctors.map(d => {
        if (!d.roomNumber) return 0;
        const match = d.roomNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }).filter(n => n > 0);

    // Tìm số phòng nhỏ nhất còn trống
    let candidateNumber = baseRoomNumber + 1;
    while (usedRoomNumbers.includes(candidateNumber)) {
        candidateNumber++;
    }


    const defaultFee = floor === 1 ? 200000 : (floor === 2 ? 250000 : 300000);

    return {
        roomNumber: `Phòng ${candidateNumber} - Tầng ${floor}`,
        defaultFee: defaultFee
    };
}

// API: Lấy thông tin tài khoản người dùng theo ID
app.get('/api/users/:id', authMiddleware, ownAccount('id'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'full_name', 'email', 'phone', 'gender', 'address', 'role', 'isActive'],
            include: [{ model: DoctorInfo }]
        });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        res.json(user);
    } catch (err) {
        res.status(err?.status || 500).json({ message: err.status ? err.message : 'Lỗi server' });
    }
});

// API: Đăng ký (Register)
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, password } = v.credentials(req.body, true);
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            full_name, email, password: hashedPassword, role: 'patient'
        });

        res.status(201).json({ message: 'Đăng ký thành công!', userId: newUser.id });
    } catch (error) {
        res.status(error?.status || 500).json({ message: error?.status ? error.message : 'Lỗi server.' });
    }
});

// API: Đăng nhập (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = v.credentials(req.body);
        const user = await User.findOne({ where: { email } });
        if (!user || user.isActive === false) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });

        const token = jwt.sign(
            { id: user.id, role: user.role, tokenVersion: user.tokenVersion || 0 },
            jwtSecret,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(error?.status || 500).json({ message: error?.status ? error.message : 'Lỗi server.' });
    }
});

// API: Bệnh nhân Đặt Lịch Khám Mới
app.post('/api/appointments', optionalAuth, async (req, res, next) => {
    try { const data = await appointmentService.createBooking(req.body, req.user); res.status(201).json({ message: 'Đặt lịch khám thành công!', data }); }
    catch (error) { next(error); }
});

app.get('/api/availability', async (req, res, next) => {
    try {
        const { doctorId, date } = req.query;
        if (!v.validDate(date) || !Number.isSafeInteger(Number(doctorId)) || Number(doctorId) < 1) v.fail('Ngày hoặc bác sĩ không hợp lệ.');
        const doctor = await DoctorInfo.findByPk(doctorId);
        if (!doctor) v.fail('Không tìm thấy bác sĩ.', 404);
        const appointments = await Appointment.findAll({ where: { doctorId, appointment_date: date, status: { [Op.notIn]: ['cancelled', 'no_show'] } }, attributes: ['time_slot'] });
        res.json(v.slotsOn(doctor, date).map(slot => ({ slot, available: doctor.acceptingBookings !== false && v.futureSlot(date, slot) && v.worksOn(doctor, date, slot) && !appointments.some(a => v.overlaps(a.time_slot, slot)) })));
    } catch (error) { next(error); }
});

app.put('/api/doctors/:id/schedule', authMiddleware, checkRole(['admin', 'doctor']), async (req, res, next) => {
    try {
        const workSchedule = v.schedule(req.body);
        await sequelize.transaction(async transaction => {
            const doctor = await DoctorInfo.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!doctor) v.fail('Không tìm thấy bác sĩ.', 404);
            await appointmentService.allowedDoctor(req.user, doctor.id, transaction);
            const active = await Appointment.findAll({ where: { doctorId: doctor.id, status: { [Op.in]: ['pending', 'confirmed'] }, appointment_date: { [Op.gte]: v.clinicDate() } }, transaction });
            if (active.some(a => v.futureSlot(a.appointment_date, a.time_slot) && !v.worksOn({ workSchedule }, a.appointment_date, a.time_slot))) v.fail('Lịch làm việc mới xung đột với lịch hẹn đang có. Hãy xử lý các lịch hẹn đó trước.');
            if (Number(req.body.version) !== doctor.scheduleVersion) v.fail('Lịch làm việc đã thay đổi. Vui lòng tải lại.', 409);
            await doctor.update({ workSchedule, scheduleVersion: doctor.scheduleVersion + 1 }, { transaction });
        });
        res.json({ message: 'Đã cập nhật lịch làm việc.', version: (await DoctorInfo.findByPk(req.params.id)).scheduleVersion });
    } catch (error) { next(error); }
});

// API: Lấy Lịch Hẹn Của Bệnh Nhân
app.get('/api/patient/appointments/:userId', authMiddleware, checkRole(['patient', 'admin']), ownAccount('userId'), async (req, res) => {
    try {
        const { userId } = req.params;
        const whereCondition = { userId };
        const appointments = await Appointment.findAll({
            where: whereCondition,
            include: [
                { model: Specialty, attributes: ['id', 'name'] },
                { model: MedicalRecord },
                {
                    model: DoctorInfo,
                    attributes: ['id', 'degree', 'roomNumber'],
                    include: [{ model: User, attributes: ['full_name', 'email'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appointments);
    } catch (error) {
        console.error('Lỗi lấy lịch hẹn bệnh nhân:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi lấy danh sách lịch hẹn cá nhân' });
    }
});

// API: Bệnh nhân Hủy Lịch Hẹn
app.put('/api/appointments/:id/cancel', authMiddleware, checkRole(['patient', 'admin']), async (req, res, next) => {
    try { const data = await appointmentService.changeStatus(req.params.id, 'cancelled', req.user, true, req.body.reason); res.json({ message: 'Đã hủy lịch hẹn thành công!', data }); }
    catch (error) { next(error); }
});

// API: Admin Lấy Toàn Bộ Lịch Hẹn
app.get('/api/appointments', authMiddleware, checkRole(['admin']), require('../controllers/appointments').list);

// API: Admin Cập Nhật Trạng Thái Lịch Hẹn
app.put('/api/appointments/:id/status', authMiddleware, checkRole(['admin', 'doctor']), async (req, res, next) => {
    try { const data = await appointmentService.changeStatus(req.params.id, req.body.status, req.user, false, req.body.reason); res.json({ message: 'Cập nhật trạng thái thành công!', data }); }
    catch (error) { next(error); }
});

// API Bác Sĩ & Chuyên Khoa
app.get(['/api/doctors', '/api/admin/doctors'], async (req, res) => {
    try {
        const doctors = await DoctorInfo.findAll({
            ...(req.path === '/api/doctors' ? { where: { acceptingBookings: true, specialtyId: { [Op.ne]: null } } } : {}),
            include: [
                { model: User, attributes: ['full_name', 'email', 'role', 'isActive'], ...(req.path === '/api/doctors' ? { where: { isActive: true }, required: true } : {}) },
                { model: Specialty, attributes: ['id', 'name'] }
            ]
        });
        res.json(doctors);
    } catch (error) {
        res.status(error?.status || 500).json({ message: error?.status ? error.message : 'Lỗi server.' });
    }
});

app.get('/api/specialties', async (req, res) => {
    try {
        const specialties = await Specialty.findAll({
            include: [
                {
                    model: DoctorInfo,
                    attributes: ['id', 'consultationFee', 'roomNumber']
                }
            ]
        });
        res.json(specialties);
    } catch (error) {
        console.error('Lỗi lấy danh sách chuyên khoa:', error);
        res.status(error?.status || 500).json({ message: error?.status ? error.message : 'Lỗi server.' });
    }
});

app.post('/api/specialties', authMiddleware,
    checkRole(['admin']), async (req, res) => {
    try {
        const name = v.text(req.body.name, 'Tên chuyên khoa', 150, true);
        const description = v.text(req.body.description, 'Mô tả', 10000);
        const newSpec = await Specialty.create({ name, description });
        res.status(201).json(newSpec);
    } catch (error) {
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi tạo chuyên khoa.' });
    }
});

app.delete('/api/specialties/:id', authMiddleware,
    checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        if (await DoctorInfo.count({ where: { specialtyId: id } }) || await Appointment.count({ where: { specialtyId: id } })) return res.status(409).json({ message: 'Chuyên khoa còn bác sĩ hoặc lịch hẹn; không thể xóa.' });
        await Specialty.destroy({ where: { id } });
        res.json({ message: 'Đã xóa chuyên khoa!' });
    } catch (error) {
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi xóa chuyên khoa.' });
    }
});

app.put('/api/specialties/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const spec = await Specialty.findByPk(id);
        if (!spec) return res.status(404).json({ message: 'Không tìm thấy chuyên khoa!' });
        await spec.update({
            name: name || spec.name,
            description: description !== undefined ? description : spec.description
        });
        res.json({ message: 'Cập nhật chuyên khoa thành công!', data: spec });
    } catch (error) {
        console.error('Lỗi cập nhật chuyên khoa:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi cập nhật chuyên khoa.' });
    }
});

// API: admin Tạo Tài Khoản Bác Sĩ
app.post('/api/admin/doctors', authMiddleware, checkRole(['admin']), async (req, res) => {
    try {
        const { full_name, email, password } = v.credentials(req.body, true);
        const { specialtyId, degree, image, roomNumber, consultationFee, description } = req.body;
        if (!await Specialty.findByPk(specialtyId)) v.fail('Chuyên khoa không tồn tại.');
        if (consultationFee !== undefined && consultationFee !== '' && (!Number.isSafeInteger(Number(consultationFee)) || Number(consultationFee) < 0)) v.fail('Phí khám không hợp lệ.');

        if (!full_name || !email || !password || !specialtyId) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống!' });
        }

        const autoRoom = await findFirstAvailableRoom(specialtyId);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const t = await sequelize.transaction();
        try {
            const newUser = await User.create({
                full_name,
                email,
                password: hashedPassword,
                role: 'doctor'
            }, { transaction: t });

            const newDocInfo = await DoctorInfo.create({
                userId: newUser.id,
                specialtyId: Number(specialtyId),
                degree: degree || 'Bác sĩ chuyên khoa',
                image: image || '',
                roomNumber: roomNumber || autoRoom.roomNumber,
                consultationFee: consultationFee !== undefined && consultationFee !== '' ? Number(consultationFee) : autoRoom.defaultFee,
                description: description || ''
            }, { transaction: t });

            await t.commit();
            res.status(201).json({ message: 'Tạo tài khoản Bác sĩ thành công!', data: newDocInfo });
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Lỗi tạo bác sĩ:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi tạo bác sĩ.' });
    }
});

app.put('/api/admin/doctors/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, specialtyId, degree, image, roomNumber, consultationFee, description } = req.body;
        if (full_name !== undefined) v.text(full_name, 'Họ tên', 150, true);
        if (specialtyId && !await Specialty.findByPk(specialtyId)) v.fail('Chuyên khoa không tồn tại.');
        if (consultationFee !== undefined && consultationFee !== '' && (!Number.isSafeInteger(Number(consultationFee)) || Number(consultationFee) < 0)) v.fail('Phí khám không hợp lệ.');
        if (image && !/^https?:\/\//.test(image)) v.fail('Ảnh phải là URL HTTP hoặc HTTPS.');
        const docInfo = await DoctorInfo.findByPk(id, { include: [{ model: User }] });
        if (!docInfo) return res.status(404).json({ message: 'Không tìm thấy thông tin Bác sĩ!' });
        if (specialtyId && Number(specialtyId) !== docInfo.specialtyId && await Appointment.count({ where: { doctorId: docInfo.id, status: { [Op.in]: ['pending', 'confirmed', 'arrived', 'in_progress'] } } })) v.fail('Cần xử lý lịch hẹn đang có trước khi đổi chuyên khoa.', 409);

        if (full_name && docInfo.User) {
            await docInfo.User.update({ full_name });
        }

        await docInfo.update({
            specialtyId: specialtyId ? Number(specialtyId) : docInfo.specialtyId,
            degree: degree !== undefined ? degree : docInfo.degree,
            image: image !== undefined ? image : docInfo.image,
            roomNumber: roomNumber !== undefined ? roomNumber : docInfo.roomNumber,
            consultationFee: (consultationFee !== undefined && consultationFee !== '' && !isNaN(consultationFee)) ? Number(consultationFee) : docInfo.consultationFee,
            description: description !== undefined ? description : docInfo.description
        });

        res.json({ message: 'Cập nhật thông tin Bác sĩ thành công!', data: docInfo });
    } catch (error) {
        console.error('Lỗi cập nhật bác sĩ:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi cập nhật bác sĩ' });
    }
});

app.delete('/api/admin/doctors/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const docInfo = await DoctorInfo.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!docInfo) {
            await t.rollback();
            return res.status(404).json({ message: 'Không tìm thấy thông tin Bác sĩ!' });
        }
        if (await Appointment.count({ where: { doctorId: docInfo.id }, transaction: t }) || await MedicalRecord.count({ where: { doctorId: docInfo.id }, transaction: t })) {
            await t.rollback();
            return res.status(409).json({ message: 'Bác sĩ đã có lịch hẹn hoặc bệnh án; không thể xóa lịch sử khám.' });
        }
        const userId = docInfo.userId;
        await docInfo.destroy({ transaction: t });
        if (userId) {
            await User.destroy({ where: { id: userId }, transaction: t });
        }
        await t.commit();
        res.json({ message: 'Đã xóa Bác sĩ khỏi hệ thống thành công!' });
    } catch (error) {
        await t.rollback();
        console.error('Lỗi xóa bác sĩ:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi xóa bác sĩ.' });
    }
});

// API: Lấy thông tin chi tiết Bác sĩ theo userId tài khoản
app.get('/api/doctor/info/:userId', authMiddleware, checkRole(['doctor', 'admin']), ownAccount('userId'), async (req, res) => {
    try {
        const { userId } = req.params;
        const doctorInfo = await DoctorInfo.findOne({
            where: { userId },
            include: [
                { model: User, attributes: ['id', 'full_name', 'email'] },
                { model: Specialty, attributes: ['id', 'name'] }
            ]
        });
        if (!doctorInfo) return res.status(409).json({ message: 'Hồ sơ bác sĩ chưa hoàn thiện. Vui lòng liên hệ quản trị viên để bổ sung.' });
        res.json(doctorInfo);
    } catch (error) {
        console.error('Lỗi lấy thông tin bác sĩ:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server' });
    }
});

// API: Lấy danh sách lịch khám của Bác sĩ theo doctorId
app.get('/api/doctor/appointments/:doctorId', authMiddleware, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const { doctorId } = req.params;
        await appointmentService.allowedDoctor(req.user, Number(doctorId));
        const appointments = await Appointment.findAll({
            where: { doctorId },
            include: [
                { model: Specialty, attributes: ['id', 'name'] },
                { model: MedicalRecord }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appointments);
    } catch (error) {
        console.error('Lỗi lấy danh sách khám bác sĩ:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi lấy danh sách khám' });
    }
});

// API Lưu hồ sơ bệnh án
app.post('/api/medical-records', authMiddleware, checkRole(['doctor', 'admin']), async (req, res, next) => {
    try { const data = await appointmentService.saveRecord(req.body, req.user); res.status(201).json({ message: 'Lưu hồ sơ bệnh án thành công!', data }); }
    catch (error) { next(error); }
});

// API: Cập nhật thông tin cá nhân
app.put('/api/users/profile/:id', authMiddleware, ownAccount('id'), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, gender, address, degree, image } = req.body;
        if (full_name !== undefined) v.text(full_name, 'Họ tên', 150, true);
        if (address !== undefined) v.text(address, 'Địa chỉ', 255);
        if (phone && !/^\+?[0-9]{9,15}$/.test(phone)) v.fail('Số điện thoại không hợp lệ.');
        if (gender && !['Nam', 'Nữ', 'Khác'].includes(gender)) v.fail('Giới tính không hợp lệ.');
        if (image && !/^https?:\/\//.test(image)) v.fail('Ảnh phải là URL HTTP hoặc HTTPS.');
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

        await user.update({
            full_name: full_name || user.full_name,
            phone: phone !== undefined ? phone : user.phone,
            gender: gender || user.gender,
            address: address !== undefined ? address : user.address
        });

        if (user.role === 'doctor') {
            const docInfo = await DoctorInfo.findOne({ where: { userId: user.id } });
            if (docInfo) {
                await docInfo.update({
                    degree: degree !== undefined ? degree : docInfo.degree,
                    image: image !== undefined ? image : docInfo.image
                });
            }
        }

        const updatedUser = await User.findByPk(id, {
            attributes: ['id', 'full_name', 'email', 'phone', 'gender', 'address', 'role'],
            include: [{ model: DoctorInfo }]
        });

        res.json({
            message: 'Cập nhật thông tin cá nhân thành công!',
            user: updatedUser
        });
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi cập nhật hồ sơ' });
    }
});

// API: Đổi Mật Khẩu (Kiểm tra mật khẩu cũ & mã hóa mật khẩu mới)
app.put('/api/users/change-password/:id', authMiddleware, ownAccount('id'), async (req, res) => {
    try {
        const { id } = req.params;
        const { old_password, new_password } = req.body;
        if (typeof new_password !== 'string' || new_password.length < 8 || Buffer.byteLength(new_password) > 72) v.fail('Mật khẩu mới phải có ít nhất 8 ký tự và tối đa 72 byte.');
        if (!old_password || !new_password) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!' });
        }
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);
        await user.update({ password: hashedPassword, tokenVersion: user.tokenVersion + 1 });
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi đổi mật khẩu' });
    }
});

// API: Thống kê Dashboard cho Admin
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        // Đếm tổng số ca và đếm số ca theo từng trạng thái từ CSDL
        const totalApts = await Appointment.count();
        const completedCount = await Appointment.count({ where: { status: 'completed' } });
        const confirmedCount = await Appointment.count({ where: { status: 'confirmed' } });
        const pendingCount = await Appointment.count({ where: { status: 'pending' } });
        const cancelledCount = await Appointment.count({ where: { status: 'cancelled' } });
        const arrivedCount=await Appointment.count({where:{status:'arrived'}});
        const inProgressCount=await Appointment.count({where:{status:'in_progress'}});
        const noShowCount=await Appointment.count({where:{status:'no_show'}});
        // Tính Tỷ lệ khám thành công %
        const successRate = totalApts > 0 ? Math.round((completedCount / totalApts) * 100) : 0;
        // Đếm số ca khám phân bổ theo từng Chuyên khoa từ CSDL
        const specialties = await Specialty.findAll();
        const specialtyStats = await Promise.all(
            specialties.map(async (spec) => {
                const count = await Appointment.count({ where: { specialtyId: spec.id } });
                const percentage = totalApts > 0 ? Math.round((count / totalApts) * 100) : 0;
                return { id: spec.id, name: spec.name, count, percentage };
            })
        );
        // Lấy 5 lịch hẹn mới nhất để hiển thị bảng
        const recentAppointments = await Appointment.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Specialty, attributes: ['id', 'name'] },
                {
                    model: DoctorInfo,
                    attributes: ['id', 'degree', 'roomNumber'],
                    include: [{ model: User, attributes: ['full_name'] }]
                }
            ]
        });

        res.json({
            totalApts, arrivedCount, inProgressCount, noShowCount,
            completedCount,
            confirmedCount,
            pendingCount,
            cancelledCount,
            successRate,
            specialtyStats,
            recentAppointments
        });
    } catch (error) {
        console.error('Lỗi tính toán thống kê dashboard:', error);
        res.status(error?.status || 500).json({ message: error.status ? error.message : 'Lỗi server khi tính toán thống kê' });
    }
});

app.get('/', (req, res) => res.send('Server đang chạy...'));



app.post('/api/patient/claim-booking', authMiddleware, checkRole(['patient']), async (req, res, next) => {
    try {
        const { createHash } = require('node:crypto');
        if (typeof req.body.code !== 'string' || !/^[a-f0-9]{32}$/.test(req.body.code) || typeof req.body.phone !== 'string') v.fail('Mã nhận lịch hoặc số điện thoại không đúng.');
        await sequelize.transaction(async transaction => {
            const appointment = await Appointment.findOne({ where: { claimCodeHash: createHash('sha256').update(req.body.code).digest('hex'), patient_phone: req.body.phone, userId: null }, transaction, lock: transaction.LOCK.UPDATE });
            if (!appointment) v.fail('Mã nhận lịch hoặc số điện thoại không đúng.', 404);
            await appointment.update({ userId: req.user.id, claimCodeHash: null }, { transaction });
            await MedicalRecord.update({ patientId: req.user.id }, { where: { appointmentId: appointment.id }, transaction });
        });
        res.json({ message: 'Đã thêm lịch vào tài khoản.' });
    } catch (error) { next(error); }
});

app.get('/api/medical-records/:id/audit', authMiddleware, checkRole(['admin', 'doctor']), async (req, res, next) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id);
        if (!record) v.fail('Không tìm thấy bệnh án.', 404);
        await appointmentService.allowedDoctor(req.user, record.doctorId);
        res.json(await require('../models/MedicalRecordAudit').findAll({ where: { medicalRecordId: record.id }, order: [['createdAt', 'DESC'], ['id', 'DESC']] }));
    } catch (error) { next(error); }
});

module.exports = app;
