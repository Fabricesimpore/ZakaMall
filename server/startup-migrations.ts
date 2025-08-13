/**
 * Startup migrations that run automatically when the server starts
 * This ensures critical tables exist before the application begins serving requests
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runStartupMigrations() {
  console.log("🚀 Running startup migrations...");

  try {
    // Check and create notifications table if it doesn't exist
    await ensureNotificationsTable();

    // Check and create security tables if they don't exist
    await ensureSecurityTables();

    console.log("✅ All startup migrations completed successfully!");
  } catch (error) {
    console.error("❌ Startup migrations failed:", error);
    // Don't exit the process - just log the error and continue
    // The API endpoints now handle missing tables gracefully
  }
}

async function ensureNotificationsTable() {
  try {
    // Use the imported db connection

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

async function ensureSecurityTables() {
  try {
    // Check and create required enum types first
    await ensureEnumTypes();

    // Check and create blacklist table
    await ensureBlacklistTable();

    console.log("✅ Security tables created successfully!");
  } catch (error) {
    console.error("❌ Failed to create security tables:", error);
    throw error;
  }
}

async function ensureEnumTypes() {
  try {
    // Create blacklist_type enum if it doesn't exist
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE blacklist_type AS ENUM (
          'ip_address',
          'email_domain', 
          'phone_number',
          'device_fingerprint',
          'credit_card_hash',
          'user_account'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("✅ Enum types ensured.");
  } catch (error) {
    console.error("❌ Failed to create enum types:", error);
    throw error;
  }
}

async function ensureBlacklistTable() {
  try {
    // Check if blacklist table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blacklist'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ Blacklist table already exists.");
      return;
    }

    console.log("📊 Creating blacklist table...");

    // Create blacklist table
    await db.execute(sql`
      CREATE TABLE blacklist (
        "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" blacklist_type NOT NULL,
        "value" VARCHAR NOT NULL,
        "reason" TEXT NOT NULL,
        "severity" VARCHAR NOT NULL,
        "is_active" BOOLEAN DEFAULT true,
        "expires_at" TIMESTAMP,
        "added_by" VARCHAR NOT NULL,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add foreign key constraint
    await db.execute(sql`
      ALTER TABLE blacklist 
      ADD CONSTRAINT blacklist_added_by_fkey 
      FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE;
    `);

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX blacklist_type_value_active_idx 
      ON blacklist (type, value, is_active);
    `);

    await db.execute(sql`
      CREATE INDEX blacklist_expires_at_idx 
      ON blacklist (expires_at) WHERE expires_at IS NOT NULL;
    `);

    console.log("✅ Blacklist table created successfully with indexes!");
  } catch (error) {
    console.error("❌ Failed to create blacklist table:", error);
    throw error;
  }
}
