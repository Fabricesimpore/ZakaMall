/**
 * Database Management System
 * 
 * Comprehensive database management with:
 * - Schema validation
 * - Migration management  
 * - Health checks
 * - Auto-healing capabilities
 */

export { validateDatabaseSchema, autoFixMissingTables } from "./schema-validator";
export { 
  checkMigrationStatus, 
  runPendingMigrations, 
  generateMigration,
  ensureDatabaseUpToDate 
} from "./migration-manager";
export { 
  runStartupHealthCheck, 
  createHealthCheckMiddleware 
} from "./startup-health-check";

// Re-export database instance
export { db } from "../db";