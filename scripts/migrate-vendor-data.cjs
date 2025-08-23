#!/usr/bin/env node

/**
 * Simple vendor data migration script
 * Migrates existing vendor data to new schema columns
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function migrateVendorData() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log("🔄 Migrating vendor data to new schema...");
    
    // Simple data migration - only use columns we know exist
    await pool.query(`
      UPDATE vendors SET 
        store_name = COALESCE(NULLIF(shop_name, ''), business_name),
        legal_name = business_name,
        contact_email = business_phone,
        contact_phone = business_phone,
        review_notes = admin_notes
      WHERE store_name IS NULL OR store_name = ''
    `);
    console.log("✅ Basic data migration completed");
    
    // Generate slugs for records that don't have them
    await pool.query(`
      UPDATE vendors SET store_slug = 
        LOWER(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                COALESCE(store_name, 'store'), 
                '[^a-zA-Z0-9\\s\\-]', '', 'g'
              ), 
              '\\s+', '-', 'g'
            ), 
            '^-+|-+$', '', 'g'
          )
        ) || '-' || SUBSTRING(id FROM 1 FOR 8)
      WHERE store_slug IS NULL OR store_slug = ''
    `);
    console.log("✅ Slugs generated");
    
    // Verify the results
    const { rows: verification } = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(store_name) as has_store_name,
        COUNT(store_slug) as has_store_slug
      FROM vendors
    `);
    
    console.log("📊 Migration results:", verification[0]);
    
    console.log("🎉 Vendor data migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Data migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateVendorData().catch(console.error);