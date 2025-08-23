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

    // Add restaurant category
    await addRestaurantCategoryMigration();

    // Add video support to products
    await addVideoSupportToProducts();

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

    // Check and create recommendation system tables
    await ensureRecommendationTables();

    console.log("✅ Security and recommendation tables created successfully!");
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

async function ensureRecommendationTables() {
  try {
    // Create user_behavior table
    await ensureUserBehaviorTable();

    // Create search_logs table
    await ensureSearchLogsTable();

    // Create product_similarities table
    await ensureProductSimilaritiesTable();

    // Create user_preferences table
    await ensureUserPreferencesTable();

    console.log("✅ Recommendation tables created successfully!");
  } catch (error) {
    console.error("❌ Failed to create recommendation tables:", error);
    throw error;
  }
}

async function ensureUserBehaviorTable() {
  try {
    // Check if user_behavior table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_behavior'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ User behavior table already exists.");
      return;
    }

    console.log("📊 Creating user_behavior table...");

    // Create user_behavior table
    await db.execute(sql`
      CREATE TABLE user_behavior (
        "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" VARCHAR REFERENCES users(id),
        "session_id" VARCHAR,
        "product_id" VARCHAR NOT NULL REFERENCES products(id),
        "action_type" VARCHAR NOT NULL,
        "duration" INTEGER,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX user_behavior_user_id_idx ON user_behavior(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX user_behavior_product_id_idx ON user_behavior(product_id);
    `);

    await db.execute(sql`
      CREATE INDEX user_behavior_session_id_idx ON user_behavior(session_id);
    `);

    await db.execute(sql`
      CREATE INDEX user_behavior_created_at_idx ON user_behavior(created_at DESC);
    `);

    console.log("✅ User behavior table created successfully!");
  } catch (error) {
    console.error("❌ Failed to create user_behavior table:", error);
    throw error;
  }
}

async function ensureSearchLogsTable() {
  try {
    // Check if search_logs table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'search_logs'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ Search logs table already exists.");
      return;
    }

    console.log("📊 Creating search_logs table...");

    // Create search_logs table
    await db.execute(sql`
      CREATE TABLE search_logs (
        "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" VARCHAR REFERENCES users(id),
        "query" VARCHAR NOT NULL,
        "results_count" INTEGER DEFAULT 0,
        "session_id" VARCHAR,
        "ip_address" VARCHAR,
        "user_agent" TEXT,
        "filters" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX search_logs_user_id_idx ON search_logs(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX search_logs_query_idx ON search_logs(query);
    `);

    await db.execute(sql`
      CREATE INDEX search_logs_created_at_idx ON search_logs(created_at DESC);
    `);

    console.log("✅ Search logs table created successfully!");
  } catch (error) {
    console.error("❌ Failed to create search_logs table:", error);
    throw error;
  }
}

async function ensureProductSimilaritiesTable() {
  try {
    // Check if product_similarities table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_similarities'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ Product similarities table already exists.");
      return;
    }

    console.log("📊 Creating product_similarities table...");

    // Create product_similarities table
    await db.execute(sql`
      CREATE TABLE product_similarities (
        "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_a_id" VARCHAR NOT NULL REFERENCES products(id),
        "product_b_id" VARCHAR NOT NULL REFERENCES products(id),
        "similarity_score" DECIMAL(5, 4) NOT NULL,
        "similarity_type" VARCHAR NOT NULL,
        "last_updated" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX product_similarities_product_a_idx ON product_similarities(product_a_id);
    `);

    await db.execute(sql`
      CREATE INDEX product_similarities_product_b_idx ON product_similarities(product_b_id);
    `);

    await db.execute(sql`
      CREATE INDEX product_similarities_score_idx ON product_similarities(similarity_score DESC);
    `);

    console.log("✅ Product similarities table created successfully!");
  } catch (error) {
    console.error("❌ Failed to create product_similarities table:", error);
    throw error;
  }
}

async function ensureUserPreferencesTable() {
  try {
    // Check if user_preferences table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences'
      );
    `);

    if (tableExists.rows[0]?.exists) {
      console.log("✅ User preferences table already exists.");
      return;
    }

    console.log("📊 Creating user_preferences table...");

    // Create user_preferences table
    await db.execute(sql`
      CREATE TABLE user_preferences (
        "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" VARCHAR NOT NULL REFERENCES users(id),
        "category_id" VARCHAR REFERENCES categories(id),
        "vendor_id" VARCHAR REFERENCES vendors(id),
        "price_range" VARCHAR,
        "preference_score" DECIMAL(5, 4) NOT NULL,
        "preference_type" VARCHAR NOT NULL,
        "last_updated" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX user_preferences_user_id_idx ON user_preferences(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX user_preferences_category_id_idx ON user_preferences(category_id);
    `);

    await db.execute(sql`
      CREATE INDEX user_preferences_vendor_id_idx ON user_preferences(vendor_id);
    `);

    console.log("✅ User preferences table created successfully!");
  } catch (error) {
    console.error("❌ Failed to create user_preferences table:", error);
    throw error;
  }
}

// Migration to add Restaurant category
async function addRestaurantCategoryMigration() {
  try {
    console.log("🍽️ Adding Restaurant category...");

    // Check if restaurant category already exists
    const existingCategory = await db.execute(sql`
      SELECT id FROM categories WHERE name ILIKE 'Restaurant%' OR id = 'restaurant'
    `);
    
    if (existingCategory.length > 0) {
      console.log("✅ Restaurant category already exists, skipping...");
      return;
    }

    // Insert the restaurant category
    await db.execute(sql`
      INSERT INTO categories (id, name, name_en, description, icon, sort_order, is_active)
      VALUES (
        'restaurant',
        'Restaurant', 
        'Restaurant',
        'Restaurants locaux et livraison de repas',
        'fas fa-utensils',
        1,
        true
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("✅ Restaurant category added successfully!");
  } catch (error) {
    console.error("❌ Failed to add restaurant category:", error);
    // Don't throw - this shouldn't break the app if it fails
  }
}

// Migration to add video support to products
async function addVideoSupportToProducts() {
  try {
    console.log("🎥 Adding video support to products...");

    // Check if videos column already exists
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'videos'
    `);
    
    if (columnExists.length > 0) {
      console.log("✅ Videos column already exists, skipping...");
      return;
    }

    // Add videos column to products table (array of text for video URLs)
    await db.execute(sql`
      ALTER TABLE products 
      ADD COLUMN videos TEXT[]
    `);

    console.log("✅ Video support added to products table!");
  } catch (error) {
    console.error("❌ Failed to add video support to products:", error);
    // Don't throw - this shouldn't break the app if it fails
  }
}
