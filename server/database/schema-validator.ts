import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Database Schema Validator
 * Ensures all required tables and columns exist before app starts
 */

export interface TableDefinition {
  name: string;
  required: boolean;
  columns: {
    name: string;
    type: string;
    nullable?: boolean;
    hasDefault?: boolean;
  }[];
}

/**
 * Expected schema definition based on shared/schema.ts
 * This should match your actual schema
 */
export const EXPECTED_SCHEMA: TableDefinition[] = [
  {
    name: "users",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "email", type: "varchar", nullable: true },
      { name: "first_name", type: "varchar", nullable: true },
      { name: "last_name", type: "varchar", nullable: true },
      { name: "role", type: "varchar", nullable: true },
      { name: "created_at", type: "timestamp", nullable: true, hasDefault: true },
      { name: "updated_at", type: "timestamp", nullable: true, hasDefault: true },
    ],
  },
  {
    name: "vendors",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
      { name: "store_name", type: "varchar", nullable: false },
      { name: "store_slug", type: "varchar", nullable: false },
      { name: "status", type: "varchar", nullable: true },
      { name: "created_at", type: "timestamp", nullable: true, hasDefault: true },
    ],
  },
  {
    name: "products",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "vendor_id", type: "varchar", nullable: false },
      { name: "name", type: "varchar", nullable: false },
      { name: "price", type: "numeric", nullable: false },
      { name: "created_at", type: "timestamp", nullable: true, hasDefault: true },
    ],
  },
  {
    name: "orders",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "customer_id", type: "varchar", nullable: false },
      { name: "status", type: "varchar", nullable: true },
      { name: "created_at", type: "timestamp", nullable: true, hasDefault: true },
    ],
  },
  {
    name: "order_items",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "order_id", type: "varchar", nullable: false },
      { name: "product_id", type: "varchar", nullable: false },
      { name: "quantity", type: "integer", nullable: false },
    ],
  },
  {
    name: "cart",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
      { name: "product_id", type: "varchar", nullable: false },
      { name: "quantity", type: "integer", nullable: false },
    ],
  },
  {
    name: "reviews",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
      { name: "product_id", type: "varchar", nullable: false },
      { name: "rating", type: "integer", nullable: false },
    ],
  },
  {
    name: "messages",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "sender_id", type: "varchar", nullable: false },
      { name: "content", type: "text", nullable: false },
    ],
  },
  {
    name: "notifications",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
      { name: "type", type: "varchar", nullable: false },
    ],
  },
  // Optional tables that might not exist in all environments
  {
    name: "vendor_notification_settings",
    required: false,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
    ],
  },
  {
    name: "rate_limit_violations",
    required: false,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
    ],
  },
  {
    name: "user_verifications",
    required: false,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: false },
    ],
  },
  {
    name: "security_events",
    required: false,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "user_id", type: "varchar", nullable: true },
    ],
  },
  {
    name: "payments",
    required: true,
    columns: [
      { name: "id", type: "varchar", nullable: false, hasDefault: true },
      { name: "order_id", type: "varchar", nullable: false },
    ],
  },
];

export interface ValidationResult {
  isValid: boolean;
  missingTables: string[];
  missingColumns: { table: string; column: string }[];
  errors: string[];
  warnings: string[];
}

/**
 * Validate the database schema against expected schema
 */
