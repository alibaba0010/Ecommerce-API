import { createServer } from "http";
import dotenv from "dotenv";
import connectDB from "./db.js";
import app from "./app.js";
import { startRedis, stopRedis } from "./services/redis.js";
dotenv.config();
const PORT = process.env.PORT || 2000;
const uri = process.env.MONGO_URL;
const server = createServer(app);

(async () => {
  await connectDB(uri);
  await startRedis();
  server.listen(PORT, () =>
    console.log(`Listening to port @ http://localhost:${PORT}`)
  );
})();
