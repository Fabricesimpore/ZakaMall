#!/usr/bin/env node

/**
 * Run vendor optimization migration
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zakamall";
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("🔗 Connected to database");

    // Read and run vendor revamp migration first
    const revampPath = path.join(__dirname, "..", "migrations", "0001_vendor_revamp.sql");
    const revampSQL = fs.readFileSync(revampPath, "utf8");

    console.log("📝 Running vendor revamp migration (0001)...");
    await client.query(revampSQL);

    // Read and run optimization migration
    const optimizationPath = path.join(
      __dirname,
      "..",
      "migrations",
      "0002_vendor_optimization.sql"
    );
    const optimizationSQL = fs.readFileSync(optimizationPath, "utf8");

    console.log("📝 Running vendor optimization migration (0002)...");
    await client.query(optimizationSQL);

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
