#!/usr/bin/env node

/**
 * Emergency vendor schema fix for production
 * Adds missing vendor columns that are causing query failures
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function emergencyVendorSchemaFix() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log("🚨 EMERGENCY: Fixing vendor schema in production...");
    
    // 1. Check current vendor table columns
    const { rows: columns } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors'
      ORDER BY column_name
    `);
    
    const existingColumns = columns.map(row => row.column_name);
    console.log("📋 Current vendor columns:", existingColumns);
    
    // 2. Add missing columns if they don't exist
    const requiredColumns = [
      { name: 'store_name', type: 'VARCHAR(120)' },
      { name: 'store_slug', type: 'VARCHAR(140) UNIQUE' },
      { name: 'legal_name', type: 'VARCHAR(200)' },
      { name: 'contact_email', type: 'VARCHAR(160)' },
      { name: 'contact_phone', type: 'VARCHAR(40)' },
      { name: 'country_code', type: 'CHAR(2)' },
      { name: 'logo_url', type: 'TEXT' },
      { name: 'banner_url', type: 'TEXT' },
      { name: 'review_notes', type: 'TEXT' }
    ];
    
    for (const col of requiredColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`➕ Adding missing column: ${col.name}`);
        await pool.query(`ALTER TABLE vendors ADD COLUMN ${col.name} ${col.type};`);
      } else {
        console.log(`✅ Column exists: ${col.name}`);
      }
    }
    
    // 3. Migrate data from old columns to new columns if needed
    console.log("🔄 Migrating data to new columns...");
    
    // Check if we need to migrate data (if store_name is empty but shop_name has data)
    const { rows: dataMigrationCheck } = await pool.query(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(store_name) as has_store_name,
        COUNT(shop_name) as has_shop_name,
        COUNT(business_name) as has_business_name
      FROM vendors
    `);
    
    console.log("📊 Data migration analysis:", dataMigrationCheck[0]);
    
    // Migrate data if store_name is mostly empty but shop_name/business_name has data
    if (dataMigrationCheck[0].has_store_name < dataMigrationCheck[0].has_shop_name) {
      console.log("🔄 Migrating shop_name/business_name -> store_name...");
      await pool.query(`
        UPDATE vendors SET 
          store_name = COALESCE(NULLIF(shop_name, ''), business_name),
          legal_name = business_name,
          contact_email = COALESCE(business_email, business_phone),
          contact_phone = business_phone,
          review_notes = admin_notes
        WHERE store_name IS NULL OR store_name = ''
      `);
      console.log("✅ Data migration completed");
    }
    
    // 4. Generate slugs for records that don't have them
    console.log("🔄 Generating missing slugs...");
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
    
    // 5. Verify the fix
    const { rows: verification } = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(store_name) as has_store_name,
        COUNT(store_slug) as has_store_slug,
        COUNT(legal_name) as has_legal_name
      FROM vendors
    `);
    
    console.log("✅ Verification results:", verification[0]);
    
    // 6. Test the problematic query
    console.log("🧪 Testing vendor query...");
    const { rows: testQuery } = await pool.query(`
      SELECT 
        v.id, v.store_name, v.store_slug, v.legal_name, v.status,
        u.email, u.first_name, u.last_name
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.created_at DESC
      LIMIT 3
    `);
    console.log(`✅ Query test successful! Found ${testQuery.length} vendors`);
    
    console.log("🎉 Emergency vendor schema fix completed successfully!");
    
  } catch (error) {
    console.error("❌ Emergency schema fix failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

emergencyVendorSchemaFix().catch(console.error);