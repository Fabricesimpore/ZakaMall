#!/usr/bin/env node

/**
 * Verify that products are properly set up with vendor information
 * This helps debug the "Produit introuvable" issue
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function verifyProductsSetup() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log("🔍 Verifying products setup...");

    // Check total products
    const { rows: [{ count: totalProducts }] } = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE is_active = true"
    );
    console.log(`📦 Total active products: ${totalProducts}`);

    // Check products with vendor information
    const { rows: [{ count: productsWithVendor }] } = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE vendor_display_name IS NOT NULL AND is_active = true"
    );
    console.log(`🏪 Products with vendor names: ${productsWithVendor}`);

    // Sample some products
    const { rows: sampleProducts } = await pool.query(`
      SELECT 
        id, 
        name, 
        vendor_id, 
        vendor_display_name, 
        vendor_slug,
        is_active,
        price
      FROM products 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("\n📋 Sample products:");
    sampleProducts.forEach(product => {
      console.log(`  • ${product.name} (${product.id})`);
      console.log(`    Vendor: ${product.vendor_display_name || 'Missing'} (ID: ${product.vendor_id})`);
      console.log(`    Price: ${product.price} | Active: ${product.is_active}`);
      console.log(`    Slug: ${product.vendor_slug || 'Missing'}`);
      console.log();
    });

    // Check vendors table
    const { rows: [{ count: totalVendors }] } = await pool.query(
      "SELECT COUNT(*) as count FROM vendors WHERE status = 'approved'"
    );
    console.log(`🏢 Approved vendors: ${totalVendors}`);

    // Check for orphaned products
    const { rows: [{ count: orphanedProducts }] } = await pool.query(`
      SELECT COUNT(*) as count 
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.is_active = true AND v.id IS NULL
    `);
    
    if (orphanedProducts > 0) {
      console.log(`⚠️  Orphaned products (no vendor): ${orphanedProducts}`);
    } else {
      console.log("✅ No orphaned products found");
    }

    console.log("\n🎉 Products verification completed!");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyProductsSetup().catch(console.error);