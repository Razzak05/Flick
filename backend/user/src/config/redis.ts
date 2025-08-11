import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URI;
  if (!redisUrl) {
    throw new Error("Missing REDIS_URI in environment variables");
  }

  redisClient = createClient({ url: redisUrl });

  redisClient.on("connect", () => {
    console.log("Redis client connected");
  });

  redisClient.on("error", (error) => {
    console.error("Redis connection error:", error);
  });

  await redisClient.connect();
  return redisClient;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error(
      "Redis client is not initialized. Did you forget to call connectRedis()?"
    );
  }
  return redisClient;
};
