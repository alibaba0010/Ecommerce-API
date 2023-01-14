import express, { json } from "express";
import "express-async-errors";
import userRouter from "./routes/user.router.js";
// import orderRouter from "./routes/order.router.js";
import productRouter from "./routes/product.router.js";
import cartRouter from "./routes/cart.router.js";
import dotenv from "dotenv";
import { errorHandler } from "./errors/error.js";

import { routeError } from "./errors/route.error.js";
import redis from "redis";
dotenv.config();
// console.log(process.env.REDIS_URI)
const redisClient = redis.createClient(process.env.REDIS_URI);

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

const app = express();
app
  .use(json())
  // .use("/uploads", express.static(path.join(__dirname, ".", "uploads")))
  .use("/v1", userRouter)
  // .use("/v1", orderRouter)
  .use("/v1/products", productRouter)
  .use("/v1", cartRouter)
  .use(routeError)
  .use(errorHandler);

export default app;
