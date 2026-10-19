const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const app = require('../index');
const { jwtSecret } = require('../config/security');
const User = require('../models/User');
const Doctor = require('../models/DoctorInfo');
const Specialty = require('../models/Specialty');
const Appointment = require('../models/Appointment');
const Record = require('../models/MedicalRecord');
const Audit = require('../models/MedicalRecordAudit');
const ops = require('../models/Operations');
const v = require('../validators/clinic');
const integration = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;
integration('Clinic operations on isolated MySQL', () => {
    let admin, patient, other, doctorUser, doctor, spec;
    const appointments = [], users = [], profiles = [];
    const password = 'testPassword123';
    const token = user => jwt.sign({ id: user.id, role: user.role, tokenVersion: user.tokenVersion || 0 }, jwtSecret);
    const api = user => ({ get: path => request(app).get(path).set('Authorization', `Bearer ${token(user)}`), post: path => request(app).post(path).set('Authorization', `Bearer ${token(user)}`), put: path => request(app).put(path).set('Authorization', `Bearer ${token(user)}`) });
    const payload = (slot, extras = {}) => ({ patient_name: 'Ops Test', patient_phone: '0912345678', patient_age: 35, patient_gender: 'Khác', doctorId: doctor.id, specialtyId: spec.id, appointment_date: '2099-01-05', time_slot: slot, ...extras });
    async function book(slot, extras) { const res = await api(patient).post('/api/appointments').send(payload(slot, extras)); if (res.body.data?.id) appointments.push(res.body.data.id); expect(res.status).toBe(201); return res.body.data; }
    beforeAll(async () => {
        await require('../migrations').migrate();
        const prefix = `ops_${Date.now()}`;
        const hash = await bcrypt.hash(password, 4);
        async function user(role, suffix) { const row = await User.create({ full_name: 'Ops Test', email: `${prefix}_${suffix}@example.test`, password: hash, role }); users.push(row.id); return row; }
        admin = await user('admin', 'admin'); patient = await user('patient', 'patient'); other = await user('patient', 'other'); doctorUser = await user('doctor', 'doctor');
        spec = await Specialty.create({ name: prefix }); doctor = await Doctor.create({ userId: doctorUser.id, specialtyId: spec.id, consultationFee: 250000 });
    });
    afterAll(async () => {
        const records = await Record.findAll({ where: { appointmentId: appointments } });
        await Audit.destroy({ where: { medicalRecordId: records.map(r => r.id) } });
        await Record.destroy({ where: { appointmentId: appointments } });
        for (const model of [ops.RecordDraft, ops.AppointmentEvent, ops.Notification]) await model.destroy({ where: { appointmentId: appointments } });
        await ops.Notification.destroy({ where: { userId: users } });
        await ops.PasswordReset.destroy({ where: { userId: users } });
        await ops.EmailDelivery.destroy({ where: { recipient: { [require('sequelize').Op.like]: 'ops_%@example.test' } } });
        await Appointment.destroy({ where: { id: appointments } });
        await ops.PatientProfile.destroy({ where: { ownerId: users } });
        await Doctor.destroy({ where: { id: doctor.id } }); await Specialty.destroy({ where: { id: spec.id } }); await User.destroy({ where: { id: users } }); await db.close();
    });

    test('booking profile belongs to owner; account is not patient identity', async () => {
        const res = await api(patient).post('/api/patient-profiles').send({ fullName: 'Relative Test', birthDate: '2000-06-15', gender: 'Khác', phone: '0912345678', allergies: 'Test allergy', medicalHistory: 'Test history' });
        expect(res.status).toBe(201); profiles.push(res.body.id);
        const forbidden = await api(other).post('/api/appointments').send(payload('08:00 - 08:30', { patientProfileId: res.body.id })); expect(forbidden.status).toBe(404);
        const apt = await book('08:00 - 08:30', { patientProfileId: res.body.id }); expect(apt.patient_name).toBe('Relative Test'); expect(apt.patientProfileId).toBe(res.body.id); expect(apt.userId).toBe(patient.id);
    });
    test('retrying same request creates exactly one appointment; changed payload is rejected', async () => {
        const key = require('crypto').randomUUID(); const body = payload('08:30 - 09:00', { requestKey: key });
        const responses = await Promise.all([api(patient).post('/api/appointments').send(body), api(patient).post('/api/appointments').send(body)]);
        responses.forEach(res => expect(res.status).toBe(201)); const ids = responses.map(res => res.body.data.id); appointments.push(...ids); expect(new Set(ids).size).toBe(1);
        expect((await api(patient).post('/api/appointments').send({ ...body, symptoms: 'changed' })).status).toBe(409);
    });
    test('rescheduling conflict keeps old booking; success releases original slot', async () => {
        const apt = await book('09:00 - 09:30');
        await book('09:30 - 10:00');
        const conflict = await api(patient).put(`/api/appointments/${apt.id}/reschedule`).send({ version: apt.version, appointment_date: apt.appointment_date, time_slot: '09:30 - 10:00', reason: 'Test conflict' });
        expect(conflict.status).toBe(409); expect((await Appointment.findByPk(apt.id)).time_slot).toBe('09:00 - 09:30');
        const moved = await api(patient).put(`/api/appointments/${apt.id}/reschedule`).send({ version: apt.version, appointment_date: apt.appointment_date, time_slot: '14:00 - 14:30', reason: 'Test change' });
        expect(moved.status).toBe(200); expect(moved.body.data.status).toBe('pending');
        expect((await api(patient).put(`/api/appointments/${apt.id}/reschedule`).send({ version: apt.version, appointment_date: apt.appointment_date, time_slot: '14:30 - 15:00', reason: 'Stale' })).status).toBe(409);
        const available = await request(app).get('/api/availability').query({ doctorId: doctor.id, date: apt.appointment_date }); expect(available.body.find(s => s.slot === '09:00 - 09:30').available).toBe(true);
    });
    test('cancellation requires reason, frees slot and creates durable notification', async () => {
        const apt = await book('14:30 - 15:00');
        expect((await api(patient).put(`/api/appointments/${apt.id}/cancel`).send({})).status).toBe(400);
        expect((await api(other).put(`/api/appointments/${apt.id}/cancel`).send({ reason: 'other' })).status).toBe(403);
        expect((await api(patient).put(`/api/appointments/${apt.id}/cancel`).send({ reason: 'Change of plans' })).status).toBe(200);
        expect((await Appointment.findByPk(apt.id)).activeSlot).toBe(null);
        expect(await ops.Notification.count({ where: { userId: patient.id, appointmentId: apt.id } })).toBeGreaterThanOrEqual(2);
        expect((await api(patient).get(`/api/appointments/${apt.id}/events`)).body.some(e => e.reason === 'Change of plans')).toBe(true);
    });
    test('pausing a doctor retains history and removes public availability', async () => {
        const paused = await api(admin).put(`/api/admin/doctors/${doctor.id}/availability`).send({ acceptingBookings: false, reason: 'Test pause', cancelAppointments: false }); expect(paused.status).toBe(200);
        const attempt = await api(patient).post('/api/appointments').send(payload('15:00 - 15:30')); expect(attempt.status).toBe(400);
        expect((await request(app).get('/api/doctors')).body.some(d => d.id === doctor.id)).toBe(false);
        expect((await api(admin).get('/api/admin/doctors')).body.some(d => d.id === doctor.id)).toBe(true);
        expect((await api(admin).put(`/api/admin/doctors/${doctor.id}/availability`).send({ acceptingBookings: true, reason: 'Resume' })).status).toBe(200);
    });
    test('draft and record versions reject another tab overwriting changes', async () => {
        const apt = await Appointment.create({ ...payload('08:00 - 08:30'), appointment_date: '2020-01-01', status: 'confirmed', userId: patient.id }); appointments.push(apt.id);
        expect((await api(patient).get(`/api/appointments/${apt.id}/draft`)).status).toBe(403);
        const draft = await api(doctorUser).put(`/api/appointments/${apt.id}/draft`).send({ version: 0, data: { diagnosis: 'Draft' } }); expect(draft.status).toBe(200);
        expect((await api(doctorUser).put(`/api/appointments/${apt.id}/draft`).send({ version: 0, data: { diagnosis: 'Stale' } })).status).toBe(409);
        const saved = await api(doctorUser).post('/api/medical-records').send({ appointmentId: apt.id, diagnosis: 'Final' }); expect(saved.status).toBe(201);
        expect((await api(doctorUser).post('/api/medical-records').send({ appointmentId: apt.id, version: 0, diagnosis: 'Stale' })).status).toBe(409);
        expect((await api(doctorUser).post('/api/medical-records').send({ appointmentId: apt.id, version: saved.body.data.version, diagnosis: 'Amendment' })).status).toBe(201);
        expect(await ops.RecordDraft.count({ where: { appointmentId: apt.id } })).toBe(0);
    });
    test('arrival and no-show are validated against appointment time', async () => {
        const apt = await Appointment.create({ ...payload('08:00 - 08:30'), appointment_date: v.clinicDate(), status: 'confirmed', userId: patient.id }); appointments.push(apt.id);
        expect((await api(admin).put(`/api/appointments/${apt.id}/status`).send({ status: 'arrived' })).status).toBe(200);
        expect((await Appointment.findByPk(apt.id)).status).toBe('arrived');
        const missed = await Appointment.create({ ...payload('08:00 - 08:30'), appointment_date: '2020-01-01', status: 'confirmed', userId: patient.id }); appointments.push(missed.id);
        expect((await api(admin).put(`/api/appointments/${missed.id}/status`).send({ status: 'no_show', reason: 'Did not attend' })).status).toBe(200);
    });
    test('account deactivation revokes existing sessions; self-lock is rejected', async () => {
        expect((await api(admin).put(`/api/admin/accounts/${admin.id}/active`).send({ isActive: false })).status).toBe(400);
        const old = token(other); expect((await api(admin).put(`/api/admin/accounts/${other.id}/active`).send({ isActive: false })).status).toBe(200);
        expect((await request(app).get('/api/notifications').set('Authorization', `Bearer ${old}`)).status).toBe(401);
        expect((await api(admin).put(`/api/admin/accounts/${other.id}/active`).send({ isActive: true })).status).toBe(200);
    });
    test('fake/unverified email does not send reset email; verified reset is one-use', async () => {
        const previous = process.env.SMTP_HOST; process.env.SMTP_HOST = 'test.invalid'; process.env.SMTP_FROM = 'clinic@example.test';
        try {
            const before = await ops.EmailDelivery.count();
            expect((await request(app).post('/api/forgot-password').send({ email: patient.email })).status).toBe(200);
            expect(await ops.EmailDelivery.count()).toBe(before);
            await patient.update({ emailVerified: true });
            expect((await request(app).post('/api/forgot-password').send({ email: patient.email })).status).toBe(200);
            const email = await ops.EmailDelivery.findOne({ where: { recipient: patient.email }, order: [['id', 'DESC']] }); const resetToken = email.body.match(/#([a-f0-9]{64})/)[1];
            const old = token(patient);
            expect((await request(app).post('/api/reset-password').send({ token: resetToken, password: 'newPassword123' })).status).toBe(200);
            expect((await request(app).post('/api/reset-password').send({ token: resetToken, password: 'newPassword123' })).status).toBe(400);
            expect((await request(app).get('/api/notifications').set('Authorization', `Bearer ${old}`)).status).toBe(401);
        } finally { if (previous) process.env.SMTP_HOST = previous; else delete process.env.SMTP_HOST; delete process.env.SMTP_FROM; }
    });
    test('email verification requires its owner and cannot be reused', async () => {
        const crypto = require('crypto');
        const raw = crypto.randomBytes(32).toString('hex');
        await patient.reload();
        await patient.update({ emailVerified: false });
        await ops.PasswordReset.create({ userId: patient.id, purpose: `email:${patient.email}`, tokenHash: crypto.createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 60000) });
        expect((await api(await User.findByPk(other.id)).post('/api/account/verify-email').send({ token: raw })).status).toBe(400);
        expect((await api(patient).post('/api/account/verify-email').send({ token: raw })).status).toBe(200);
        expect((await User.findByPk(patient.id)).emailVerified).toBe(true);
        expect((await api(patient).post('/api/account/verify-email').send({ token: raw })).status).toBe(400);
    });
    test('admin reset supports fake email and revokes existing sessions', async () => {
        const current = await User.findByPk(other.id);
        const oldToken = token(current);
        expect((await api(patient).post(`/api/admin/accounts/${other.id}/reset-password`)).status).toBe(403);
        const result = await api(admin).post(`/api/admin/accounts/${other.id}/reset-password`);
        expect(result.status).toBe(200);
        expect(await bcrypt.compare(result.body.temporaryPassword, (await User.findByPk(other.id)).password)).toBe(true);
        expect((await request(app).get('/api/notifications').set('Authorization', `Bearer ${oldToken}`)).status).toBe(401);
    });
    test('custom schedule validates overlap and rejects stale versions', async () => {
        expect(() => v.schedule({ weekdays: [1], daysOff: [], timeSlots: ['10:00 - 10:45', '10:30 - 11:00'] })).toThrow();
        const row = await Doctor.findByPk(doctor.id);
        const body = { version: row.scheduleVersion, weekdays: [1, 2, 3, 4, 5, 6], daysOff: [], timeSlots: [...v.TIME_SLOTS, '10:00 - 10:45'] };
        expect((await api(admin).put(`/api/doctors/${doctor.id}/schedule`).send(body)).status).toBe(200);
        expect((await api(admin).put(`/api/doctors/${doctor.id}/schedule`).send(body)).status).toBe(409);
    });
});
