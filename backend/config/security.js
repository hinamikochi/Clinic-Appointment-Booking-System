const { randomBytes } = require('node:crypto');
require('dotenv').config();

const configuredSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32 || configuredSecret === 'secret_key')) {
    throw new Error('JWT_SECRET phải có ít nhất 32 ký tự khi triển khai production.');
}
// Development sessions are invalidated on restart unless a secret is configured.
const jwtSecret = configuredSecret || randomBytes(48).toString('hex');
module.exports = { jwtSecret };
