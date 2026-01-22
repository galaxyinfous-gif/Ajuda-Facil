import winston from 'winston';
import { config } from './env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: config.logging.level,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
    ],
});

// Em produção, adicionar log em arquivo
if (config.isProd) {
    logger.add(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        })
    );
    logger.add(
        new winston.transports.File({
            filename: 'logs/combined.log',
        })
    );
}
