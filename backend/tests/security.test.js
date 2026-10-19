const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorInfo = require('../models/DoctorInfo');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const MedicalRecordAudit = require('../models/MedicalRecordAudit');
const sequelize = require('../db');
const { jwtSecret } = require('../config/security');
const app = require('../index');
const service = require('../services/appointments');
const v = require('../validators/clinic');

const patient = { id: 7, role: 'patient' };
const doctorUser = { id: 8, role: 'doctor' };
const token = user => jwt.sign(user, jwtSecret);
const booking = { patient_name: 'Nguyễn An', patient_phone: '0912345678', doctorId: 2, specialtyId: 1, appointment_date: '2099-01-05', time_slot: '09:00 - 09:30', patient_age: 30 };
beforeEach(() => jest.restoreAllMocks());
afterAll(() => sequelize.close());

test.each(['/api/users/7', '/api/appointments', '/api/patient/appointments/7', '/api/doctor/appointments/2', '/api/admin/dashboard-stats'])('private API requires authentication: %s', async path => {
    expect((await request(app).get(path)).status).toBe(401);
});
test('public registration ignores privileged role', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockResolvedValue({ id: 10 });
    const response = await request(app).post('/api/register').send({ full_name: 'Test', email: 'test@example.com', password: 'password123', role: 'admin' });
    expect(response.status).toBe(201);
    expect(create.mock.calls[0][0].role).toBe('patient');
    expect(create.mock.calls[0][0].password).not.toBe('password123');
});
test('patient cannot access another account', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(patient);
    expect((await request(app).get('/api/users/99').set('Authorization', `Bearer ${token(patient)}`)).status).toBe(403);
});
test('patient cannot update another profile', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(patient);
    expect((await request(app).put('/api/users/profile/99').set('Authorization', `Bearer ${token(patient)}`).send({ full_name: 'Changed' })).status).toBe(403);
});
test('database role overrides forged token role', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(patient);
    expect((await request(app).get('/api/admin/dashboard-stats').set('Authorization', `Bearer ${token({ ...patient, role: 'admin' })}`)).status).toBe(403);
});
test('invalid optional token does not silently create guest booking', async () => {
    expect((await request(app).post('/api/appointments').set('Authorization', 'Bearer invalid').send(booking)).status).toBe(401);
});
test('doctor cannot process another doctor appointment', async () => {
    jest.spyOn(DoctorInfo, 'findByPk').mockResolvedValue({ userId: 99 });
    await expect(service.allowedDoctor(doctorUser, 2)).rejects.toMatchObject({ status: 403 });
});
test('patient appointment list uses account ID only', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(patient);
    const list = jest.spyOn(Appointment, 'findAll').mockResolvedValue([]);
    expect((await request(app).get('/api/patient/appointments/7').set('Authorization', `Bearer ${token(patient)}`)).status).toBe(200);
    expect(list.mock.calls[0][0].where).toEqual({ userId: '7' });
});
test.each(['2000-01-01', '2026-02-30', 'invalid'])('reject invalid/past appointment date %s', date => {
    expect(() => v.booking({ ...booking, appointment_date: date })).toThrow();
});
test('Vietnam date does not follow UTC date at midnight', () => {
    expect(v.clinicDate(new Date('2026-10-18T18:00:00Z'))).toBe('2026-10-19');
});
test('same-day past slot rejected', () => {
    expect(v.futureSlot('2026-10-19', '09:00 - 09:30', new Date('2026-10-19T03:00:00Z'))).toBe(false);
});
test('days off exclude booking availability', () => {
    expect(v.worksOn({ workSchedule: { ...v.DEFAULT_SCHEDULE, daysOff: ['2099-01-05'] } }, '2099-01-05', booking.time_slot)).toBe(false);
});
test('doctor specialty mismatch rejected', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(callback => callback({ LOCK: { UPDATE: 'UPDATE' } }));
    jest.spyOn(DoctorInfo, 'findByPk').mockResolvedValue({ specialtyId: 99 });
    await expect(service.createBooking(booking, patient)).rejects.toMatchObject({ status: 400 });
});
test('booking stores server account ID and current fee', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(callback => callback({ LOCK: { UPDATE: 'UPDATE' } }));
    jest.spyOn(DoctorInfo, 'findByPk').mockResolvedValue({ specialtyId: 1, consultationFee: 250000 });
    jest.spyOn(Appointment, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(Appointment, 'create').mockImplementation(async data => data);
    await service.createBooking({ ...booking, userId: 99, consultationFee: 1 }, patient);
    expect(create.mock.calls[0][0]).toMatchObject({ userId: 7, consultationFee: 250000 });
});
test('guest cannot assign a patient account', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(callback => callback({ LOCK: { UPDATE: 'UPDATE' } }));
    jest.spyOn(DoctorInfo, 'findByPk').mockResolvedValue({ specialtyId: 1 });
    jest.spyOn(Appointment, 'findOne').mockResolvedValue(null);
    jest.spyOn(Appointment, 'create').mockImplementation(async data => data);
    expect((await service.createBooking({ ...booking, userId: 7 })).userId).toBe(null);
});
test('completed appointment cannot be reopened or cancelled', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(callback => callback({ LOCK: { UPDATE: 'UPDATE' } }));
    jest.spyOn(Appointment, 'findByPk').mockResolvedValue({ status: 'completed', doctorId: 2 });
    await expect(service.changeStatus(1, 'pending', { role: 'admin' })).rejects.toMatchObject({ status: 400 });
});
test('patient cannot cancel another patient appointment', async () => {
    jest.spyOn(sequelize, 'transaction').mockImplementation(callback => callback({ LOCK: { UPDATE: 'UPDATE' } }));
    jest.spyOn(Appointment, 'findByPk').mockResolvedValue({ status: 'pending', userId: 99 });
    await expect(service.changeStatus(1, 'cancelled', patient, true)).rejects.toMatchObject({ status: 403 });
});
test('record failure rejects entire transaction before completion', async () => {
    const tx = { LOCK: { UPDATE: 'UPDATE' } };
    let committed = false;
    jest.spyOn(sequelize, 'transaction').mockImplementation(async callback => { const value = await callback(tx); committed = true; return value; });
    const update = jest.fn();
    jest.spyOn(Appointment, 'findByPk').mockResolvedValue({ id: 1, status: 'confirmed', doctorId: 2, userId: 7, appointment_date: '2020-01-01', time_slot: booking.time_slot, update });
    jest.spyOn(MedicalRecord, 'findOne').mockResolvedValue(null);
    jest.spyOn(MedicalRecord, 'create').mockRejectedValue(new Error('DB write failed'));
    await expect(service.saveRecord({ appointmentId: 1, diagnosis: 'Test' }, { id: 1, role: 'admin' })).rejects.toThrow('DB write failed');
    expect(update).not.toHaveBeenCalled();
    expect(committed).toBe(false);
});
test('medical record derives ownership and audits the save in one transaction', async () => {
    const tx = { LOCK: { UPDATE: 'UPDATE' } };
    jest.spyOn(sequelize, 'transaction').mockImplementation(callback => callback(tx));
    jest.spyOn(Appointment, 'findByPk').mockResolvedValue({ id: 1, status: 'confirmed', doctorId: 2, userId: 7, appointment_date: '2020-01-01', time_slot: booking.time_slot, update: jest.fn() });
    jest.spyOn(MedicalRecord, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(MedicalRecord, 'create').mockImplementation(async data => ({ id: 5, ...data, toJSON: () => data }));
    const audit = jest.spyOn(MedicalRecordAudit, 'create').mockResolvedValue({});
    await service.saveRecord({ appointmentId: 1, doctorId: 99, patientId: 99, diagnosis: 'Test' }, { id: 1, role: 'admin' });
    expect(create.mock.calls[0][0]).toMatchObject({ doctorId: 2, patientId: 7, updatedBy: 1 });
    expect(audit.mock.calls[0][1]).toEqual({ transaction: tx });
});
