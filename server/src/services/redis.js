import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URI || "redis://redis:6379";
console.log("Redis URl: ", redisUrl);
export const redisClient = createClient({ url: redisUrl });
export async function startRedis() {
  if (!redisClient.isOpen) {
    redisClient.on("error", (err) => console.error(err));
    await redisClient.connect();
    console.log("Redis connected successfully");
  }
}
export async function stopRedis(signal) {
  console.log(`${signal} received, closing server gracefully...`);
  if (redisClient.isOpen) {
    await redisClient.disconnect();
    console.log("Redis disconnected");
    process.exit(0);
  }
  setTimeout(() => {
    console.error("Forcing shutdown...");
    process.exit(1);
  }, 10000);
}
