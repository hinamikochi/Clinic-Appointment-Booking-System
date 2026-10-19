const bcrypt = require('bcryptjs');
const sequelize = require('../db');
const User = require('../models/User');
const { credentials } = require('../validators/clinic');
const { migrate } = require('../migrations');
async function main() {
    const data = credentials({ full_name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }, true);
    await migrate();
    if (await User.findOne({ where: { email: data.email } })) throw new Error('Email đã tồn tại; không tự động nâng quyền tài khoản.');
    await User.create({ ...data, password: await bcrypt.hash(data.password, 10), role: 'admin' });
    console.log('Đã tạo tài khoản quản trị.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => sequelize.close());
