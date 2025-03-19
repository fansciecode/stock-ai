import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

winston.addColors(colors);

const formatConfig = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

export const createLogger = (module) => {
    return winston.createLogger({
        levels: logLevels,
        format: formatConfig,
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),
            new winston.transports.DailyRotateFile({
                filename: path.join('logs', `%DATE%-${module}.log`),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: winston.format.combine(
                    winston.format.uncolorize(),
                    winston.format.json()
                )
            })
        ]
    });
};

export const morganStream = {
    write: (message) => {
        const logger = createLogger('http');
        logger.http(message.trim());
    }
};

// Create a default logger instance
const logger = createLogger('app');

export default logger;
// export { createLogger };
