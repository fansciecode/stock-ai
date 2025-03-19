import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createLogger } from '../utils/logger.js';
import redisClient from '../config/redis.js';

const logger = createLogger('rateLimitMiddleware');

// Helper function to create rate limiter with optional Redis store
const createRateLimiter = (options) => {
    const useRedis = process.env.USE_REDIS === 'true';
    const baseConfig = {
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        standardHeaders: true,
        legacyHeaders: false,
        handler: options.handler
    };

    // Add Redis store if Redis is enabled
    if (useRedis) {
        baseConfig.store = new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
            prefix: options.prefix || 'rate_limit:'
        });
    }

    return rateLimit(baseConfig);
};

// General API rate limiter
export const rateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    prefix: 'rate_limit:general:',
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later',
            retryAfter: res.getHeader('Retry-After')
        });
    }
});

// Admin API rate limiter (more permissive)
export const adminRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many admin API requests, please try again later',
    prefix: 'rate_limit:admin:',
    handler: (req, res) => {
        logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many admin API requests, please try again later',
            retryAfter: res.getHeader('Retry-After')
        });
    }
});

// AI API rate limiter (more restrictive due to cost)
export const aiRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: 'AI request limit exceeded, please try again later',
    prefix: 'rate_limit:ai:',
    handler: (req, res) => {
        logger.warn(`AI rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'AI request limit exceeded, please try again later',
            retryAfter: res.getHeader('Retry-After')
        });
    }
}); 