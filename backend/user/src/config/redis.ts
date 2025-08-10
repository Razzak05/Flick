import { createClient } from "redis";

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URI;
  if (!redisUrl) {
    throw new Error("Missing REDIS_URI in environment variables");
  }

  let redisClient;

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on("connect", () => {
    console.log("Redis client connected");
  });

  redisClient.on("error", (error) => {
    console.error("Redis connection error:", error);
  });

  await redisClient.connect();
  return redisClient;
};

export default connectRedis;
