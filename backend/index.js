const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./db');
const User = require('./models/User');
const Specialty = require('./models/Specialty');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

// API Lấy danh sách chuyên khoa
app.get('/api/specialties', async (req, res) => {
    try {
        const list = await Specialty.findAll();
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách chuyên khoa.' });
    }
});

app.get('/api/users/doctors', async (req, res) => {
    const doctors = await User.findAll({ where: { role: 'doctor' } });
    res.json(doctors);
});

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

app.post('/api/specialties', async (req, res) => {
    try {
        const { name, description, image } = req.body;
        const newSpecialty = await Specialty.create({ name, description, image });
        res.status(201).json({ message: 'Chuyên khoa mới đã được tạo!', data: newSpecialty });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo chuyên khoa mới.' });
    }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));