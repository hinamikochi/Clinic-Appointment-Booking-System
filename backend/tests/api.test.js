const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../index');
const sequelize = require('../db');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const DoctorInfo = require('../models/DoctorInfo');
const Appointment = require('../models/Appointment');

describe('Test các chức năng cơ bản', () => {
    let adminToken, patientToken;
    let testAdminUser, testDoctorUser, testPatientUser;
    let testSpecialty, testDoctorInfo;
    let createdAppointmentIds = [];
    let createdUserIds = [];
    let createdSpecialtyIds = [];

    const secretKey = process.env.JWT_SECRET || 'secret_key';
    const timestamp = Date.now();

    beforeAll(async () => {
        // 1. Tạo Chuyên khoa test độc lập
        testSpecialty = await Specialty.create({
            name: `Khoa Test Tuần Này ${timestamp}`,
            description: 'Chuyên khoa thử nghiệm tự động'
        });
        createdSpecialtyIds.push(testSpecialty.id);

        const salt = await bcrypt.genSalt(10);
        
        // 2. Tạo Admin User & Token
        const hashedAdminPass = await bcrypt.hash('admin123', salt);
        testAdminUser = await User.create({
            full_name: `Admin Test ${timestamp}`,
            email: `admin_weekly_${timestamp}@test.com`,
            password: hashedAdminPass,
            role: 'admin'
        });
        createdUserIds.push(testAdminUser.id);
        adminToken = jwt.sign({ id: testAdminUser.id, role: 'admin' }, secretKey, { expiresIn: '1d' });

        // 3. Tạo Doctor User & DoctorInfo
        const hashedDocPass = await bcrypt.hash('doc123', salt);
        testDoctorUser = await User.create({
            full_name: `BS. Test ${timestamp}`,
            email: `doc_weekly_${timestamp}@test.com`,
            password: hashedDocPass,
            role: 'doctor'
        });
        createdUserIds.push(testDoctorUser.id);

        testDoctorInfo = await DoctorInfo.create({
            userId: testDoctorUser.id,
            specialtyId: testSpecialty.id,
            degree: 'BSCKII'
        });

        // 4. Tạo Patient User & Token
        const hashedPatientPass = await bcrypt.hash('patient123', salt);
        testPatientUser = await User.create({
            full_name: `Bệnh Nhân Test ${timestamp}`,
            email: `patient_weekly_${timestamp}@test.com`,
            password: hashedPatientPass,
            role: 'patient'
        });
        createdUserIds.push(testPatientUser.id);
        patientToken = jwt.sign({ id: testPatientUser.id, role: 'patient' }, secretKey, { expiresIn: '1d' });
    });

    afterAll(async () => {
        // Clear dữ liệu test 
        try {
            if (createdAppointmentIds.length > 0) {
                await Appointment.destroy({ where: { id: createdAppointmentIds } });
            }
            if (testDoctorInfo) {
                await DoctorInfo.destroy({ where: { id: testDoctorInfo.id } });
            }
            if (createdSpecialtyIds.length > 0) {
                await Specialty.destroy({ where: { id: createdSpecialtyIds } });
            }
            if (createdUserIds.length > 0) {
                await User.destroy({ where: { id: createdUserIds } });
            }
        } catch (err) {
            console.error('Lỗi cleanup test:', err);
        } finally {
            await sequelize.close();
        }
    });

    // 1. Đăng nhập sai mật khẩu 
    test('1. POST /api/login - Đăng nhập sai mật khẩu', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: testAdminUser.email,
                password: 'wrong_password_xyz'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Email hoặc mật khẩu không đúng!');
    });

    // 2. Đăng nhập thành công 
    test('2. POST /api/login - Đăng nhập thành công', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: testAdminUser.email,
                password: 'admin123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', testAdminUser.email);
    });

    // 3. Gọi API yêu cầu xác thực nhưng không có JWT 
    test('3. POST /api/specialties - Không gửi Token', async () => {
        const res = await request(app)
            .post('/api/specialties')
            .send({ name: 'Khoa Mới Thiếu Token' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Truy cập bị từ chối. Vui lòng đăng nhập!');
    });

    // 4. User role không phù hợp gọi API Admin
    test('4. POST /api/specialties - Patient gọi API Admin', async () => {
        const res = await request(app)
            .post('/api/specialties')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({ name: 'Khoa Do Patient Tạo' });

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Bạn không có quyền thực hiện thao tác này!');
    });

    // 5. Lấy danh sách chuyên khoa 
    test('5. GET /api/specialties - Lấy danh sách chuyên khoa', async () => {
        const res = await request(app).get('/api/specialties');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    // 6. Đặt lịch khám với dữ liệu hợp lệ 
    const testBookingDate = '2026-11-20';
    const testTimeSlot = '09:00 - 09:30';

    test('6. POST /api/appointments - Đặt lịch hợp lệ', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .send({
                patient_name: 'Bệnh Nhân Test Đặt Lịch',
                patient_phone: '0912345678',
                patient_gender: 'Nam',
                patient_age: 30,
                specialtyId: testSpecialty.id,
                doctorId: testDoctorInfo.id,
                appointment_date: testBookingDate,
                time_slot: testTimeSlot,
                symptoms: 'Khám định kỳ',
                userId: testPatientUser.id
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Đặt lịch khám thành công!');
        expect(res.body.data).toHaveProperty('id');
        createdAppointmentIds.push(res.body.data.id);
    });

    // 7. Đặt trùng bác sĩ + ngày + khung giờ
    test('7. POST /api/appointments - Đặt trùng ca khám', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .send({
                patient_name: 'Bệnh Nhân Thứ Hai Đặt Trùng',
                patient_phone: '0988777666',
                patient_gender: 'Nữ',
                patient_age: 25,
                specialtyId: testSpecialty.id,
                doctorId: testDoctorInfo.id,
                appointment_date: testBookingDate,
                time_slot: testTimeSlot,
                symptoms: 'Khám lại'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain(`Bác sĩ đã có lịch hẹn vào khung giờ ${testTimeSlot} ngày ${testBookingDate}`);
    });

    // 8. Gọi API Dashboard Admin -> kiểm tra trả về dữ liệu thống kê hợp lệ 
    test('8. GET /api/admin/dashboard-stats - Trả về thống kê CSDL hợp lệ', async () => {
        const res = await request(app).get('/api/admin/dashboard-stats');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('totalApts');
        expect(res.body).toHaveProperty('completedCount');
        expect(res.body).toHaveProperty('successRate');
        expect(res.body).toHaveProperty('specialtyStats');
    });
});