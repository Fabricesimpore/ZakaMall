#!/usr/bin/env node

/**
 * Test the getAllUsers function directly from storage
 * This simulates what the API endpoint does
 */

const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function testStorageFunction() {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    console.log("🧪 Testing storage.getAllUsers() simulation...");

    // Import the users table schema
    const { users } = await import("../shared/schema.js");
    const { desc } = await import("drizzle-orm");

    console.log("📦 Successfully imported users schema and desc function");

    // Simulate the getAllUsers() function
    console.log("🔍 Executing: db.select().from(users).orderBy(desc(users.createdAt))");
    const startTime = Date.now();

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    const endTime = Date.now();
    console.log(`✅ Query completed in ${endTime - startTime}ms`);
    console.log(`📊 Returned ${allUsers.length} users`);

    // Show sample of returned data
    if (allUsers.length > 0) {
      const sample = allUsers.slice(0, 3);
      console.log("📋 Sample users:");
      sample.forEach((user) => {
        console.log(`  • ${user.email} - ${user.role || "null"} (${user.id})`);
      });
    }

    console.log("✅ Storage function test completed successfully!");
  } catch (error) {
    console.error("❌ Storage function test failed:", error);
    console.error("Full error:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.split("\n").slice(0, 10),
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testStorageFunction().catch(console.error);
