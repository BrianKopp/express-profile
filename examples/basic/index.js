const app = require('express')();
const { exposeProfiler } = require('../..');
const { format, transports, createLogger } = require('winston');
const path = require('path');
const fs = require('fs');

app.use(exposeProfiler({
    authSkip: true,
    defaultCpuProfileDuration: 5,
    logger: createLogger({
        level: 'silly',
        format: format.combine(format.timestamp(), format.simple()),
        transports: [new transports.Console()]
    })
}));

app.get('/data', (req, res) => {
    console.log('hit data route');
    const data = fs.readFileSync('./data.cpuprofile');
    const dataJs = JSON.parse(data);
    res.json(dataJs);
});

const server = app.listen(3000, (err) => {
    if (err) {
        console.error('error starting server', err);
        process.exit(1);
    }
    console.log('listening on port 3000');
});

const shutdown = () => {
    server.close((err) => {
        if (err) {
            console.error('error shutting down server', err);
            process.exit(1);
        } else {
            console.info('shut down server');
            process.exit(0);
        }
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
