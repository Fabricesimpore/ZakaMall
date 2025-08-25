import { db } from "./db.js";
import { sql } from "drizzle-orm";

/**
 * Emergency database fix for missing vendor columns
 * This will run automatically on server startup if the columns are missing
 */
export async function emergencyDatabaseFix() {
  try {
    console.log("🔧 Checking for missing vendor columns in products table...");

    // Check if columns exist
    const columnCheckResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name IN ('vendor_display_name', 'vendor_slug')
    `);

    const existingColumns = columnCheckResult.rows.length;
    console.log(`📊 Found ${existingColumns}/2 vendor columns in products table`);

    if (existingColumns === 2) {
      console.log("✅ All vendor columns exist, skipping emergency fix");
      return;
    }

    console.log("🚨 Missing vendor columns detected, applying emergency fix...");

    // Apply the fix
    await db.execute(sql`
      -- Add vendor display fields to products if they don't exist
      ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS vendor_display_name varchar(120),
        ADD COLUMN IF NOT EXISTS vendor_slug varchar(140);
    `);

    await db.execute(sql`
      -- Create indexes for the new columns to optimize searches
      CREATE INDEX IF NOT EXISTS idx_products_vendor_display_name ON products(vendor_display_name);
      CREATE INDEX IF NOT EXISTS idx_products_vendor_slug ON products(vendor_slug);
    `);

    // Update existing products with vendor display names and slugs
    // Handle both old (shop_name) and new (store_name) column names
    try {
      await db.execute(sql`
        UPDATE products 
        SET 
          vendor_display_name = COALESCE(vendors.store_name, vendors.shop_name, vendors.business_name),
          vendor_slug = vendors.store_slug
        FROM vendors
        WHERE products.vendor_id = vendors.id
          AND (products.vendor_display_name IS NULL OR products.vendor_slug IS NULL);
      `);
    } catch {
      // Fallback for older schema that might not have store_name
      console.log("🔄 Trying fallback update with legacy column names...");
      await db.execute(sql`
        UPDATE products 
        SET 
          vendor_display_name = COALESCE(vendors.shop_name, vendors.business_name),
          vendor_slug = vendors.store_slug
        FROM vendors
        WHERE products.vendor_id = vendors.id
          AND (products.vendor_display_name IS NULL OR products.vendor_slug IS NULL);
      `);
    }

    // Verify the fix
    const verificationResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_products,
        COUNT(vendor_display_name) as products_with_vendor_name,
        COUNT(vendor_slug) as products_with_vendor_slug
      FROM products
    `);

    const stats = verificationResult.rows[0] as any;
    console.log("✅ Emergency database fix completed successfully!");
    console.log(
      `📦 Products: ${stats.total_products} total, ${stats.products_with_vendor_name} with vendor names, ${stats.products_with_vendor_slug} with vendor slugs`
    );
  } catch (error) {
    console.error("❌ Emergency database fix failed:", error);
    // Don't throw - let the app continue with degraded functionality
  }
}
