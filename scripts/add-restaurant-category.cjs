#!/usr/bin/env node

/**
 * Safe migration to add Restaurant category
 * This script adds a restaurant category without affecting existing functionality
 */

const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addRestaurantCategory() {
  const client = await pool.connect();

  try {
    console.log("🍽️ Adding Restaurant category...");

    // Check if restaurant category already exists
    const existingCategory = await client.query(
      `SELECT id FROM categories WHERE name ILIKE 'Restaurant%' OR name ILIKE '%restaurant%'`
    );

    if (existingCategory.rows.length > 0) {
      console.log("✅ Restaurant category already exists:", existingCategory.rows[0]);
      return;
    }

    // Insert the restaurant category
    const result = await client.query(`
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
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name;
    `);

    if (result.rows.length > 0) {
      console.log("✅ Successfully added Restaurant category:", result.rows[0]);
    } else {
      console.log("ℹ️ Restaurant category already exists (conflict ignored)");
    }

    // Show all categories after insertion
    const allCategories = await client.query(`
      SELECT id, name, sort_order, is_active 
      FROM categories 
      ORDER BY sort_order, name;
    `);

    console.log("\n📋 Current categories:");
    allCategories.rows.forEach((cat) => {
      console.log(
        `   ${cat.is_active ? "✓" : "✗"} ${cat.name} (${cat.id}) - Sort: ${cat.sort_order}`
      );
    });
  } catch (error) {
    console.error("❌ Error adding restaurant category:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

addRestaurantCategory().catch(console.error);
