const app = require('./index');
const sequelize = require('./db');
const { migrate } = require('./migrations');
async function start() {
    await sequelize.authenticate();
    await migrate();
    const stopWorker = require('./services/notifications').startWorker();
    const server = app.listen(process.env.PORT || 5001, () => console.log('MyClinic API đã sẵn sàng.'));
    const shutdown = () => { stopWorker(); server.close(async () => { await sequelize.close(); process.exit(0); }); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
start().catch(error => { console.error('Không thể khởi động:', error.message); process.exit(1); });
