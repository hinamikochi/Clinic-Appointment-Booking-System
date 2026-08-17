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
const MedicalRecord = require('./models/MedicalRecord');
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

Appointment.hasOne(MedicalRecord, { foreignKey: 'appointmentId' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId' });

DoctorInfo.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
MedicalRecord.belongsTo(DoctorInfo, { foreignKey: 'doctorId' });

// Tự động đồng bộ bảng MySQL
sequelize.sync({ alter: true })
    .then(() => console.log('✅ Database & Tables synced!'))
    .catch(err => console.error('❌ Sync error:', err));

// API: Lấy thông tin tài khoản người dùng theo ID      
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['id', 'full_name', 'email', 'role'] });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API: Đăng ký (Register)
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

// API: Đăng nhập (Login)
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

// API: Bệnh nhân Đặt Lịch Khám Mới
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

// API: Lấy Lịch Hẹn Của Bệnh Nhân 
app.get('/api/patient/appointments/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByPk(userId);
        
        let whereCondition = { userId };
        if (user) {
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
                { model: MedicalRecord }, 
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

// API: Bệnh nhân Hủy Lịch Hẹn
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

// API: Admin Lấy Toàn Bộ Lịch Hẹn
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            include: [
                { model: Specialty, attributes: ['id', 'name'] },
                { model: MedicalRecord }, 
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
        console.error('Lỗi lấy danh sách lịch hẹn:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách lịch hẹn' });
    }
});

// API: Admin Cập Nhật Trạng Thái Lịch Hẹn
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


// API: Lấy thông tin chi tiết Bác sĩ theo userId tài khoản
app.get('/api/doctor/info/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const doctorInfo = await DoctorInfo.findOne({
            where: { userId },
            include: [
                { model: User, attributes: ['id', 'full_name', 'email'] },
                { model: Specialty, attributes: ['id', 'name'] }
            ]
        });
        if (!doctorInfo) return res.status(404).json({ message: 'Không tìm thấy thông tin Bác sĩ!' });
        res.json(doctorInfo);
    } catch (error) {
        console.error('Lỗi lấy thông tin bác sĩ:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API: Lấy danh sách lịch khám của Bác sĩ theo doctorId
app.get('/api/doctor/appointments/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
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
        res.status(500).json({ message: 'Lỗi lấy danh sách khám' });
    }
});

// API Lưu hồ sơ bệnh án
app.post('/api/medical-records', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { appointmentId, patientId, doctorId, diagnosis, prescription, advice, re_visit_date } = req.body;
        
        if (!appointmentId || !doctorId || !diagnosis) {
            await t.rollback(); 
            return res.status(400).json({ message: 'Vui lòng nhập chẩn đoán bệnh!' });
        }
        
        let record = await MedicalRecord.findOne({ where: { appointmentId }, transaction: t });
        if (record) {
            await record.update({ diagnosis, prescription, advice, re_visit_date }, { transaction: t });
        } else {
            record = await MedicalRecord.create({
                appointmentId,
                patientId: patientId || null,
                doctorId,
                diagnosis,
                prescription,
                advice,
                re_visit_date
            }, { transaction: t });
        }
        
        const appointment = await Appointment.findByPk(appointmentId, { transaction: t });
        if (appointment) {
            await appointment.update({ status: 'completed' }, { transaction: t });
        }
        
        await t.commit();
        res.status(201).json({ message: 'Lưu hồ sơ bệnh án thành công!', data: record });
    } catch (error) {
        await t.rollback();
        console.error('Lỗi lưu hồ sơ bệnh án', error);
        res.status(500).json({ message: 'Lỗi server khi lưu bệnh án' });
    }
});

// API: Cập nhật thông tin cá nhân
app.put('/api/users/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, gender, address } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        await user.update({
            full_name: full_name || user.full_name,
            phone: phone || user.phone,
            gender: gender || user.gender,
            address: address || user.address
        });
        res.json({ 
            message: 'Cập nhật thông tin cá nhân thành công!',
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ' });
    }
});

// API: Đổi Mật Khẩu (Kiểm tra mật khẩu cũ & mã hóa mật khẩu mới)
app.put('/api/users/change-password/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { old_password, new_password } = req.body;
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
        await user.update({ password: hashedPassword });
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
    }
});

app.get('/', (req, res) => res.send('Server đang chạy...'));

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`));