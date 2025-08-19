import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function fixCategories() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Starting category reorganization...");

    // First, identify and keep only one of each duplicate category (the oldest one)
    console.log("Identifying duplicate categories...");
    const duplicates = await client.query(`
      SELECT name, MIN(id) as keep_id, ARRAY_AGG(id ORDER BY created_at) as all_ids
      FROM categories
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    // Update products to use the keeper category
    for (const dup of duplicates.rows) {
      const keepId = dup.keep_id;
      const deleteIds = dup.all_ids.filter(id => id !== keepId);
      
      console.log(`Merging duplicates for "${dup.name}"...`);
      
      // Update all products pointing to duplicate categories
      for (const deleteId of deleteIds) {
        await client.query(
          'UPDATE products SET category_id = $1 WHERE category_id = $2',
          [keepId, deleteId]
        );
      }
      
      // Now delete the duplicate categories
      for (const deleteId of deleteIds) {
        await client.query('DELETE FROM categories WHERE id = $1', [deleteId]);
      }
    }

    // Handle "Beauté & Santé" category specially
    console.log("Handling 'Beauté & Santé' category...");
    const beauteEtSante = await client.query(
      `SELECT id FROM categories WHERE name = 'Beauté & Santé' LIMIT 1`
    );
    
    let beauteCategoryId = null;
    
    if (beauteEtSante.rows.length > 0) {
      const oldId = beauteEtSante.rows[0].id;
      
      // First create the new "Beauté" category
      const beauteResult = await client.query(
        `INSERT INTO categories (name, description, icon, is_active, sort_order) 
         VALUES ('Beauté', 'Produits de beauté, cosmétiques, et soins', 'sparkles', true, 0)
         RETURNING id`
      );
      beauteCategoryId = beauteResult.rows[0].id;
      console.log(`✅ Added category: Beauté`);
      
      // Update products to use the new "Beauté" category
      await client.query(
        'UPDATE products SET category_id = $1 WHERE category_id = $2',
        [beauteCategoryId, oldId]
      );
      
      // Now delete the old combined category
      await client.query('DELETE FROM categories WHERE id = $1', [oldId]);
      console.log(`✅ Removed old 'Beauté & Santé' category`);
    } else {
      // Just create Beauté if it doesn't exist
      const existing = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        ['Beauté']
      );
      
      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO categories (name, description, icon, is_active, sort_order) VALUES ($1, $2, $3, true, 0)',
          ['Beauté', 'Produits de beauté, cosmétiques, et soins', 'sparkles']
        );
        console.log(`✅ Added category: Beauté`);
      }
    }

    // Add other new categories if they don't exist
    console.log("Adding new categories...");
    
    const newCategories = [
      {
        name: 'Santé',
        description: 'Produits de santé, médicaments, et bien-être',
        icon: 'heart'
      },
      {
        name: 'Autre',
        description: 'Autres produits et services',
        icon: 'package'
      }
    ];

    for (const category of newCategories) {
      // Check if category already exists
      const existing = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [category.name]
      );
      
      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO categories (name, description, icon, is_active, sort_order) VALUES ($1, $2, $3, true, 0)',
          [category.name, category.description, category.icon]
        );
        console.log(`✅ Added category: ${category.name}`);
      } else {
        console.log(`⚠️  Category already exists: ${category.name}`);
      }
    }

    console.log("\n✅ Category reorganization completed successfully!");
    
    // Show final categories
    const finalCategories = await client.query(
      'SELECT name, description FROM categories ORDER BY name'
    );
    
    console.log("\nFinal categories:");
    finalCategories.rows.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.description}`);
    });

  } catch (error) {
    console.error("Error reorganizing categories:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixCategories();