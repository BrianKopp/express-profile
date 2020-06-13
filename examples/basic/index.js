const app = require('express')();
const { exposeProfiler } = require('../..');

app.use(exposeProfiler({
    
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
