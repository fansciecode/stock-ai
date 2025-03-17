import Redis from 'ioredis';

// Mock Redis client implementation
const mockRedisClient = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    exists: async () => 0,
    incr: async () => 1,
    expire: async () => 1,
    on: () => mockRedisClient,
    connect: async () => {},
    disconnect: async () => {},
    quit: async () => {},
    sendCommand: async () => null,
    hget: async () => null,
    hset: async () => 'OK',
    hincrby: async () => 1,
    hgetall: async () => ({}),
    lpush: async () => 1,
    lrange: async () => [],
    ltrim: async () => 'OK'
};

// Configuration for real Redis client
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

// Function to create Redis client based on environment
const createRedisClient = () => {
    // Check if Redis is enabled via environment variable
    const useRedis = process.env.USE_REDIS === 'true';

    if (useRedis) {
        try {
            const client = new Redis(redisConfig);
            
            client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                // Fallback to mock client if Redis fails
                return mockRedisClient;
            });

            client.on('connect', () => {
                console.log('Redis Client Connected Successfully');
            });

            return client;
        } catch (error) {
            console.error('Failed to create Redis client:', error);
            // Fallback to mock client if Redis creation fails
            return mockRedisClient;
        }
    } else {
        console.log('Using mock Redis client (Redis disabled)');
        return mockRedisClient;
    }
};

// Export the Redis client instance
const redisClient = createRedisClient();
export default redisClient;

// Export the mock client for testing
export { mockRedisClient }; 