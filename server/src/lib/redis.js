// src/lib/redis.js
// 
// Singleton Redis client instance.
// Gracefully handles connection failures so the app doesn't crash if Redis is unavailable.

const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      // Reconnect after 1s, max 10 times
      if (retries > 10) {
        console.error("Redis max retries reached. Giving up.");
        return new Error("Retry time exhausted");
      }
      return 1000; // 1 second
    },
  },
});

redisClient.on("error", (err) => {
  // We log the error but don't crash.
  // The cache methods below will just gracefully fallback to DB.
  console.error("Redis Client Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

// Immediately attempt to connect
redisClient.connect().catch((err) => {
  console.error("Initial Redis connection failed:", err.message);
});

/**
 * Helper to gracefully get JSON from Redis.
 * If Redis is down, returns null (so the app falls back to DB).
 */
const getCache = async (key) => {
  if (!redisClient.isReady) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis Get Error [${key}]:`, err.message);
    return null;
  }
};

/**
 * Helper to gracefully save JSON to Redis with a TTL (Time To Live) in seconds.
 * If Redis is down, it silently fails (which is fine).
 */
const setCache = async (key, value, ttlSeconds = 300) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error(`Redis Set Error [${key}]:`, err.message);
  }
};

/**
 * Helper to delete a specific key from Redis (e.g., when a user updates their profile).
 */
const delCache = async (key) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Redis Del Error [${key}]:`, err.message);
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  delCache,
};
