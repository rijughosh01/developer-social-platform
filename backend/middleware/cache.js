const redisService = require("../utils/redisService");

// Cache middleware for API responses
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    if (!redisService.isAvailable()) {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `api:${req.originalUrl}`;

    try {
      const cachedResponse = await redisService.get(cacheKey);

      if (cachedResponse) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      const originalSend = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        redisService
          .set(cacheKey, data, ttl)
          .then(() => {
            console.log(`Cached: ${cacheKey} (TTL: ${ttl}s)`);
          })
          .catch((err) => {
            console.error("Cache storage error:", err);
          });

        // Call original send method
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Cache invalidation middleware
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    const originalSend = res.json;

    // Override res.json to invalidate cache after successful response
    res.json = async function (data) {
      try {
        if (redisService.isAvailable()) {
          // Invalidate cache patterns
          for (const pattern of patterns) {
            const keysToDelete = [
              `api:${pattern}`,
              `api:${pattern}/*`,
              `api:posts/*`,
              `api:users/*`,
              `api:projects/*`,
            ];

            for (const key of keysToDelete) {
              await redisService.del(key);
            }
          }
          console.log(`Cache invalidated for patterns: ${patterns.join(", ")}`);
        }
      } catch (error) {
        console.error("Cache invalidation error:", error);
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

// User-specific cache middleware
const userCacheMiddleware = (ttl = 1800) => {
  return async (req, res, next) => {
    if (!req.user || !redisService.isAvailable()) {
      return next();
    }

    const userId = req.user._id;
    const cacheKey = `user:${userId}:${req.originalUrl}`;

    try {
      // Try to get cached response
      const cachedResponse = await redisService.get(cacheKey);

      if (cachedResponse) {
        console.log(`User cache hit: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      const originalSend = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        redisService
          .set(cacheKey, data, ttl)
          .then(() => {
            console.log(`User cached: ${cacheKey} (TTL: ${ttl}s)`);
          })
          .catch((err) => {
            console.error("User cache storage error:", err);
          });

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error("User cache middleware error:", error);
      next();
    }
  };
};

// Rate limiting cache middleware
const rateLimitCache = {
  async increment(key, windowMs = 900000) {
    if (!redisService.isAvailable()) {
      return 1;
    }

    const count = await redisService.incr(key, Math.ceil(windowMs / 1000));
    return count;
  },

  async reset(key) {
    if (redisService.isAvailable()) {
      await redisService.del(key);
    }
  },
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  userCacheMiddleware,
  rateLimitCache,
};
