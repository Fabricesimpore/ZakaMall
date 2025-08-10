#!/usr/bin/env node

/**
 * Migration script to add notifications table to production database
 * This script creates the notifications table with all required columns
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function runMigration() {
  console.log("🚀 Starting notifications table migration...");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const db = drizzle(pool);

  try {
    // Check if notifications table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ Notifications table already exists. Skipping migration.");
      await pool.end();
      return;
    }

    console.log("📊 Creating notifications table...");

    // Create notifications table
    await db.execute(sql`
      CREATE TABLE notifications (
        "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" VARCHAR NOT NULL,
        "type" VARCHAR NOT NULL,
        "title" VARCHAR NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB,
        "is_read" BOOLEAN DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add foreign key constraint
    await db.execute(sql`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    `);

    // Create index for performance
    await db.execute(sql`
      CREATE INDEX notifications_user_id_created_at_idx 
      ON notifications (user_id, created_at DESC);
    `);

    // Create index for unread notifications
    await db.execute(sql`
      CREATE INDEX notifications_user_id_is_read_idx 
      ON notifications (user_id, is_read) WHERE is_read = false;
    `);

    console.log("✅ Notifications table created successfully!");
    console.log("✅ Foreign key constraints added!");
    console.log("✅ Performance indexes created!");

    await pool.end();
    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
