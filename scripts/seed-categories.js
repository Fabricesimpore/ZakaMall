import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../shared/schema.js";

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

const seedCategories = [
  { 
    id: "electronics", 
    name: "Électronique", 
    description: "Téléphones, ordinateurs, accessoires électroniques",
    slug: "electronique"
  },
  { 
    id: "fashion", 
    name: "Mode & Vêtements", 
    description: "Vêtements, chaussures, accessoires de mode",
    slug: "mode-vetements"
  },
  { 
    id: "home", 
    name: "Maison & Jardin", 
    description: "Meubles, décoration, jardinage",
    slug: "maison-jardin"
  },
  { 
    id: "beauty", 
    name: "Beauté & Santé", 
    description: "Cosmétiques, produits de santé, bien-être",
    slug: "beaute-sante"
  },
  { 
    id: "sports", 
    name: "Sports & Loisirs", 
    description: "Équipements sportifs, jeux, loisirs",
    slug: "sports-loisirs"
  },
  { 
    id: "books", 
    name: "Livres & Médias", 
    description: "Livres, musique, films, jeux vidéo",
    slug: "livres-medias"
  },
  { 
    id: "food", 
    name: "Alimentation", 
    description: "Produits alimentaires, boissons",
    slug: "alimentation"
  },
  { 
    id: "automotive", 
    name: "Automobile", 
    description: "Pièces auto, accessoires véhicules",
    slug: "automobile"
  }
];

async function seedDatabase() {
  console.log("🌱 Seeding categories...");
  
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories).limit(1);
    
    if (existingCategories.length > 0) {
      console.log("✅ Categories already exist, skipping seed");
      return;
    }
    
    // Insert categories
    for (const category of seedCategories) {
      await db.insert(categories).values(category);
      console.log(`✅ Created category: ${category.name}`);
    }
    
    console.log(`🎉 Successfully seeded ${seedCategories.length} categories!`);
    
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seeding
seedDatabase().catch((error) => {
  console.error("Failed to seed database:", error);
  process.exit(1);
});