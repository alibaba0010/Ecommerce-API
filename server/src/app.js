import express, { json } from "express";
import "express-async-errors";
import cookieSession from "cookie-session";
import cors from "cors";
import rateLimit from "express-rate-limit";
import userRouter from "./routes/user.router.js";
import orderRouter from "./routes/order.router.js";
import productRouter from "./routes/product.router.js";
import cartRouter from "./routes/cart.router.js";
import dotenv from "dotenv";
import { errorHandler } from "./errors/error.js";
import { routeError } from "./errors/route.error.js";
import compression from "compression";
import NodeCache from "node-cache";
import pino from "pino";
import morgan from "morgan";
import expressStatusMonitor from "express-status-monitor";
import helmet from "helmet";
import hpp from "hpp";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// Load environment variables
dotenv.config();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window that means 100 requests every 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

// Logger and cache (for advanced use)
const logger =
  process.env.NODE_ENV === "production"
    ? pino({ level: "info" })
    : pino({ level: "debug" });
const cache = new NodeCache();

const app = express();

// Custom logging middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      responseTime: `${elapsedTimeInMs.toFixed(3)} ms`,
    });
  });

  next();
});

// Monitoring and security middlewares
app
  .use(expressStatusMonitor())
  .use(
    helmet({
      contentSecurityPolicy: false, // Set to true and configure CSP in production
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  )
  .use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  )
  .use(hpp())
  .use(xss())
  .use(mongoSanitize())
  .use(compression())
  .use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"))
  .use(json({ limit: "10mb" }))
  // .use(limiter)
  .use(
    cookieSession({
      signed: false,
      secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      httpOnly: true,
    })
  )
  .use("/products", express.static(path.join(__dirname, "./uploads")))
  .use("/v1", userRouter)
  .use("/v1", orderRouter)
  .use("/v1/products", productRouter)
  .use("/v1", cartRouter)
  .use("/", express.static("public"))
  .use(routeError)
  .use(errorHandler);

// Example usage of logger and cache (for your routes/services)
// logger.info("App started");
// cache.set("key", "value", 10000);

export default app;
