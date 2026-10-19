const app = require('../index');
const sequelize = require('../db');
const { migrate } = require('../migrations');
async function main() {
    await sequelize.authenticate();
    await migrate();
    const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const paths = [['/', 200], ['/api/specialties', 200], ['/api/doctors', 200], ['/api/appointments', 401], ['/api/admin/dashboard-stats', 401]];
        for (const [path, expected] of paths) {
            const response = await fetch(`${base}${path}`);
            await response.text();
            if (response.status !== expected) throw new Error(`${path}: ${response.status}, expected ${expected}`);
            console.log(`${path}: ${response.status} OK`);
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => sequelize.close());
