const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../index');
const sequelize = require('../db');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const DoctorInfo = require('../models/DoctorInfo');
const Appointment = require('../models/Appointment');

const integration = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;
integration('Test các chức năng cơ bản', () => {
    let adminToken, patientToken;
    let testAdminUser, testDoctorUser, testPatientUser;
    let testSpecialty, testDoctorInfo;
    let createdAppointmentIds = [];
    let createdUserIds = [];
    let createdSpecialtyIds = [];

    const { jwtSecret: secretKey } = require('../config/security');
    const timestamp = Date.now();

    beforeAll(async () => {
        await require('../migrations').migrate();
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
            const Record = require('../models/MedicalRecord');
            const Audit = require('../models/MedicalRecordAudit');
            const ops = require('../models/Operations');
            await ops.Notification.destroy({ where: { appointmentId: createdAppointmentIds } });
            await ops.AppointmentEvent.destroy({ where: { appointmentId: createdAppointmentIds } });
            const records = await Record.findAll({ where: { appointmentId: createdAppointmentIds } });
            if (records.length) await Audit.destroy({ where: { medicalRecordId: records.map(record => record.id) } });
            await Record.destroy({ where: { appointmentId: createdAppointmentIds } });
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
    const testBookingDate = '2099-01-05';
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

        expect(res.statusCode).toBe(409);
    });

    // 8. Gọi API Dashboard Admin -> kiểm tra trả về dữ liệu thống kê hợp lệ
    test('8. GET /api/admin/dashboard-stats - Trả về thống kê CSDL hợp lệ', async () => {
        const res = await request(app).get('/api/admin/dashboard-stats').set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('totalApts');
        expect(res.body).toHaveProperty('completedCount');
        expect(res.body).toHaveProperty('successRate');
        expect(res.body).toHaveProperty('specialtyStats');
    });

    test('9. Concurrent bookings allow exactly one winner on MySQL', async () => {
        const payload = { patient_name: 'Concurrent Test', patient_phone: '0912345678', doctorId: testDoctorInfo.id, specialtyId: testSpecialty.id, appointment_date: testBookingDate, time_slot: '14:00 - 14:30' };
        const responses = await Promise.all([request(app).post('/api/appointments').send(payload), request(app).post('/api/appointments').send(payload)]);
        for (const response of responses) if (response.status === 201) createdAppointmentIds.push(response.body.data.id);
        expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
        expect(await Appointment.count({ where: { doctorId: testDoctorInfo.id, appointment_date: testBookingDate, time_slot: payload.time_slot } })).toBe(1);
    });

    test('10. Guest booking can only be claimed once with code and matching phone', async () => {
        const payload = { patient_name: 'Guest Test', patient_phone: '0912345678', doctorId: testDoctorInfo.id, specialtyId: testSpecialty.id, appointment_date: testBookingDate, time_slot: '15:00 - 15:30', userId: testPatientUser.id };
        const booked = await request(app).post('/api/appointments').send(payload);
        expect(booked.status).toBe(201);
        createdAppointmentIds.push(booked.body.data.id);
        expect(booked.body.data.userId).toBe(null);
        expect(booked.body.data.claimCodeHash).toBeUndefined();
        const claim = { code: booked.body.data.bookingCode, phone: payload.patient_phone };
        const bad = await request(app).post('/api/patient/claim-booking').set('Authorization', `Bearer ${patientToken}`).send({ ...claim, phone: '0987654321' });
        expect(bad.status).toBe(404);
        const success = await request(app).post('/api/patient/claim-booking').set('Authorization', `Bearer ${patientToken}`).send(claim);
        expect(success.status).toBe(200);
        expect((await Appointment.findByPk(booked.body.data.id)).userId).toBe(testPatientUser.id);
        expect((await request(app).post('/api/patient/claim-booking').set('Authorization', `Bearer ${patientToken}`).send(claim)).status).toBe(404);
    });

    test('11. MySQL rolls back appointment, record and audit when audit save fails', async () => {
        const Record = require('../models/MedicalRecord');
        const Audit = require('../models/MedicalRecordAudit');
        const appointment = await Appointment.create({ patient_name: 'Rollback Test', patient_phone: '0912345678', doctorId: testDoctorInfo.id, specialtyId: testSpecialty.id, appointment_date: '2020-01-01', time_slot: testTimeSlot, status: 'confirmed', userId: testPatientUser.id });
        createdAppointmentIds.push(appointment.id);
        const spy = jest.spyOn(Audit, 'create').mockRejectedValue(new Error('Simulated audit storage failure'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const response = await request(app).post('/api/medical-records').set('Authorization', `Bearer ${adminToken}`).send({ appointmentId: appointment.id, diagnosis: 'Test rollback' });
            expect(response.status).toBe(500);
            expect((await Appointment.findByPk(appointment.id)).status).toBe('confirmed');
            expect(await Record.count({ where: { appointmentId: appointment.id } })).toBe(0);
        } finally { spy.mockRestore(); consoleSpy.mockRestore(); }
    });

    test('12. Admin filters and paginates appointments on MySQL', async () => {
        const response = await request(app).get('/api/appointments').set('Authorization', `Bearer ${adminToken}`).query({ page: 1, limit: 1, doctorId: testDoctorInfo.id, date: testBookingDate, search: 'Concurrent' });
        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].patient_name).toBe('Concurrent Test');
        expect(response.body.items[0].claimCodeHash).toBeUndefined();
    });

    test('13. Schedule edits cannot invalidate existing future appointments', async () => {
        const response = await request(app).put(`/api/doctors/${testDoctorInfo.id}/schedule`).set('Authorization', `Bearer ${adminToken}`).send({ version: 1, weekdays: [1, 2, 3, 4, 5, 6], timeSlots: [testTimeSlot], daysOff: [testBookingDate] });
        expect(response.status).toBe(400);
        expect((await DoctorInfo.findByPk(testDoctorInfo.id)).workSchedule).toBe(null);
    });

    test('14. Successful examination derives IDs, completes appointment and records audit', async () => {
        const Record = require('../models/MedicalRecord');
        const Audit = require('../models/MedicalRecordAudit');
        const appointment = await Appointment.create({ patient_name: 'Record Success Test', patient_phone: '0912345678', doctorId: testDoctorInfo.id, specialtyId: testSpecialty.id, appointment_date: '2020-01-02', time_slot: testTimeSlot, status: 'confirmed', userId: testPatientUser.id });
        createdAppointmentIds.push(appointment.id);
        const response = await request(app).post('/api/medical-records').set('Authorization', `Bearer ${adminToken}`).send({ appointmentId: appointment.id, patientId: 999999, doctorId: 999999, diagnosis: 'Test examination', prescriptionItems: [{ name: 'Test medication', dosage: 'Test dose', frequency: 'Test frequency', duration: 'Test duration', instructions: '' }] });
        expect(response.status).toBe(201);
        const record = await Record.findByPk(response.body.data.id);
        expect(record.doctorId).toBe(testDoctorInfo.id);
        expect(record.patientId).toBe(testPatientUser.id);
        expect(record.prescriptionItems).toHaveLength(1);
        expect((await Appointment.findByPk(appointment.id)).status).toBe('completed');
        expect(await Audit.count({ where: { medicalRecordId: record.id } })).toBe(1);
        expect((await request(app).get(`/api/medical-records/${record.id}/audit`).set('Authorization', `Bearer ${patientToken}`)).status).toBe(403);
        expect((await request(app).get(`/api/medical-records/${record.id}/audit`).set('Authorization', `Bearer ${adminToken}`)).body).toHaveLength(1);
    });
});
