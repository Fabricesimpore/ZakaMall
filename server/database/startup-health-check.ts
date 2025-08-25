import { validateDatabaseSchema, autoFixMissingTables } from "./schema-validator";
import { ensureDatabaseUpToDate } from "./migration-manager";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Comprehensive Startup Health Check
 * Runs before the server starts to ensure database integrity
 */

export interface HealthCheckResult {
  overall: "healthy" | "warning" | "critical";
  database: {
    connected: boolean;
    schemaValid: boolean;
    migrationsUpToDate: boolean;
  };
  fixes: {
    tablesCreated: string[];
    migrationsApplied: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Test database connectivity
 */
async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1 as test`);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

/**
 * Run comprehensive startup health check
 */
export async function runStartupHealthCheck(
  autoFix: boolean = true
): Promise<HealthCheckResult> {
  console.log("🏥 Starting comprehensive health check...");
  
  const result: HealthCheckResult = {
    overall: "healthy",
    database: {
      connected: false,
      schemaValid: false,
      migrationsUpToDate: false,
    },
    fixes: {
      tablesCreated: [],
      migrationsApplied: false,
    },
    errors: [],
    warnings: [],
  };

  // 1. Test database connection
  console.log("1️⃣ Testing database connection...");
  result.database.connected = await testDatabaseConnection();
  
  if (!result.database.connected) {
    result.errors.push("Database connection failed");
    result.overall = "critical";
    return result;
  }
  console.log("✅ Database connection successful");

  // 2. Check and run migrations
  console.log("2️⃣ Checking database migrations...");
  try {
    result.database.migrationsUpToDate = await ensureDatabaseUpToDate(autoFix);
    
    if (!result.database.migrationsUpToDate) {
      if (autoFix) {
        result.errors.push("Failed to apply pending migrations");
        result.overall = "critical";
      } else {
        result.warnings.push("Pending migrations found - manual intervention required");
        if (result.overall === "healthy") result.overall = "warning";
      }
    } else {
      result.fixes.migrationsApplied = autoFix;
      console.log("✅ Database migrations up to date");
    }
  } catch (error: any) {
    result.errors.push(`Migration check failed: ${error.message}`);
    result.overall = "critical";
  }

  // 3. Validate schema
  console.log("3️⃣ Validating database schema...");
  try {
    const schemaValidation = await validateDatabaseSchema();
    result.database.schemaValid = schemaValidation.isValid;
    
    // Add warnings from schema validation
    result.warnings.push(...schemaValidation.warnings);
    
    if (!schemaValidation.isValid) {
      result.errors.push(...schemaValidation.errors);
      
      if (autoFix && schemaValidation.missingTables.length > 0) {
        console.log("🔧 Auto-fixing missing tables...");
        try {
          await autoFixMissingTables(schemaValidation, false);
          result.fixes.tablesCreated = schemaValidation.missingTables;
          
          // Re-validate after fixes
          const revalidation = await validateDatabaseSchema();
          result.database.schemaValid = revalidation.isValid;
          
          if (revalidation.isValid) {
            console.log("✅ Schema auto-fix successful");
          } else {
            result.errors.push("Schema auto-fix partially successful");
            result.overall = "warning";
          }
        } catch (fixError: any) {
          result.errors.push(`Schema auto-fix failed: ${fixError.message}`);
          result.overall = "critical";
        }
      } else {
        result.overall = "critical";
      }
    } else {
      console.log("✅ Database schema validation passed");
    }
  } catch (error: any) {
    result.errors.push(`Schema validation failed: ${error.message}`);
    result.overall = "critical";
  }

  // 4. Additional health checks
  console.log("4️⃣ Running additional health checks...");
  
  try {
    // Check if we can perform basic operations
    const basicOpsTest = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    
    if (basicOpsTest.rows.length === 0) {
      result.warnings.push("No tables found in public schema");
      if (result.overall === "healthy") result.overall = "warning";
    }
    
    // Test write permissions (if we have a simple table)
    try {
      await db.execute(sql`CREATE TEMP TABLE health_check_temp (id serial)`);
      await db.execute(sql`DROP TABLE health_check_temp`);
    } catch (writeError) {
      result.warnings.push("Database write permissions may be limited");
      if (result.overall === "healthy") result.overall = "warning";
    }
    
  } catch (error: any) {
    result.warnings.push(`Additional health checks failed: ${error.message}`);
    if (result.overall === "healthy") result.overall = "warning";
  }

  // Summary
  console.log("\n📋 Health Check Summary:");
  console.log(`Overall Status: ${result.overall.toUpperCase()}`);
  console.log(`Database Connected: ${result.database.connected ? "✅" : "❌"}`);
  console.log(`Schema Valid: ${result.database.schemaValid ? "✅" : "❌"}`);
  console.log(`Migrations Up to Date: ${result.database.migrationsUpToDate ? "✅" : "❌"}`);
  
  if (result.fixes.tablesCreated.length > 0) {
    console.log(`Tables Created: ${result.fixes.tablesCreated.join(", ")}`);
  }
  
  if (result.fixes.migrationsApplied) {
    console.log("Migrations: Auto-applied");
  }
  
  if (result.warnings.length > 0) {
    console.warn("\n⚠️ Warnings:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
  
  if (result.errors.length > 0) {
    console.error("\n❌ Errors:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  return result;
}

/**
 * Middleware to ensure database health before handling requests
 */
export function createHealthCheckMiddleware() {
  let lastHealthCheck: HealthCheckResult | null = null;
  let lastCheckTime = 0;
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  return async (req: any, res: any, next: any) => {
    const now = Date.now();
    
    // Skip frequent checks
    if (lastHealthCheck && (now - lastCheckTime) < CHECK_INTERVAL) {
      if (lastHealthCheck.overall === "critical") {
        return res.status(503).json({
          error: "Database health check failed",
          details: lastHealthCheck.errors,
        });
      }
      return next();
    }

    try {
      // Quick connectivity check only
      const isConnected = await testDatabaseConnection();
      
      if (!isConnected) {
        return res.status(503).json({
          error: "Database connection failed",
          message: "Service temporarily unavailable",
        });
      }
      
      lastCheckTime = now;
      next();
    } catch (error) {
      console.error("Health check middleware error:", error);
      res.status(503).json({
        error: "Health check failed",
        message: "Service temporarily unavailable",
      });
    }
  };
}