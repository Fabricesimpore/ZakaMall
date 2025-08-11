import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStaticFiles } from "./static-files";
import { requestLogger, errorLogger, logInfo } from "./logger";
import { validateEnvironment, getNumericEnv } from "./envValidator";
import { runStartupMigrations } from "./startup-migrations";

// Validate environment variables on startup
validateEnvironment();

const app = express();

// Enable compression for production
if (process.env.NODE_ENV === "production") {
  app.use(compression());
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: getNumericEnv("RATE_LIMIT_WINDOW_MS", 900000), // 15 minutes default
  max: getNumericEnv("RATE_LIMIT_MAX_REQUESTS", 100), // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and static assets
  skip: (req) => {
    return (
      req.path === "/health" ||
      req.path === "/api/health" ||
      req.path.startsWith("/assets/") ||
      req.path.startsWith("/static/")
    );
  },
});

// Apply rate limiting to API routes only in production
// Temporarily disabled for debugging admin login issue
// if (process.env.NODE_ENV === "production") {
//   app.use("/api", limiter);
// }

// More lenient rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 10, // Much higher limit in development
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply auth rate limiting to specific endpoints (but skip in development for easier testing)
// Temporarily disabled for debugging
// if (process.env.NODE_ENV === "production") {
//   app.use("/api/auth", authLimiter);
//   app.use("/api/register", authLimiter);
//   app.use("/api/login", authLimiter);
//   app.use("/api/verify", authLimiter);
// } else {
console.log("⚠️  Auth rate limiting disabled in development mode");
// }

// Request logging middleware
app.use(requestLogger);

// Health check endpoints (before rate limiting)
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

(async () => {
  // Run startup migrations before registering routes
  await runStartupMigrations();

  const server = await registerRoutes(app);

  // Error logging middleware
  app.use(errorLogger);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStaticFiles(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = getNumericEnv("PORT", 5000);
  server.listen(port, "0.0.0.0", () => {
    logInfo("Server started", { port, host: "0.0.0.0", environment: process.env.NODE_ENV });
    console.log(`🚀 ZakaMall server running on port ${port}`);
  });
})();
