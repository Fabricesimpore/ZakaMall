#!/usr/bin/env node

/**
 * Emergency fix for missing vendor_display_name and vendor_slug columns in products table
 * This should be run immediately in production to fix the database schema mismatch
 */

const { Pool } = require("pg");

// Production database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function runFix() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log("🔧 Starting emergency products table fix...");

    // Check if columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name IN ('vendor_display_name', 'vendor_slug')
    `;
    
    const { rows: existingColumns } = await pool.query(checkColumnsQuery);
    console.log(`📊 Found ${existingColumns.length} existing vendor columns`);

    if (existingColumns.length === 2) {
      console.log("✅ Both vendor columns already exist");
      return;
    }

    // Read and execute the migration
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "..", "migrations", "0003_add_vendor_denormalized_fields.sql");
    
    if (!fs.existsSync(migrationPath)) {
      console.error("❌ Migration file not found:", migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    console.log("🚀 Applying vendor fields migration...");
    await pool.query(migrationSQL);
    
    // Verify the fix
    const { rows: updatedColumns } = await pool.query(checkColumnsQuery);
    console.log(`✅ Now have ${updatedColumns.length} vendor columns in products table`);

    // Check how many products were updated
    const { rows: [{ count }] } = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE vendor_display_name IS NOT NULL"
    );
    console.log(`📦 Updated ${count} products with vendor display names`);

    console.log("🎉 Emergency fix completed successfully!");

  } catch (error) {
    console.error("❌ Emergency fix failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runFix().catch(console.error);