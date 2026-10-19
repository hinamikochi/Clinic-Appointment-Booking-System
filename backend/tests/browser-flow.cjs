// Run against dedicated local test servers, never the operational database.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
if (!/^[a-zA-Z0-9_]+_test$/.test(process.env.TEST_DB_NAME || '')) throw Error('Set TEST_DB_NAME ending in _test.');
process.env.DB_NAME = process.env.TEST_DB_NAME;
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/DoctorInfo');
const Specialty = require('../models/Specialty');
const Appointment = require('../models/Appointment');
const Record = require('../models/MedicalRecord');
const Audit = require('../models/MedicalRecordAudit');
const ops = require('../models/Operations');
const v = require('../validators/clinic');
const base = 'http://localhost:5175', apiBase = 'http://localhost:5003';
const secret = 'clinic-browser-test-secret-at-least-32-characters';
const files = path.join(os.tmpdir(), 'clinic-operations-browser'); fs.mkdirSync(files, { recursive: true });
let socket, nextId = 0; const pending = new Map(), errors = [];
async function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++nextId; const timer = setTimeout(() => { pending.delete(id); reject(Error(`${method} timed out`)); }, 15000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(expression) { for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await pause(100); } throw Error(`Condition not met: ${expression}`); }
async function go(route, width = 1440, height = 900) { await send('Emulation.setDeviceMetricsOverride', { width, height, screenWidth: width, screenHeight: height, deviceScaleFactor: 1, mobile: width < 600 }); await send('Page.navigate', { url: base + route }); await until(`document.readyState === 'complete' && !!document.querySelector('#root')`); await pause(500); }
async function field(selector, value) { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input '+${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`); await pause(80); }
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await pause(200); }
async function screenshot(name) { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(files, `${name}.png`), Buffer.from(r.data, 'base64')); }
async function auth(user) { await go('/'); const token = jwt.sign({ id: user.id, role: user.role, tokenVersion: user.tokenVersion }, secret, { expiresIn: '20m' }); await evaluate(`localStorage.clear();localStorage.setItem('token',${JSON.stringify(token)});localStorage.setItem('user',${JSON.stringify(JSON.stringify({ id: user.id, role: user.role, full_name: user.full_name, email: user.email }))})`); await go(`/${user.role}`); }
const createdUsers = []; let spec, doctor, appointmentId;
async function main() {
    await require('../migrations').migrate();
    const prefix = `browser_${Date.now()}`;
    const encrypted = await bcrypt.hash('browserTestPassword123', 4);
    async function create(role) { const user = await User.create({ full_name: `${prefix}_${role}`, email: `${prefix}_${role}@example.test`, password: encrypted, role }); createdUsers.push(user.id); return user; }
    const admin = await create('admin'), patient = await create('patient'), doctorUser = await create('doctor');
    spec = await Specialty.create({ name: prefix }); doctor = await Doctor.create({ userId: doctorUser.id, specialtyId: spec.id, consultationFee: 225000, roomNumber: 'Test room' });
    const pages = await (await fetch('http://127.0.0.1:9339/json/list')).json();
    const page = pages.find(p => p.type === 'page' && (p.url === 'about:blank' || p.url.startsWith(base)));
    if (!page) throw Error('Open a fresh headless Chrome tab on port 9339.');
    socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.onmessage = ({ data }) => { const msg = JSON.parse(data); if (msg.id && pending.has(msg.id)) { const entry = pending.get(msg.id); pending.delete(msg.id); clearTimeout(entry.timer); msg.error ? entry.reject(Error(msg.error.message)) : entry.resolve(msg.result); } if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text); };
    await send('Page.enable'); await send('Runtime.enable');
    await go('/', 390, 844); await until(`!!document.querySelector('.clinic-public-search input')`);
    assert.ok(await evaluate('document.documentElement.scrollWidth <= 390'), 'Mobile home must not overflow');
    await field('.clinic-public-search input', spec.name); await pause(200);
    await evaluate(`[...document.querySelectorAll('h3')].find(e=>e.textContent===${JSON.stringify(spec.name)}).parentElement.click()`);
    await until(`document.querySelectorAll('select').length>=4`);
    await until(`document.querySelectorAll('select')[1]?.value===${JSON.stringify(String(spec.id))}`);
    assert.equal(await evaluate(`document.querySelectorAll('select')[1].value`), String(spec.id), 'Specialty selection must survive opening dialog');
    assert.equal(await evaluate(`document.activeElement.closest('[role=dialog]')!==null`), true, 'Modal owns keyboard focus');
    assert.equal(await evaluate(`[...document.querySelectorAll('[role=dialog] input,[role=dialog] select,[role=dialog] textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).length`), 0, 'Every field has a label');
    await screenshot('mobile-booking');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await pause(150); assert.equal(await evaluate(`!!document.querySelector('[role=dialog]')`), false, 'Escape closes modal');
    console.log('PASS mobile layout, specialty forwarding, field labels and modal focus/Escape');

    await auth(patient); await go('/patient?tab=booking'); await until(`!!document.querySelector('.clinic-booking-form')`);
    // Select the fixture specialty/doctor using the actual React controls.
    const selects = await evaluate(`[...document.querySelectorAll('.clinic-booking-form select')].map(e=>({id:e.id,options:[...e.options].map(o=>({value:o.value,text:o.textContent}))}))`);
    const specSelect = selects.find(e => e.options.some(o => o.value === String(spec.id) && o.text === spec.name));
    await field(`#${specSelect.id}`, String(spec.id));
    const tomorrow = new Date(Date.now() + 86400000); while (tomorrow.getUTCDay() === 0) tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); const date = tomorrow.toISOString().slice(0, 10);
    const nameId = await evaluate(`document.querySelector('.clinic-booking-form input[id="patientdashboard-field-1"]')?.id`);
    await field(`#${nameId}`, `${prefix}_patient`);
    const phoneId = await evaluate(`document.querySelector('.clinic-booking-form input[placeholder^="0912"]')?.id`);
    await field(`#${phoneId}`, '0912345678');
    await field('.clinic-booking-form input[type=number]', '35');
    await field('.clinic-booking-form .clinic-flex-wrap select', 'Khác');
    await field('.clinic-booking-form input[type=date]', date);
    await until(`[...document.querySelector('select[aria-label="Khung giờ khám"]').options].some(o=>o.value&&!o.disabled)`);
    const slot = await evaluate(`[...document.querySelector('select[aria-label="Khung giờ khám"]').options].find(o=>o.value&&!o.disabled).value`);
    await field('select[aria-label="Khung giờ khám"]', slot);
    await click('.clinic-booking-form button[type=submit]');
    await until(`!!document.querySelector('.clinic-modal')`);
    const appointment = await Appointment.findOne({ where: { userId: patient.id, doctorId: doctor.id }, order: [['id', 'DESC']] }); assert.ok(appointment, 'UI creates appointment'); appointmentId = appointment.id;
    await screenshot('patient-receipt'); assert.equal(appointment.status, 'pending');
    console.log('PASS patient booking creates pending appointment and durable receipt');

    await auth(admin); await go(`/admin?tab=appointments&q=${encodeURIComponent(prefix)}`); await until(`[...document.querySelectorAll('tbody tr button')].some(e=>e.textContent.trim()==='Duyệt')`);
    await evaluate(`[...document.querySelectorAll('tbody tr button')].find(e=>e.textContent.trim()==='Duyệt').click()`); await pause(500); assert.equal((await Appointment.findByPk(appointmentId)).status, 'confirmed');
    await screenshot('admin-confirmed');
    // Simulate arrival day without waiting overnight. Only this isolated test row changes.
    await Appointment.update({ appointment_date: v.clinicDate(), time_slot: '00:00 - 00:30', activeSlot: `${doctor.id}|${v.clinicDate()}|00:00 - 00:30` }, { where: { id: appointmentId } });
    await auth(doctorUser); await until(`!!document.querySelector('tbody tr button')`);
    await evaluate(`[...document.querySelectorAll('tbody tr button')].find(e=>e.textContent==='Tiếp nhận').click()`); await pause(400);
    await evaluate(`[...document.querySelectorAll('tbody tr button')].find(e=>e.textContent.includes('Khám Bệnh')).click()`);
    await until(`!!document.querySelector('form textarea')`);
    await field('form textarea', 'Browser flow diagnosis');
    await evaluate(`[...document.querySelectorAll('form button')].find(e=>e.textContent==='Lưu bản nháp').click()`); await pause(300); assert.equal(await ops.RecordDraft.count({ where: { appointmentId } }), 1);
    await click('form button[type=submit]'); await pause(600); assert.equal((await Appointment.findByPk(appointmentId)).status, 'completed');
    console.log('PASS admin confirmation, doctor arrival, draft save and examination completion');
    await auth(patient); await go('/patient?group=history'); await until(`!!document.querySelector('tbody tr button')`);
    await evaluate(`[...document.querySelectorAll('tbody tr button')].find(e=>e.textContent.includes('Xem Chẩn Đoán')).click()`); await pause(250);
    assert.ok(await evaluate(`document.body.textContent.includes('Browser flow diagnosis')`)); await screenshot('patient-result');
    await go('/patient?tab=patients', 390, 844); await until(`!!document.querySelector('form')`); await send('Page.reload'); await pause(700); assert.ok(await evaluate(`location.search.includes('tab=patients')`));
    assert.deepEqual(errors, [], 'No uncaught browser exceptions');
    console.log('PASS patient reads result, URL state survives reload; no uncaught browser errors');
    console.log(`Screenshots: ${files}`);
}
async function cleanup() {
    if (socket?.readyState === WebSocket.OPEN) { await evaluate('localStorage.clear();sessionStorage.clear()').catch(() => {}); socket.close(); }
    const ids = doctor ? (await Appointment.findAll({ where: { doctorId: doctor.id }, attributes: ['id'] })).map(a => a.id) : [];
    const records = await Record.findAll({ where: { appointmentId: ids } }); await Audit.destroy({ where: { medicalRecordId: records.map(r => r.id) } }); await Record.destroy({ where: { appointmentId: ids } });
    for (const model of [ops.Notification, ops.AppointmentEvent, ops.RecordDraft]) await model.destroy({ where: { appointmentId: ids } });
    await ops.Notification.destroy({ where: { userId: createdUsers } }); await Appointment.destroy({ where: { id: ids } });
    if (doctor) await doctor.destroy(); if (spec) await spec.destroy(); await User.destroy({ where: { id: createdUsers } }); await db.close();
}
main().catch(async error => { console.error(error.stack); if (socket?.readyState === WebSocket.OPEN) { await screenshot('failure'); console.error(await evaluate(`JSON.stringify({url:location.href,width:innerWidth,scroll:document.documentElement.scrollWidth,media:matchMedia('(max-width:600px)').matches,errors:document.body.innerText.slice(0,120),offenders:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>391).slice(-10).map(e=>({tag:e.tagName,rect:e.getBoundingClientRect().toJSON(),style:e.getAttribute('style')}))})`)); } process.exitCode = 1; }).finally(cleanup);
