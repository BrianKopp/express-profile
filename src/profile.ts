import { Profiler, Session } from 'inspector';
import { Logger } from 'winston';

export const takeCpuProfile = async (options: { logger: Logger, duration: number }): Promise<Profiler.Profile> => {
    const { logger, duration } = options;

    logger.info('beginning cpu profiler session');
    const session = new Session();
    try {
        session.connect();
    } catch (err) {
        logger.error('error connecting to session', { error: err });
        throw err;
    }

    logger.debug('enabling profiler');
    try {
        await sessionOperationPromise(session, 'Profiler.enable');
    } catch (err) {
        logger.error('error enabling profiler', { error: err });
        session.disconnect();
        throw err;
    }

    logger.debug('starting profiler');
    try {
        await sessionOperationPromise(session, 'Profiler.start');
    } catch (err) {
        logger.error('error starting profiler', { error: err });
        await makeSafePromise(sessionOperationPromise(session, 'Profiler.disable'));
        session.disconnect();
        throw err;
    }

    logger.debug('pausing so profiler can collect');
    await new Promise<void>((resolve, _) => {
        setTimeout(resolve, duration * 1000);
    });

    // stop the profiler
    logger.info('stopping profiler');
    let profileData: Profiler.Profile;
    try {
        profileData = await new Promise<Profiler.Profile>((resolve, reject) => {
            session.post('Profiler.stop', (err, { profile }) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(profile);
                }
            });
        });
    } catch (err) {
        logger.error('error stopping profiler', { error: err });
        await makeSafePromise(sessionOperationPromise(session, 'Profiler.disable'));
        session.disconnect();
        throw err;
    }

    // return the profile and close out of the session
    await makeSafePromise(sessionOperationPromise(session, 'Profiler.disable'));
    session.disconnect();

    logger.info('successfully finished CPU profile');
    return profileData;
};

export const takeHeapSnapshot = async (options: { logger: Logger }): Promise<string> => {
    const { logger } = options;

    logger.info('beginning heap-snapshot session');
    const session = new Session();
    try {
        session.connect();
    } catch (err) {
        logger.error('error connecting to session', { error: err });
        throw err;
    }

    logger.debug('setting up heap profiler events');
    const chunks: any[] = [];
    const addChunk = (x: any) => {
        try {
            chunks.push(x.params.chunk);
        } catch (err) {
            logger.error('error adding chunk', { chunk: x, chunks });
        }
    };
    session.on('HeapProfiler.addHeapSnapshotChunk', addChunk);

    try {
        await new Promise<void>((resolve, reject) => {
            session.post('HeapProfiler.takeHeapSnapshot', (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        logger.error('error taking heap snapshot', { error: err });
        session.disconnect();
        throw err;
    }

    logger.info('completed heap-snapshot');
    return chunks.join('');
};

const makeSafePromise = <T>(promise: Promise<T>): Promise<boolean> => {
    return new Promise<boolean>((resolve, _) => {
        promise.then((__: T) => {
            resolve(true);
        }).catch((___) => {
            resolve(false);
        });
    });
};

const sessionOperationPromise = (session: Session, operation: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        session.post(operation, (err: any) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