export async function validateDatabaseSchema(): Promise<ValidationResult> {
  console.log("🔍 Validating database schema...");

  const result: ValidationResult = {
    isValid: true,
    missingTables: [],
    missingColumns: [],
    errors: [],
    warnings: [],
  };

  try {
    // Get all tables in the database
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTables = new Set(tablesResult.rows.map((row: any) => row.table_name));

    // Check for missing tables
    for (const tableDef of EXPECTED_SCHEMA) {
      if (!existingTables.has(tableDef.name)) {
        if (tableDef.required) {
          result.missingTables.push(tableDef.name);
          result.errors.push(`❌ Required table '${tableDef.name}' is missing`);
          result.isValid = false;
        } else {
          result.warnings.push(`⚠️ Optional table '${tableDef.name}' is missing`);
        }
        continue;
      }

      // Table exists, check columns
      const columnsResult = await db.execute(sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = ${tableDef.name}
      `);

      const existingColumns = new Map();
      for (const col of columnsResult.rows as any[]) {
        existingColumns.set(col.column_name, {
          type: col.data_type,
          nullable: col.is_nullable === "YES",
          hasDefault: col.column_default !== null,
        });
      }

      // Check for missing columns
      for (const colDef of tableDef.columns) {
        if (!existingColumns.has(colDef.name)) {
          result.missingColumns.push({ table: tableDef.name, column: colDef.name });
          if (tableDef.required) {
            result.errors.push(
              `❌ Required column '${colDef.name}' is missing from table '${tableDef.name}'`
            );
            result.isValid = false;
          } else {
            result.warnings.push(
              `⚠️ Column '${colDef.name}' is missing from optional table '${tableDef.name}'`
            );
          }
        }
      }
    }

    // Summary
    if (result.isValid) {
      console.log("✅ Database schema validation passed");
    } else {
      console.error("❌ Database schema validation failed");
      console.error("Missing tables:", result.missingTables);
      console.error("Missing columns:", result.missingColumns);
    }

    if (result.warnings.length > 0) {
      console.warn("⚠️ Schema warnings:", result.warnings);
    }
  } catch (error: any) {
    result.isValid = false;
    result.errors.push(`Database validation error: ${error.message}`);
    console.error("❌ Schema validation error:", error);
  }

  return result;
}

/**
 * Generate CREATE TABLE statements for missing tables
 */
export async function generateMissingTableStatements(
  validationResult: ValidationResult
): Promise<string[]> {
  const statements: string[] = [];

  for (const tableName of validationResult.missingTables) {
    const tableDef = EXPECTED_SCHEMA.find((t) => t.name === tableName);
    if (!tableDef) continue;

    let createStatement = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

    const columnDefs = tableDef.columns.map((col) => {
      let colDef = `  "${col.name}" ${col.type.toUpperCase()}`;
      if (!col.nullable) colDef += " NOT NULL";
      if (col.hasDefault && col.name === "id") {
        colDef += " DEFAULT gen_random_uuid()";
      } else if (col.hasDefault && col.name.includes("created_at")) {
        colDef += " DEFAULT CURRENT_TIMESTAMP";
      } else if (col.hasDefault && col.name.includes("updated_at")) {
        colDef += " DEFAULT CURRENT_TIMESTAMP";
      }
      return colDef;
    });

    createStatement += columnDefs.join(",\n");

    // Add primary key
    createStatement += `,\n  PRIMARY KEY ("id")`;
    createStatement += "\n);";

    statements.push(createStatement);
  }

  return statements;
}

/**
 * Auto-fix missing tables (use with caution in production)
 */
export async function autoFixMissingTables(
  validationResult: ValidationResult,
  dryRun: boolean = true
): Promise<void> {
  const statements = await generateMissingTableStatements(validationResult);

  if (statements.length === 0) {
    console.log("✅ No missing tables to fix");
    return;
  }

  if (dryRun) {
    console.log("🔄 DRY RUN - Would execute the following SQL:");
    for (const statement of statements) {
      console.log(statement);
      console.log("---");
    }
    return;
  }

  console.log("🔧 Auto-fixing missing tables...");

  for (const statement of statements) {
    try {
      console.log("Executing:", statement.split("\n")[0] + "...");
      await db.execute(sql.raw(statement));
      console.log("✅ Success");
    } catch (error: any) {
      console.error("❌ Failed:", error.message);
      throw error;
    }
  }

  console.log("✅ Auto-fix completed");
}
