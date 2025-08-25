import { db } from "../db";
import { sql } from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Migration Manager
 * Handles automatic database migrations and ensures schema consistency
 */

export interface MigrationStatus {
  hasUnappliedMigrations: boolean;
  lastAppliedMigration: string | null;
  pendingMigrations: string[];
  migrationTableExists: boolean;
}

/**
 * Check migration status
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  console.log("🔍 Checking migration status...");
  
  try {
    // Check if migration table exists
    const migrationTableResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      ) as exists
    `);
    
    const migrationTableExists = migrationTableResult.rows[0]?.exists as boolean;
    
    if (!migrationTableExists) {
      return {
        hasUnappliedMigrations: true,
        lastAppliedMigration: null,
        pendingMigrations: ["Initial migration table creation"],
        migrationTableExists: false,
      };
    }

    // Get last applied migration
    const lastMigrationResult = await db.execute(sql`
      SELECT hash, created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    const lastAppliedMigration = lastMigrationResult.rows[0]?.hash || null;
    
    // For now, we'll use a simple check
    // In a real implementation, you'd compare with actual migration files
    return {
      hasUnappliedMigrations: false,
      lastAppliedMigration,
      pendingMigrations: [],
      migrationTableExists: true,
    };
    
  } catch (error: any) {
    console.error("❌ Error checking migration status:", error.message);
    return {
      hasUnappliedMigrations: true,
      lastAppliedMigration: null,
      pendingMigrations: ["Unknown - error occurred"],
      migrationTableExists: false,
    };
  }
}

/**
 * Run pending migrations
 */
export async function runPendingMigrations(): Promise<boolean> {
  console.log("🔄 Running pending migrations...");
  
  try {
    // Use Drizzle's migration command
    const { stdout, stderr } = await execAsync("npx drizzle-kit migrate", {
      env: process.env,
      cwd: process.cwd(),
    });
    
    if (stderr && !stderr.includes("No migrations to apply")) {
      console.error("Migration stderr:", stderr);
    }
    
    console.log("Migration output:", stdout);
    console.log("✅ Migrations completed successfully");
    return true;
    
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    if (error.stdout) console.error("stdout:", error.stdout);
    if (error.stderr) console.error("stderr:", error.stderr);
    return false;
  }
}

/**
 * Generate new migration from schema changes
 */
export async function generateMigration(name?: string): Promise<boolean> {
  const migrationName = name || `migration_${Date.now()}`;
  console.log(`🔄 Generating migration: ${migrationName}`);
  
  try {
    const { stdout, stderr } = await execAsync(
      `npx drizzle-kit generate --name="${migrationName}"`,
      {
        env: process.env,
        cwd: process.cwd(),
      }
    );
    
    if (stderr) {
      console.error("Generate stderr:", stderr);
    }
    
    console.log("Generate output:", stdout);
    console.log("✅ Migration generated successfully");
    return true;
    
  } catch (error: any) {
    console.error("❌ Migration generation failed:", error.message);
    return false;
  }
}

/**
 * Introspect database and generate schema
 */
export async function introspectDatabase(): Promise<boolean> {
  console.log("🔍 Introspecting database schema...");
  
  try {
    const { stdout, stderr } = await execAsync("npx drizzle-kit introspect", {
      env: process.env,
      cwd: process.cwd(),
    });
    
    if (stderr) {
      console.error("Introspect stderr:", stderr);
    }
    
    console.log("Introspect output:", stdout);
    console.log("✅ Database introspection completed");
    return true;
    
  } catch (error: any) {
    console.error("❌ Database introspection failed:", error.message);
    return false;
  }
}

/**
 * Push schema changes directly (for development)
 */
export async function pushSchemaChanges(): Promise<boolean> {
  console.log("🔄 Pushing schema changes...");
  
  try {
    const { stdout, stderr } = await execAsync("npx drizzle-kit push", {
      env: process.env,
      cwd: process.cwd(),
    });
    
    if (stderr && !stderr.includes("No schema changes")) {
      console.error("Push stderr:", stderr);
    }
    
    console.log("Push output:", stdout);
    console.log("✅ Schema push completed");
    return true;
    
  } catch (error: any) {
    console.error("❌ Schema push failed:", error.message);
    return false;
  }
}

/**
 * Comprehensive migration check and auto-apply
 */
export async function ensureDatabaseUpToDate(
  autoApply: boolean = false
): Promise<boolean> {
  console.log("🔍 Ensuring database is up to date...");
  
  try {
    const migrationStatus = await checkMigrationStatus();
    
    if (!migrationStatus.migrationTableExists) {
      console.log("📋 Migration table doesn't exist, initializing...");
      if (autoApply) {
        const success = await runPendingMigrations();
        if (!success) {
          console.error("❌ Failed to initialize migrations");
          return false;
        }
      } else {
        console.warn("⚠️ Migration table missing - run migrations manually");
        return false;
      }
    }
    
    if (migrationStatus.hasUnappliedMigrations) {
      console.log("📋 Pending migrations found:");
      migrationStatus.pendingMigrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration}`);
      });
      
      if (autoApply) {
        console.log("🔄 Auto-applying migrations...");
        const success = await runPendingMigrations();
        if (!success) {
          console.error("❌ Failed to apply migrations");
          return false;
        }
      } else {
        console.warn("⚠️ Pending migrations found - run migrations manually");
        return false;
      }
    }
    
    console.log("✅ Database is up to date");
    return true;
    
  } catch (error: any) {
    console.error("❌ Error ensuring database is up to date:", error.message);
    return false;
  }
}