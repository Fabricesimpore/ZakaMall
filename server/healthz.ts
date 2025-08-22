import { Router } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

export const healthz = Router();

healthz.get("/health", async (req, res) => {
  try {
    // Quick database health check with timeout
    await db.execute(sql`SELECT 1`);
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    res.status(500).json({ 
      status: "unhealthy", 
      error: error?.message || "database_error",
      timestamp: new Date().toISOString()
    });
  }
});

healthz.get("/healthz", async (req, res) => {
  try {
    // Simple ping for k8s/Railway health checks
    await db.execute(sql`SELECT 1`);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || "db_error" });
  }
});