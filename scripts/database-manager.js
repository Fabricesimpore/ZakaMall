#!/usr/bin/env node

/**
 * Database Management CLI Tool
 *
 * Usage:
 *   node scripts/database-manager.js validate
 *   node scripts/database-manager.js migrate
 *   node scripts/database-manager.js health-check
 *   node scripts/database-manager.js auto-fix
 */

require("dotenv").config();

const { validateDatabaseSchema } = require("../dist/server/database/schema-validator.js");
const { ensureDatabaseUpToDate } = require("../dist/server/database/migration-manager.js");
const { runStartupHealthCheck } = require("../dist/server/database/startup-health-check.js");

async function validateSchema() {
  console.log("🔍 Validating database schema...");

  try {
    const result = await validateDatabaseSchema();

    if (result.isValid) {
      console.log("✅ Schema validation passed");
      process.exit(0);
    } else {
      console.log("❌ Schema validation failed");
      console.log("Missing tables:", result.missingTables);
      console.log("Missing columns:", result.missingColumns);
      console.log("Errors:", result.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Schema validation error:", error.message);
    process.exit(1);
  }
}

async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    const success = await ensureDatabaseUpToDate(true);

    if (success) {
      console.log("✅ Migrations completed successfully");
      process.exit(0);
    } else {
      console.log("❌ Migrations failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  }
}

async function healthCheck() {
  console.log("🏥 Running comprehensive health check...");

  try {
    const result = await runStartupHealthCheck(false); // Don't auto-fix

    console.log("\n📋 Health Check Results:");
    console.log(`Overall Status: ${result.overall.toUpperCase()}`);
    console.log(`Database Connected: ${result.database.connected ? "✅" : "❌"}`);
    console.log(`Schema Valid: ${result.database.schemaValid ? "✅" : "❌"}`);
    console.log(`Migrations Up to Date: ${result.database.migrationsUpToDate ? "✅" : "❌"}`);

    if (result.warnings.length > 0) {
      console.log("\n⚠️ Warnings:");
      result.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }

    if (result.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    process.exit(result.overall === "critical" ? 1 : 0);
  } catch (error) {
    console.error("❌ Health check error:", error.message);
    process.exit(1);
  }
}

async function autoFix() {
  console.log("🔧 Running auto-fix...");

  try {
    const healthResult = await runStartupHealthCheck(true); // Auto-fix enabled

    if (healthResult.overall === "critical") {
      console.log("❌ Auto-fix failed - critical issues remain");
      process.exit(1);
    } else {
      console.log("✅ Auto-fix completed");

      if (healthResult.fixes.tablesCreated.length > 0) {
        console.log("Tables created:", healthResult.fixes.tablesCreated);
      }

      if (healthResult.fixes.migrationsApplied) {
        console.log("Migrations applied successfully");
      }

      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Auto-fix error:", error.message);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "validate":
      await validateSchema();
      break;
    case "migrate":
      await runMigrations();
      break;
    case "health-check":
      await healthCheck();
      break;
    case "auto-fix":
      await autoFix();
      break;
    default:
      console.log("Usage: node scripts/database-manager.js <command>");
      console.log("Commands:");
      console.log("  validate    - Validate database schema");
      console.log("  migrate     - Run pending migrations");
      console.log("  health-check - Run comprehensive health check");
      console.log("  auto-fix    - Auto-fix database issues");
      process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Database manager error:", error);
    process.exit(1);
  });
}