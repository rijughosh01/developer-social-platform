const { createAdapter } = require("@socket.io/redis-adapter");
const redisService = require("../utils/redisService");

const setupRedisAdapter = (io) => {
  // Check if Redis is required (only for production or when explicitly enabled)
  const useRedis =
    process.env.NODE_ENV === "production" || process.env.USE_REDIS === "true";

  if (!useRedis) {
    console.log("Redis not required for development. Using in-memory adapter.");
    return { pubClient: null, subClient: null };
  }

  try {
    const traditionalRedis = redisService.getSocketIOClient();

    if (!traditionalRedis) {
      console.log("Traditional Redis not available for Socket.IO");
      console.log(
        "   Socket.IO requires traditional Redis (not Upstash) for pub/sub"
      );
      console.log(
        "   Using in-memory adapter - real-time features limited to single instances"
      );
      return { pubClient: null, subClient: null };
    }

    const subClient = traditionalRedis.duplicate();

    // Set up the Redis adapter
    io.adapter(createAdapter(traditionalRedis, subClient));
    console.log("Socket.IO Redis adapter configured successfully");
    console.log(`   Using ${redisService.getRedisType()} Redis for Socket.IO`);

    return { pubClient: traditionalRedis, subClient };
  } catch (error) {
    console.log("  Redis setup failed, using in-memory adapter");
    console.log("   Error:", error.message);
    return { pubClient: null, subClient: null };
  }
};

module.exports = { setupRedisAdapter };
