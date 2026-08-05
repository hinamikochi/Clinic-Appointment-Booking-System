const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./db');
const User = require('./models/User');
const Specialty = require('./models/Specialty');
const DoctorInfo = require('./models/DoctorInfo');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


User.hasOne(DoctorInfo, { foreignKey: 'userId' });
DoctorInfo.belongsTo(User, { foreignKey: 'userId' });
Specialty.hasMany(DoctorInfo, { foreignKey: 'specialtyId' });
DoctorInfo.belongsTo(Specialty, { foreignKey: 'specialtyId' });

// Tự động tạo bảng
sequelize.sync({ alter: true })
    .then(() => console.log('✅ Database & Tables synced!'))
    .catch(err => console.error('❌ Sync error:', err));

// API Đăng ký (Register) 
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'Email da ton tai!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            full_name, email, password: hashedPassword, role
        });

        res.status(201).json({ message: 'Dang ky thanh cong!', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: 'Loi server.' });
    }
});

app.get('/', (req, res) => res.send('Server dang chay...'));


const jwt = require('jsonwebtoken');

// API Đăng nhập (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Tìm người dùng theo email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // 2. Kiểm tra mật khẩu (So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // 3. Tạo Token (JWT) - Để người dùng có thể làm các việc khác mà không cần đăng nhập lại
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' } // Token có tác dụng trong 1 ngày
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: { id: user.id, full_name: user.full_name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// API Lấy danh sách chuyên khoa
app.get('/api/specialties', async (req, res) => {
    try {
        const list = await Specialty.findAll();
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách chuyên khoa.' });
    }
});

app.post('/api/specialties', async (req, res) => {
    try {
        const { name, description, image } = req.body;
        const newSpecialty = await Specialty.create({ name, description, image });
        res.status(201).json({ message: 'Chuyên khoa mới đã được tạo!', data: newSpecialty });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo chuyên khoa mới.' });
    }
});


// API Lấy danh sách bác sĩ (User có role = 'doctor')
app.get('/api/users/doctors', async (req, res) => {
    const doctors = await User.findAll({ 
        where: { role: 'doctor' }, 
        attributes: ['id', 'full_name'] 
    });
    res.json(doctors);
});

// API Lấy danh sách bác sĩ
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await DoctorInfo.findAll({
            include: [
                { model: User, attributes: ['id', 'full_name', 'email'] },
                { model: Specialty, attributes: ['id', 'name'] }
            ]
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ' });
    }
});

// Chức năng tạo mới bác sĩ cho admin
app.post('/api/admin/doctors', async (req, res) => {
    try {
        const { full_name, email, password, specialtyId, degree, image, description } = req.body;

        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'Email này đã tồn tại!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            full_name,
            email,
            password: hashedPassword,
            role: 'doctor'
        });

        await DoctorInfo.create({
            userId: newUser.id,
            specialtyId,
            degree,
            image,
            description
        });

        res.status(201).json({ message: 'Tạo tài khoản bác sĩ thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi tạo bác sĩ' });
    }
});

// API Cập nhật chuyên khoa
app.put('/api/specialties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image } = req.body;
        const specialty = await Specialty.findByPk(id);
        if (!specialty) return res.status(404).json({ message: 'Không tìm thấy chuyên khoa!' });

        await specialty.update({ name, description, image });
        res.json({ message: 'Cập nhật chuyên khoa thành công!', data: specialty });
    } catch (error) {
        console.error('Lỗi cập nhật chuyên khoa:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật chuyên khoa.' });
    }
});

// API Xóa chuyên khoa
app.delete('/api/specialties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const specialty = await Specialty.findByPk(id);
        if (!specialty) return res.status(404).json({ message: 'Không tìm thấy chuyên khoa!' });

        // Kiểm tra xem có bác sĩ nào thuộc chuyên khoa này không
        const docCount = await DoctorInfo.count({ where: { specialtyId: id } });
        if (docCount > 0) {
            return res.status(400).json({ message: `Không thể xóa! Có ${docCount} bác sĩ đang thuộc chuyên khoa này.` });
        }

        await specialty.destroy();
        res.json({ message: 'Đã xóa chuyên khoa thành công!' });
    } catch (error) {
        console.error('Lỗi xóa chuyên khoa:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa chuyên khoa.' });
    }
});

// API Cập nhật thông tin bác sĩ cho Admin
app.put('/api/admin/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params; // DoctorInfo id
        const { full_name, email, specialtyId, degree, image, description } = req.body;

        const doctorInfo = await DoctorInfo.findByPk(id, { include: [User] });
        if (!doctorInfo) return res.status(404).json({ message: 'Không tìm thấy thông tin bác sĩ!' });

        // Cập nhật thông tin User liên kết
        if (doctorInfo.User) {
            await doctorInfo.User.update({ full_name, email });
        }

        // Cập nhật DoctorInfo
        await doctorInfo.update({ specialtyId, degree, image, description });

        res.json({ message: 'Cập nhật thông tin bác sĩ thành công!' });
    } catch (error) {
        console.error('Lỗi cập nhật bác sĩ:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật bác sĩ.' });
    }
});

// API Xóa bác sĩ cho Admin
app.delete('/api/admin/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params; // DoctorInfo id
        const doctorInfo = await DoctorInfo.findByPk(id);
        if (!doctorInfo) return res.status(404).json({ message: 'Không tìm thấy thông tin bác sĩ!' });

        const userId = doctorInfo.userId;
        await doctorInfo.destroy();
        if (userId) {
            await User.destroy({ where: { id: userId } });
        }

        res.json({ message: 'Đã xóa bác sĩ và tài khoản liên quan thành công!' });
    } catch (error) {
        console.error('Lỗi xóa bác sĩ:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa bác sĩ.' });
    }
});

const PORT = 5001;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});

// Bắt lỗi nếu cổng 5001 đang bị ứng dụng khác chiếm
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Cổng ${PORT} đã bị chiếm dụng! Hãy tắt tiến trình cũ rồi thử lại.`);
    } else {
        console.error('❌ Lỗi Server:', err);
    }
});