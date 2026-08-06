const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sequelize = require('./db');
const User = require('./models/User');
const Specialty = require('./models/Specialty');
const DoctorInfo = require('./models/DoctorInfo');
const Appointment = require('./models/Appointment');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Thiết lập quan hệ các bảng trong MySQL
User.hasOne(DoctorInfo, { foreignKey: 'userId' });
DoctorInfo.belongsTo(User, { foreignKey: 'userId' });

Specialty.hasMany(DoctorInfo, { foreignKey: 'specialtyId' });
DoctorInfo.belongsTo(Specialty, { foreignKey: 'specialtyId' });

Specialty.hasMany(Appointment, { foreignKey: 'specialtyId' });
Appointment.belongsTo(Specialty, { foreignKey: 'specialtyId' });

DoctorInfo.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(DoctorInfo, { foreignKey: 'doctorId' });

User.hasMany(Appointment, { foreignKey: 'userId' });
Appointment.belongsTo(User, { foreignKey: 'userId' });

// Tự động đồng bộ bảng MySQL
sequelize.sync({ alter: true })
    .then(() => console.log('✅ Database & Tables synced!'))
    .catch(err => console.error('❌ Sync error:', err));

// API 1: Lấy thông tin tài khoản người dùng theo ID (Đồng bộ Email)
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['id', 'full_name', 'email', 'role'] });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API 2: Đăng ký (Register)
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            full_name, email, password: hashedPassword, role: role || 'patient'
        });

        res.status(201).json({ message: 'Đăng ký thành công!', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// API 3: Đăng nhập (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
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
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// CÁC API APPOINTMENTS (ĐÃ NÂNG CẤP THÔNG MINH)
// API 1: Bệnh nhân Đặt Lịch Khám Mới
app.post('/api/appointments', async (req, res) => {
    try {
        const { 
            patient_name, patient_phone, patient_gender, patient_age,
            specialtyId, doctorId, appointment_date, time_slot, symptoms, userId 
        } = req.body;

        if (!patient_name || !patient_phone || !specialtyId || !doctorId || !appointment_date || !time_slot) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
        }

        const newAppointment = await Appointment.create({
            patient_name,
            patient_phone,
            patient_gender: patient_gender || 'Nam',
            patient_age: patient_age || 30,
            specialtyId,
            doctorId,
            appointment_date,
            time_slot,
            symptoms: symptoms || 'Khám bệnh theo yêu cầu',
            status: 'pending',
            userId: userId || null
        });

        res.status(201).json({ message: 'Đặt lịch khám thành công!', data: newAppointment });
    } catch (error) {
        console.error('Lỗi đặt lịch khám:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo lịch hẹn' });
    }
});

// API 2: Lấy Lịch Hẹn Của Bệnh Nhân (Tìm thông minh theo userId HOẶC theo Tên Bệnh Nhân)
app.get('/api/patient/appointments/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        
        let whereCondition = { userId };
        if (user) {
            // Tự động tìm cả những lịch hẹn khớp với Tên Bệnh Nhân (VD: Trần Văn Bình)
            whereCondition = {
                [Op.or]: [
                    { userId: user.id },
                    { patient_name: user.full_name }
                ]
            };
        }

        const appointments = await Appointment.findAll({
            where: whereCondition,
            include: [
                { model: Specialty, attributes: ['id', 'name'] },
                { 
                    model: DoctorInfo, 
                    attributes: ['id', 'degree'],
                    include: [{ model: User, attributes: ['full_name', 'email'] }] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appointments);
    } catch (error) {
        console.error('Lỗi lấy lịch hẹn bệnh nhân:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách lịch hẹn cá nhân' });
    }
});

// API 3: Bệnh nhân Hủy Lịch Hẹn
app.put('/api/appointments/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const apt = await Appointment.findByPk(id);
        if (!apt) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });

        await apt.update({ status: 'cancelled' });
        res.json({ message: 'Đã hủy lịch hẹn thành công!', data: apt });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi hủy lịch hẹn' });
    }
});

// API 4: Admin Lấy Toàn Bộ Lịch Hẹn
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            include: [
                { model: Specialty, attributes: ['id', 'name'] },
                { 
                    model: DoctorInfo, 
                    attributes: ['id', 'degree'],
                    include: [{ model: User, attributes: ['full_name', 'email'] }] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách lịch hẹn' });
    }
});

// API 5: Admin Cập Nhật Trạng Thái Lịch Hẹn
app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const apt = await Appointment.findByPk(id);
        if (!apt) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });

        await apt.update({ status });
        res.json({ message: 'Cập nhật trạng thái thành công!', data: apt });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật' });
    }
});

// API Bác Sĩ & Chuyên Khoa
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await DoctorInfo.findAll({
            include: [
                { model: User, attributes: ['full_name', 'email', 'role'] },
                { model: Specialty, attributes: ['id', 'name'] }
            ]
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.get('/api/specialties', async (req, res) => {
    try {
        const specialties = await Specialty.findAll();
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.post('/api/specialties', async (req, res) => {
    try {
        const { name, description } = req.body;
        const newSpec = await Specialty.create({ name, description });
        res.status(201).json(newSpec);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo chuyên khoa.' });
    }
});

app.delete('/api/specialties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Specialty.destroy({ where: { id } });
        res.json({ message: 'Đã xóa chuyên khoa!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa chuyên khoa.' });
    }
});

app.post('/api/admin/doctors', async (req, res) => {
    try {
        const { full_name, email, password, specialtyId, degree, image, description } = req.body;
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            full_name, email, password: hashedPassword, role: 'doctor'
        });

        const newDoctorInfo = await DoctorInfo.create({
            userId: newUser.id,
            specialtyId,
            degree: degree || 'Bác sĩ',
            image: image || '',
            description: description || ''
        });

        res.status(201).json({ message: 'Tạo bác sĩ thành công!', data: newDoctorInfo });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo bác sĩ.' });
    }
});

app.get('/', (req, res) => res.send('Server đang chạy...'));

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`));