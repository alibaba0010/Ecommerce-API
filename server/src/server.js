import { createServer } from "http";
import { createClient } from "redis";
import dotenv from "dotenv";
import connectDB from "./db.js";
import app from "./app.js";
import config from "config";
dotenv.config();
const PORT = process.env.PORT || 2000;
const uri = process.env.MONGO_URL;
const server = createServer(app);
// const redisClient = createClient({ url: process.env.REDIS_URI });
const redisClient = createClient();
(async () => {
  await connectDB(uri);
  server.listen(PORT, () =>
    console.log(`Listening to port @ http://localhost:${PORT}`)
  );
})();
