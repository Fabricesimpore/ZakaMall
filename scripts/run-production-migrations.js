#!/usr/bin/env node

/**
 * Production migration runner
 * This script runs all necessary migrations for production deployment
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runProductionMigrations() {
  console.log("🚀 Starting production database migrations...");

  try {
    // Set production environment
    process.env.NODE_ENV = "production";

    console.log("📊 Running notifications table migration...");
    const { stdout, stderr } = await execAsync("node scripts/migrate-notifications.js", {
      env: { ...process.env, NODE_ENV: "production" },
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log("✅ All production migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.stdout) console.log("STDOUT:", error.stdout);
    if (error.stderr) console.error("STDERR:", error.stderr);
    process.exit(1);
  }
}

runProductionMigrations();
