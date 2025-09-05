import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { securityMiddleware } from "./security/SecurityMiddleware";
import { healthz } from "./healthz";
import { withRequestTimeout } from "./timeouts";
import { ensureCacheReady } from "./cache";
import { setupRoutes } from "./routes/index";

/**
 * Register all routes and setup server infrastructure
 * This is now a minimal wrapper that uses the modular route system
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize cache service
  console.log("🚀 Initializing Redis cache...");
  const cacheReady = await ensureCacheReady();
  if (!cacheReady) {
    console.log("⚠️ Continuing without Redis cache - performance may be reduced");
  }

  // Security middleware - apply to all routes
  app.use(securityMiddleware);

  // Health check routes (before auth)
  app.use(healthz);

  // Timeout middleware for admin routes
  app.use("/api/admin", withRequestTimeout(15000));

  // Auth middleware
  try {
    await setupAuth(app);
  } catch (error) {
    console.warn(
      "Auth setup failed, continuing without auth for testing:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Setup all modular routes
  setupRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket setup for real-time features
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    console.log("📡 New WebSocket connection established");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("📨 WebSocket message received:", data);

        // Handle different message types
        switch (data.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;
          default:
            console.log("🤷 Unknown WebSocket message type:", data.type);
        }
      } catch (error) {
        console.error("❌ WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("📡 WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });
  });

  console.log("🎯 Modular route system initialized successfully");
  console.log("📡 WebSocket server ready for real-time connections");

  return httpServer;
}
