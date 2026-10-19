const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/security');

async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng đăng nhập!' });
    let decoded;
    try { decoded = jwt.verify(header.slice(7), jwtSecret, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' }); }
    try {
        const user = await User.findByPk(decoded.id, { attributes: ['id', 'role', 'isActive', 'tokenVersion'] });
        if (!user || user.isActive === false || (decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) return res.status(401).json({ message: 'Tài khoản không còn tồn tại.' });
        req.user = { id: user.id, role: user.role };
        next();
    } catch (error) { next(error); }
}
const optionalAuth = (req, res, next) => req.headers.authorization ? authMiddleware(req, res, next) : next();
const checkRole = roles => (req, res, next) => roles.includes(req.user?.role)
    ? next() : res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này!' });
const ownAccount = param => (req, res, next) => req.user.role === 'admin' || Number(req.params[param]) === req.user.id
    ? next() : res.status(403).json({ message: 'Bạn không có quyền truy cập hồ sơ này.' });
module.exports = { authMiddleware, optionalAuth, checkRole, ownAccount };
