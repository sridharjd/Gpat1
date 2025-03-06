const { createClient } = require('redis');
const logger = require('./logger');

// In-memory cache fallback
const memoryCache = new Map();

let redisClient = null;
let useMemoryCache = true;

// Only attempt Redis connection if REDIS_URL is provided
if (process.env.REDIS_URL) {
  try {
    // Create Redis client
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis Client Error, falling back to memory cache:', err.message);
      useMemoryCache = true;
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
      useMemoryCache = false;
    });

    // Connect to Redis
    redisClient.connect().catch((err) => {
      logger.warn('Redis Connection Error, using memory cache:', err.message);
      useMemoryCache = true;
    });
  } catch (error) {
    logger.warn('Redis initialization error, using memory cache:', error.message);
    useMemoryCache = true;
  }
} else {
  logger.info('No Redis URL provided, using memory cache');
}

class Cache {
  static async get(key) {
    try {
      if (!useMemoryCache && redisClient?.isReady) {
        return await redisClient.get(key);
      }
      return memoryCache.get(key);
    } catch (error) {
      logger.warn('Cache get error, falling back to memory cache:', error.message);
      return memoryCache.get(key);
    }
  }

  static async set(key, value, ttl = 300) { // Default TTL: 5 minutes
    try {
      if (!useMemoryCache && redisClient?.isReady) {
        await redisClient.set(key, value, { EX: ttl });
      } else {
        memoryCache.set(key, value);
        setTimeout(() => memoryCache.delete(key), ttl * 1000);
      }
    } catch (error) {
      logger.warn('Cache set error, falling back to memory cache:', error.message);
      memoryCache.set(key, value);
      setTimeout(() => memoryCache.delete(key), ttl * 1000);
    }
  }

  static async del(key) {
    try {
      if (!useMemoryCache && redisClient?.isReady) {
        await redisClient.del(key);
      }
      memoryCache.delete(key);
    } catch (error) {
      logger.warn('Cache delete error, falling back to memory cache:', error.message);
      memoryCache.delete(key);
    }
  }

  static async flush() {
    try {
      if (!useMemoryCache && redisClient?.isReady) {
        await redisClient.flushAll();
      }
      memoryCache.clear();
    } catch (error) {
      logger.warn('Cache flush error, falling back to memory cache:', error.message);
      memoryCache.clear();
    }
  }

  // Helper method to check cache status
  static getStatus() {
    return {
      type: useMemoryCache ? 'memory' : 'redis',
      isReady: !useMemoryCache ? redisClient?.isReady : true,
      size: useMemoryCache ? memoryCache.size : null
    };
  }
}

module.exports = Cache; 