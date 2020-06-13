import { createLogger, format, Logger, transports } from 'winston';

export const createBasicLogger = (): Logger => {
    return createLogger({
        level: 'info',
        format: format.combine(format.timestamp(), format.simple()),
        transports: [new transports.Console()]
    });
};
