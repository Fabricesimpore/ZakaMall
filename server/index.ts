import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStaticFiles } from "./static-files";
import { requestLogger, errorLogger, logInfo } from "./logger";
import { validateEnvironment, getNumericEnv } from "./envValidator";
import { runStartupMigrations } from "./startup-migrations";
import { emergencyDatabaseFix } from "./emergency-db-fix";
import { runStartupHealthCheck } from "./database/startup-health-check";

// Validate environment variables on startup
validateEnvironment();

const app = express();

// Enable compression for production
if (process.env.NODE_ENV === "production") {
  app.use(compression());
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Rate limiting temporarily disabled for debugging
// TODO: Re-enable rate limiting in production when needed
console.log("⚠️  Rate limiting disabled in development mode");

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

// Comprehensive health check endpoint
app.get("/api/health/detailed", async (_req, res) => {
  try {
    const healthCheck = await runStartupHealthCheck(false); // Don't auto-fix in health endpoint
    const statusCode = healthCheck.overall === "critical" ? 503 : 200;

    res.status(statusCode).json({
      status: healthCheck.overall,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      database: healthCheck.database,
      errors: healthCheck.errors,
      warnings: healthCheck.warnings,
    });
  } catch (error: any) {
    res.status(503).json({
      status: "critical",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

(async () => {
  console.log("🚀 Starting ZakaMall server...");

  try {
    // 1. Run comprehensive startup health check
    console.log("🏥 Running startup health check...");
    const healthCheck = await runStartupHealthCheck(true); // Auto-fix enabled

    if (healthCheck.overall === "critical") {
      console.error("❌ Critical health check failures detected:");
      healthCheck.errors.forEach((error) => console.error(`  - ${error}`));

      if (process.env.NODE_ENV === "production") {
        console.error("❌ Server startup aborted due to critical errors in production");
        process.exit(1);
      } else {
        console.warn("⚠️ Continuing startup in development mode despite critical errors");
      }
    }

    if (healthCheck.overall === "warning") {
      console.warn("⚠️ Health check warnings:");
      healthCheck.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    // 2. Run legacy startup migrations (for backward compatibility)
    console.log("🔄 Running legacy startup migrations...");
    await runStartupMigrations();

    // 3. Run emergency database fix if needed (for backward compatibility)
    console.log("🔧 Running emergency database fixes...");
    await emergencyDatabaseFix();

    console.log("✅ Database initialization completed");
  } catch (error: any) {
    console.error("❌ Startup health check failed:", error.message);
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Server startup aborted");
      process.exit(1);
    } else {
      console.warn("⚠️ Continuing startup in development mode");
    }
  }

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
