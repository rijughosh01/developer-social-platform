const { createClient } = require("redis");
const { Redis } = require("@upstash/redis");

class RedisService {
  constructor() {
    this.traditionalRedis = null;
    this.upstashRedis = null;
    this.isUpstashEnabled = process.env.USE_UPSTASH_REDIS === "true";
    this.isTraditionalEnabled = process.env.USE_REDIS === "true";
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize traditional Redis (for Socket.IO)
      if (this.isTraditionalEnabled && process.env.REDIS_URL) {
        this.traditionalRedis = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000,
            lazyConnect: true,
            reconnectStrategy: (retries) => {
              if (retries > 3) return false;
              return Math.min(retries * 100, 3000);
            },
            ...(process.env.REDIS_URL &&
              (process.env.REDIS_URL.includes("cloud.redislabs.com") ||
                process.env.REDIS_URL.includes("upstash.io")) && {
                tls: true,
                rejectUnauthorized: false,
              }),
          },
        });

        this.traditionalRedis.on("connect", () => {
          console.log("Traditional Redis connected");
        });

        this.traditionalRedis.on("error", (err) => {
          console.error("Traditional Redis error:", err.message);
        });

        await this.traditionalRedis.connect();
      }

      // Initialize Upstash Redis (for caching)
      if (
        this.isUpstashEnabled &&
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
      ) {
        this.upstashRedis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        // Test Upstash connection
        await this.upstashRedis.ping();
        console.log("Upstash Redis connected");
      }
    } catch (error) {
      console.error("Redis initialization error:", error.message);
    }
  }

  // Cache operations
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.upstashRedis) {
        await this.upstashRedis.set(key, serializedValue, { ex: ttl });
        return true;
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.setEx(key, ttl, serializedValue);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Redis set error:", error);
      return false;
    }
  }

  async get(key) {
    try {
      let value;

      if (this.upstashRedis) {
        value = await this.upstashRedis.get(key);
      } else if (this.traditionalRedis) {
        value = await this.traditionalRedis.get(key);
      } else {
        return null;
      }

      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch (parseError) {
        console.error("Redis JSON parse error for key:", key, "value:", value);
        return null;
      }
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async del(key) {
    try {
      if (this.upstashRedis) {
        await this.upstashRedis.del(key);
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.del(key);
      }
      return true;
    } catch (error) {
      console.error("Redis del error:", error);
      return false;
    }
  }

  async exists(key) {
    try {
      let result;

      if (this.upstashRedis) {
        result = await this.upstashRedis.exists(key);
      } else if (this.traditionalRedis) {
        result = await this.traditionalRedis.exists(key);
      } else {
        return false;
      }

      return result === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return false;
    }
  }

  async incr(key, ttl = 3600) {
    try {
      let result;

      if (this.upstashRedis) {
        result = await this.upstashRedis.incr(key);
        if (result === 1) {
          await this.upstashRedis.expire(key, ttl);
        }
      } else if (this.traditionalRedis) {
        result = await this.traditionalRedis.incr(key);
        if (result === 1) {
          await this.traditionalRedis.expire(key, ttl);
        }
      } else {
        return null;
      }

      return result;
    } catch (error) {
      console.error("Redis incr error:", error);
      return null;
    }
  }

  async mset(keyValuePairs, ttl = 3600) {
    try {
      if (this.upstashRedis) {
        const pipeline = this.upstashRedis.pipeline();
        for (const [key, value] of Object.entries(keyValuePairs)) {
          pipeline.set(key, JSON.stringify(value), { ex: ttl });
        }
        await pipeline.exec();
      } else if (this.traditionalRedis) {
        const pipeline = this.traditionalRedis.multi();
        for (const [key, value] of Object.entries(keyValuePairs)) {
          pipeline.setEx(key, ttl, JSON.stringify(value));
        }
        await pipeline.exec();
      }
      return true;
    } catch (error) {
      console.error("Redis mset error:", error);
      return false;
    }
  }

  async mget(keys) {
    try {
      let values;

      if (this.upstashRedis) {
        values = await this.upstashRedis.mget(...keys);
      } else if (this.traditionalRedis) {
        values = await this.traditionalRedis.mGet(keys);
      } else {
        return keys.map(() => null);
      }

      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      console.error("Redis mget error:", error);
      return keys.map(() => null);
    }
  }

  // Hash operations
  async hset(key, field, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.upstashRedis) {
        await this.upstashRedis.hset(key, field, serializedValue);
        await this.upstashRedis.expire(key, ttl);
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.hSet(key, field, serializedValue);
        await this.traditionalRedis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      console.error("Redis hset error:", error);
      return false;
    }
  }

  async hget(key, field) {
    try {
      let value;

      if (this.upstashRedis) {
        value = await this.upstashRedis.hget(key, field);
      } else if (this.traditionalRedis) {
        value = await this.traditionalRedis.hGet(key, field);
      } else {
        return null;
      }

      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis hget error:", error);
      return null;
    }
  }

  async hgetall(key) {
    try {
      let hash;

      if (this.upstashRedis) {
        hash = await this.upstashRedis.hgetall(key);
      } else if (this.traditionalRedis) {
        hash = await this.traditionalRedis.hGetAll(key);
      } else {
        return {};
      }

      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error("Redis hgetall error:", error);
      return {};
    }
  }

  // List operations
  async lpush(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.upstashRedis) {
        await this.upstashRedis.lpush(key, serializedValue);
        await this.upstashRedis.expire(key, ttl);
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.lPush(key, serializedValue);
        await this.traditionalRedis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      console.error("Redis lpush error:", error);
      return false;
    }
  }

  async rpop(key) {
    try {
      let value;

      if (this.upstashRedis) {
        value = await this.upstashRedis.rpop(key);
      } else if (this.traditionalRedis) {
        value = await this.traditionalRedis.rPop(key);
      } else {
        return null;
      }

      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis rpop error:", error);
      return null;
    }
  }

  async lrange(key, start = 0, stop = -1) {
    try {
      let values;

      if (this.upstashRedis) {
        values = await this.upstashRedis.lrange(key, start, stop);
      } else if (this.traditionalRedis) {
        values = await this.traditionalRedis.lRange(key, start, stop);
      } else {
        return [];
      }

      return values.map((value) => JSON.parse(value));
    } catch (error) {
      console.error("Redis lrange error:", error);
      return [];
    }
  }

  // Set operations
  async sadd(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.upstashRedis) {
        await this.upstashRedis.sadd(key, serializedValue);
        await this.upstashRedis.expire(key, ttl);
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.sAdd(key, serializedValue);
        await this.traditionalRedis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      console.error("Redis sadd error:", error);
      return false;
    }
  }

  async smembers(key) {
    try {
      let values;

      if (this.upstashRedis) {
        values = await this.upstashRedis.smembers(key);
      } else if (this.traditionalRedis) {
        values = await this.traditionalRedis.sMembers(key);
      } else {
        return [];
      }

      return values.map((value) => JSON.parse(value));
    } catch (error) {
      console.error("Redis smembers error:", error);
      return [];
    }
  }

  // Utility functions
  async ping() {
    try {
      if (this.upstashRedis) {
        await this.upstashRedis.ping();
        return true;
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.ping();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Redis ping error:", error);
      return false;
    }
  }

  async flushall() {
    try {
      if (this.upstashRedis) {
        await this.upstashRedis.flushall();
      } else if (this.traditionalRedis) {
        await this.traditionalRedis.flushAll();
      }
      return true;
    } catch (error) {
      console.error("Redis flushall error:", error);
      return false;
    }
  }

  // Get Redis client for Socket.IO
  getSocketIOClient() {
    return this.traditionalRedis;
  }

  // Check if Redis is available
  isAvailable() {
    return this.upstashRedis !== null || this.traditionalRedis !== null;
  }

  // Get Redis type being used
  getRedisType() {
    if (this.upstashRedis) return "upstash";
    if (this.traditionalRedis) return "traditional";
    return "none";
  }
}

const redisService = new RedisService();

module.exports = redisService;
