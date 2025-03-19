import { createLogger } from '../utils/logger.js';

const logger = createLogger('errorMiddleware');

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Log error details
    logger.error({
        status: statusCode,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : '🥞',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        user: req.user ? req.user._id : 'anonymous',
        query: req.query,
        body: req.body
    });

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        errorCode: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
};

export { notFound, errorHandler };

export default errorHandler;

export class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}
