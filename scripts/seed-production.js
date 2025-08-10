#!/usr/bin/env node

/**
 * Seed production database with sample categories and products
 * Run with: node scripts/seed-production.js
 */

import { Pool } from "pg";

// Production database URL from Railway
const DATABASE_URL =
  "postgresql://postgres:WkNDVAmxKaRDJYpCqvHhXykoLcZpYBws@turntable.proxy.rlwy.net:48496/railway";

async function seedProduction() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🌱 Seeding production database with sample data...\n");

    // Check if data already exists
    const existingCategories = await pool.query("SELECT COUNT(*) as count FROM categories");
    const existingProducts = await pool.query("SELECT COUNT(*) as count FROM products");

    console.log(`📂 Existing categories: ${existingCategories.rows[0].count}`);
    console.log(`📦 Existing products: ${existingProducts.rows[0].count}\n`);

    if (existingCategories.rows[0].count > 0 && existingProducts.rows[0].count > 0) {
      console.log("✅ Data already exists, skipping seed");
      return;
    }

    // Get a vendor user to associate products with
    const vendorResult = await pool.query("SELECT id FROM vendors LIMIT 1");
    if (vendorResult.rows.length === 0) {
      console.log("❌ No vendor found. Creating vendor first...");

      // Get admin user to create vendor record
      const adminResult = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      if (adminResult.rows.length > 0) {
        const userId = adminResult.rows[0].id;

        // Create vendor record
        await pool.query(
          `
          INSERT INTO vendors (id, user_id, shop_name, shop_description, address, phone, status, created_at)
          VALUES (gen_random_uuid(), $1, 'ZakaMall Store', 'Boutique officielle ZakaMall avec une grande variété de produits', 'Ouagadougou, Burkina Faso', '+22670123456', 'approved', NOW())
        `,
          [userId]
        );

        console.log("✅ Created vendor record");
      }
    }

    // Get vendor ID
    const vendor = await pool.query("SELECT id FROM vendors LIMIT 1");
    const vendorId = vendor.rows[0].id;

    // Create categories only if none exist
    if (existingCategories.rows[0].count == 0) {
      const categories = [
        {
          name: "Électronique",
          description: "Téléphones, ordinateurs, et accessoires électroniques",
          icon: "laptop",
        },
        {
          name: "Mode & Vêtements",
          description: "Vêtements, chaussures, et accessoires de mode",
          icon: "tshirt",
        },
        {
          name: "Maison & Jardin",
          description: "Articles pour la maison, décoration, et jardinage",
          icon: "home",
        },
        {
          name: "Sports & Loisirs",
          description: "Équipements sportifs et articles de loisirs",
          icon: "dumbbell",
        },
        {
          name: "Beauté & Santé",
          description: "Produits de beauté, cosmétiques, et bien-être",
          icon: "heart",
        },
        { name: "Alimentaire", description: "Produits alimentaires et boissons", icon: "utensils" },
      ];

      console.log("📂 Creating categories...");
      const categoryIds = [];

      for (const category of categories) {
        const result = await pool.query(
          `
          INSERT INTO categories (id, name, description, icon, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, NOW())
          RETURNING id
        `,
          [category.name, category.description, category.icon]
        );

        categoryIds.push({ id: result.rows[0].id, name: category.name });
        console.log(`   ✅ ${category.name}`);
      }

      // Create products only if none exist
      if (existingProducts.rows[0].count == 0) {
        const products = [
          // Electronics
          {
            name: "iPhone 15 Pro",
            description: "Dernier iPhone avec appareil photo professionnel",
            price: 850000,
            category: "Électronique",
            stock: 10,
          },
          {
            name: "MacBook Air M2",
            description: "Ordinateur portable ultra-fin et puissant",
            price: 1200000,
            category: "Électronique",
            stock: 5,
          },
          {
            name: "Samsung Galaxy S24",
            description: "Smartphone Android haut de gamme",
            price: 720000,
            category: "Électronique",
            stock: 15,
          },

          // Fashion
          {
            name: "T-shirt Cotton Premium",
            description: "T-shirt 100% coton de qualité supérieure",
            price: 15000,
            category: "Mode & Vêtements",
            stock: 50,
          },
          {
            name: "Jean Slim Fit",
            description: "Jean confortable et élégant pour toutes occasions",
            price: 35000,
            category: "Mode & Vêtements",
            stock: 30,
          },
          {
            name: "Baskets Nike Air",
            description: "Chaussures de sport confortables et durables",
            price: 85000,
            category: "Mode & Vêtements",
            stock: 20,
          },

          // Home & Garden
          {
            name: "Canapé 3 places",
            description: "Canapé moderne et confortable pour salon",
            price: 250000,
            category: "Maison & Jardin",
            stock: 8,
          },
          {
            name: "Table basse en bois",
            description: "Table basse artisanale en bois massif",
            price: 75000,
            category: "Maison & Jardin",
            stock: 12,
          },

          // Sports
          {
            name: "Ballon de football",
            description: "Ballon officiel FIFA de qualité professionnelle",
            price: 25000,
            category: "Sports & Loisirs",
            stock: 25,
          },
          {
            name: "Raquette de tennis",
            description: "Raquette professionnelle pour joueurs avancés",
            price: 65000,
            category: "Sports & Loisirs",
            stock: 10,
          },

          // Beauty
          {
            name: "Crème hydratante",
            description: "Crème nourrissante pour tous types de peau",
            price: 12000,
            category: "Beauté & Santé",
            stock: 40,
          },
          {
            name: "Parfum Luxe",
            description: "Eau de parfum longue tenue aux notes florales",
            price: 45000,
            category: "Beauté & Santé",
            stock: 18,
          },

          // Food
          {
            name: "Miel naturel bio",
            description: "Miel pur et naturel produit localement",
            price: 8000,
            category: "Alimentaire",
            stock: 35,
          },
          {
            name: "Huile d'olive extra vierge",
            description: "Huile d'olive de première pression à froid",
            price: 15000,
            category: "Alimentaire",
            stock: 22,
          },
        ];

        console.log("\n📦 Creating products...");

        for (const product of products) {
          // Find category ID
          const categoryId = categoryIds.find((cat) => cat.name === product.category)?.id;

          if (categoryId) {
            await pool.query(
              `
              INSERT INTO products (id, vendor_id, category_id, name, description, price, quantity, created_at)
              VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
            `,
              [
                vendorId,
                categoryId,
                product.name,
                product.description,
                product.price,
                product.stock,
              ]
            );

            console.log(`   ✅ ${product.name} - ${product.price.toLocaleString()}F CFA`);
          }
        }
      }
    }

    console.log("\n🎉 Production database seeded successfully!");
    console.log("📊 Final summary:");

    const finalCategories = await pool.query("SELECT COUNT(*) as count FROM categories");
    const finalProducts = await pool.query("SELECT COUNT(*) as count FROM products");

    console.log(`   📂 Categories: ${finalCategories.rows[0].count}`);
    console.log(`   📦 Products: ${finalProducts.rows[0].count}`);
    console.log("\n✨ Production marketplace is now populated with sample data!");
  } catch (error) {
    console.error("❌ Error seeding production:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedProduction();
