import { NextFunction, Request, Response } from 'express';
import { Profiler } from 'inspector';
import { Logger } from 'winston';
import { takeCpuProfile, takeHeapSnapshot } from './profile';
import { createBasicLogger } from './utils';

interface ExpressProfileOptions {
    cpuProfilePath?: string;
    heapSnapshotPath?: string;
    logger?: Logger;
    authSkip?: boolean;
    authHeaderName?: string;
    authHeaderValue?: string;
    authCustomFn?: (req: Request, cb: (err?: any) => any) => any;
    defaultCpuProfileDuration?: number;
}

export const exposeProfiler = (options: ExpressProfileOptions) => {
    options = {
        cpuProfilePath: '/profiler/cpu',
        heapSnapshotPath: '/profiler/heap',
        authSkip: false,
        authHeaderName: null,
        authHeaderValue: null,
        authCustomFn: null,
        defaultCpuProfileDuration: 10,
        ...options
    };
    const logger = options.logger ? options.logger : createBasicLogger();

    // check if no auth
    if (options.authSkip) {
        logger.warn('authentication marked to skip. I HOPE YOU KNOW WHAT YOU\'RE DOING');
    }

    if (
        options.authSkip
        || (options.authHeaderName && options.authHeaderValue)
        || (typeof options.authCustomFn === 'function' && options.authCustomFn)
    ) {
        logger.debug('auth mode specified');
    } else {
        logger.error('auth is invalid, must specify authSkip OR both authHeaderName+authHeaderValue' +
            ' or pass an authCustomFn function', { options });
        throw new Error('incomplete set of options');
    }

    return (req: Request, res: Response, nxt: NextFunction) => {
        if (req.path !== options.cpuProfilePath || req.path !== options.heapSnapshotPath) {
            nxt();
            return;
        }

        // check if the request is authenticated
        new Promise<void>((resolve, reject) => {
            // check via headers
            if (
                !options.authSkip
                && options.authHeaderName
                && options.authHeaderValue
                && req.headers
                && req.headers[options.authHeaderName]
                && req.headers[options.authHeaderName] === options.authHeaderValue
            ) {
                resolve();
                return;
            }
            if (!options.authSkip && options.authCustomFn && typeof options.authCustomFn === 'function') {
                options.authCustomFn(req, (err) => {
                    if (err) {
                        reject();
                    } else {
                        resolve();
                    }
                });
            }
        }).then(() => {
            if (req.path === options.cpuProfilePath) {
                // check if request includes duration
                let duration = options.defaultCpuProfileDuration;
                if (req.query.duration && !Number.isNaN(Number(req.query.duration))) {
                    duration = Number(req.query.duration);
                }
                takeCpuProfile({ logger, duration }).then((profile: Profiler.Profile) => {
                    logger.info('completed cpu profile');
                    res.json(profile);
                }).catch((err) => {
                    logger.error('error taking cpu profile', { error: err });
                    res.sendStatus(500);
                });
                return;
            }

            if (req.path === options.heapSnapshotPath) {
                takeHeapSnapshot({ logger }).then((snapshot: string) => {
                    logger.info('completed taking heap snapshot');
                    res.json(snapshot);
                }).catch((err) => {
                    logger.error('error taking heap snapshot', { error: err });
                    res.sendStatus(500);
                });
                return;
            }

            // something has gone wrong, we shouldn't be here
            logger.error('unexpectedly missed handler functions', {
                path: req.path,
                cpuPath: options.cpuProfilePath,
                heapPath: options.heapSnapshotPath
            });
            res.sendStatus(404);
            return;
        }).catch((err) => {
            logger.error('error authenticating', { error: err });
            // pretend 404 so we don't leak these routes
            res.sendStatus(404);
            return;
        });
    };
};
