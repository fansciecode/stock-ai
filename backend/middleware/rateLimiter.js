import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// General API rate limiter
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Authentication rate limiter
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 login attempts per hour
    message: 'Too many authentication attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

// Payment routes rate limiter
export const paymentLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 50, // Limit each IP to 50 payment requests per day
    message: 'Too many payment requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Add monitoring and analytics
const monitorRateLimits = async (key, limitInfo) => {
  try {
    await redisClient.hincrby('rate-limit:stats', key, 1);
    
    // Store detailed info for analysis
    await redisClient.lpush('rate-limit:logs', JSON.stringify({
      key,
      timestamp: Date.now(),
      ...limitInfo
    }));
    
    // Keep only last 1000 logs
    await redisClient.ltrim('rate-limit:logs', 0, 999);
  } catch (error) {
    console.error('Rate limit monitoring error:', error);
  }
};

// Helper function to get rate limit stats
export const getRateLimitStats = async () => {
  try {
    const stats = await redisClient.hgetall('rate-limit:stats');
    const recentLogs = await redisClient.lrange('rate-limit:logs', 0, 49); // Get last 50 logs
    
    return {
      stats,
      recentLogs: recentLogs.map(log => JSON.parse(log))
    };
  } catch (error) {
    console.error('Error fetching rate limit stats:', error);
    return null;
  }
};

// Moderate limiter for user profile updates
export const userUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: { message: 'Too many profile update requests, please try again later' }
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: { message: 'Upload limit reached, please try again later' }
}); 