const app = require('express')();
const { exposeProfiler } = require('../..');
const { format, transports, createLogger } = require('winston');
const crypto = require('crypto');

const doCpuIntensiveThing = () => {
    const bytes = crypto.randomBytes(100000).toString('hex');
    const hasher = crypto.createHash('md5');
    hasher.update(bytes);
    hasher.digest().toString('hex');
    setTimeout(doCpuIntensiveThing, 1);
};
doCpuIntensiveThing();

app.use(exposeProfiler({
    authSkip: true,
    defaultCpuProfileDuration: 5,
    logger: createLogger({
        level: 'silly',
        format: format.combine(format.timestamp(), format.simple()),
        transports: [new transports.Console()]
    })
}));

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
