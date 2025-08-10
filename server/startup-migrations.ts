/**
 * Startup migrations that run automatically when the server starts
 * This ensures critical tables exist before the application begins serving requests
 */

import { sql } from "drizzle-orm";
import { storage } from "./storage";

export async function runStartupMigrations() {
  console.log("🚀 Running startup migrations...");
  
  try {
    // Check and create notifications table if it doesn't exist
    await ensureNotificationsTable();
    
    console.log("✅ All startup migrations completed successfully!");
  } catch (error) {
    console.error("❌ Startup migrations failed:", error);
    // Don't exit the process - just log the error and continue
    // The API endpoints now handle missing tables gracefully
  }
}

async function ensureNotificationsTable() {
  try {
    // Use the storage's db connection
    const db = (storage as any).db; // Access the internal db connection
    
    // Check if notifications table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ Notifications table already exists.");
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

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX notifications_user_id_created_at_idx 
      ON notifications (user_id, created_at DESC);
    `);

    await db.execute(sql`
      CREATE INDEX notifications_user_id_is_read_idx 
      ON notifications (user_id, is_read) WHERE is_read = false;
    `);

    console.log("✅ Notifications table created successfully with indexes!");
  } catch (error) {
    console.error("❌ Failed to create notifications table:", error);
    throw error;
  }
}