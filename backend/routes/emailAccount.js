const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const db = require('../db');
const User = require('../models/User');
const { PasswordReset, EmailDelivery } = require('../models/Operations');
const { authMiddleware: auth, checkRole } = require('../middlewares/auth');
const v = require('../validators/clinic');
const limit = require('../middlewares/rateLimit');

router.post('/api/account/email', auth, limit(5), async (req, res, next) => {
    try {
        const email = v.text(req.body.email, 'Email', 254, true).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) v.fail('Email không hợp lệ.');
        const user = await User.findByPk(req.user.id);
        if (typeof req.body.password !== 'string' || !await bcrypt.compare(req.body.password, user.password)) v.fail('Mật khẩu hiện tại không đúng.');
        const conflict = await User.findOne({ where: { email } });
        if (conflict && conflict.id !== user.id) v.fail('Email đã được sử dụng.');
        if (email !== user.email) await db.transaction(async transaction => {
            await user.update({ email, emailVerified: false }, { transaction });
            await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null }, transaction });
        });
        let sent = false;
        if (!user.emailVerified && process.env.SMTP_HOST && (process.env.SMTP_FROM || process.env.SMTP_USER)) {
            const token = crypto.randomBytes(32).toString('hex');
            await db.transaction(async transaction => {
                await PasswordReset.create({ userId: user.id, purpose: `email:${email}`, tokenHash: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 30 * 60000) }, { transaction });
                await EmailDelivery.create({ recipient: email, subject: 'Xác minh email MyClinic', body: `Để xác minh email, đăng nhập và mở liên kết trong 30 phút: ${process.env.PUBLIC_APP_URL || 'http://localhost:8080'}/verify-email#${token}`, nextAttemptAt: new Date() }, { transaction });
            }); sent = true;
        }
        res.json({ message: sent ? 'Đã lưu email. Hướng dẫn xác minh sẽ được gửi tới email mới.' : 'Đã lưu email. Chưa gửi thư vì email đã xác minh hoặc SMTP chưa được cấu hình.' });
    } catch (error) { next(error); }
});
router.post('/api/account/verify-email', auth, limit(10), async (req, res, next) => {
    try {
        if (!/^[a-f0-9]{64}$/.test(req.body.token || '')) v.fail('Liên kết không hợp lệ.');
        await db.transaction(async transaction => {
            const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
            const token = await PasswordReset.findOne({ where: { userId: user.id, purpose: `email:${user.email}`, tokenHash: crypto.createHash('sha256').update(req.body.token).digest('hex') }, transaction, lock: transaction.LOCK.UPDATE });
            if (!token || token.usedAt || token.expiresAt <= new Date()) v.fail('Liên kết không hợp lệ hoặc đã hết hạn.');
            await user.update({ emailVerified: true }, { transaction }); await token.update({ usedAt: new Date() }, { transaction });
        }); res.json({ message: 'Đã xác minh email. Bạn có thể nhận email và khôi phục mật khẩu.' });
    } catch (error) { next(error); }
});
router.post('/api/admin/accounts/:id/reset-password', auth, checkRole(['admin']), async (req, res, next) => {
    try {
        const temporaryPassword = crypto.randomBytes(12).toString('base64url');
        const encrypted = await bcrypt.hash(temporaryPassword, 10);
        await db.transaction(async transaction => {
            const user = await User.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user || user.role === 'admin') v.fail('Chỉ khôi phục tài khoản bệnh nhân/bác sĩ qua chức năng này.');
            await user.update({ password: encrypted, tokenVersion: user.tokenVersion + 1 }, { transaction });
            await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null }, transaction });
        });
        res.json({ temporaryPassword, message: 'Chuyển mật khẩu trực tiếp cho người dùng đã được xác minh danh tính.' });
    } catch (error) { next(error); }
});
module.exports = router;
