#!/usr/bin/env node

/**
 * Seed test data for search functionality testing
 * This ensures we have predictable test data for search tests
 */

const { MeiliSearch } = require("meilisearch");

const MEILI_HOST = process.env.MEILI_HOST || "http://localhost:7700";
const MEILI_KEY = process.env.MEILI_MASTER_KEY || "development_master_key_for_local";

const TEST_PRODUCTS = [
  {
    id: "test-phone-1",
    title: "iPhone 15 Pro Max",
    brand: "Apple",
    description: "Latest iPhone with advanced camera system",
    price_cents: 129900,
    currency: "CFA",
    categories: ["Electronics", "Mobile Phones"],
    vendor_id: "test-vendor-1",
    vendor_name: "TechStore BF",
    vendor_slug: "techstore-bf",
    in_stock: true,
    approved: true,
    published: true,
    popularity_score: 95,
    created_at: Date.now() - 86400000, // 1 day ago
    updated_at: Date.now()
  },
  {
    id: "test-phone-2", 
    title: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    description: "Premium Android smartphone with S Pen",
    price_cents: 119900,
    currency: "CFA",
    categories: ["Electronics", "Mobile Phones"],
    vendor_id: "test-vendor-1",
    vendor_name: "TechStore BF",
    vendor_slug: "techstore-bf",
    in_stock: true,
    approved: true,
    published: true,
    popularity_score: 92,
    created_at: Date.now() - 86400000,
    updated_at: Date.now()
  },
  {
    id: "test-laptop-1",
    title: "MacBook Pro 16-inch M3",
    brand: "Apple",
    description: "Professional laptop for creative work",
    price_cents: 299900,
    currency: "CFA",
    categories: ["Electronics", "Laptops"],
    vendor_id: "test-vendor-2",
    vendor_name: "Computer World",
    vendor_slug: "computer-world",
    in_stock: true,
    approved: true,
    published: true,
    popularity_score: 88,
    created_at: Date.now() - 172800000, // 2 days ago
    updated_at: Date.now()
  },
  {
    id: "test-laptop-2",
    title: "Dell XPS 15 Laptop",
    brand: "Dell",
    description: "High-performance Windows laptop",
    price_cents: 189900,
    currency: "CFA",
    categories: ["Electronics", "Laptops"],
    vendor_id: "test-vendor-2", 
    vendor_name: "Computer World",
    vendor_slug: "computer-world",
    in_stock: true,
    approved: true,
    published: true,
    popularity_score: 85,
    created_at: Date.now() - 172800000,
    updated_at: Date.now()
  },
  {
    id: "test-headphones-1",
    title: "Sony WH-1000XM5 Headphones",
    brand: "Sony",
    description: "Wireless noise-canceling headphones",
    price_cents: 49900,
    currency: "CFA",
    categories: ["Electronics", "Audio"],
    vendor_id: "test-vendor-3",
    vendor_name: "Audio Experts",
    vendor_slug: "audio-experts",
    in_stock: true,
    approved: true,
    published: true,
    popularity_score: 90,
    created_at: Date.now() - 259200000, // 3 days ago
    updated_at: Date.now()
  },
  {
    id: "test-out-of-stock",
    title: "iPad Pro 12.9-inch",
    brand: "Apple",
    description: "Professional tablet with M2 chip",
    price_cents: 159900,
    currency: "CFA",
    categories: ["Electronics", "Tablets"],
    vendor_id: "test-vendor-1",
    vendor_name: "TechStore BF", 
    vendor_slug: "techstore-bf",
    in_stock: false, // Out of stock for testing
    approved: true,
    published: true,
    popularity_score: 87,
    created_at: Date.now() - 345600000, // 4 days ago
    updated_at: Date.now()
  },
  {
    id: "test-android-tablet",
    title: "Samsung Galaxy Tab S9 Ultra",
    brand: "Samsung",
    description: "Large Android tablet for productivity",
    price_cents: 139900,
    currency: "CFA",
    categories: ["Electronics", "Tablets"],
    vendor_id: "test-vendor-2",
    vendor_name: "Computer World",
    vendor_slug: "computer-world", 
    in_stock: true,
    approved: true,
    published: true,
    popularity_score: 83,
    created_at: Date.now() - 432000000, // 5 days ago
    updated_at: Date.now()
  }
];

async function seedTestData() {
  try {
    console.log("🌱 Seeding search test data...");

    const client = new MeiliSearch({
      host: MEILI_HOST,
      apiKey: MEILI_KEY,
    });

    // Test connection
    const health = await client.health();
    if (health.status !== "available") {
      throw new Error(`Meilisearch not available: ${health.status}`);
    }

    const index = client.index("products");

    // Add test documents
    const task = await index.addDocuments(TEST_PRODUCTS);
    console.log(`📄 Added ${TEST_PRODUCTS.length} test products (Task: ${task.taskUid})`);

    // Wait for indexing to complete
    console.log("⏳ Waiting for indexing to complete...");
    await client.waitForTask(task.taskUid);

    // Update search settings for optimal typo tolerance
    console.log("⚙️ Configuring search settings...");
    
    await index.updateSettings({
      searchableAttributes: [
        "title",
        "brand", 
        "description",
        "categories",
        "vendor_name"
      ],
      filterableAttributes: [
        "approved",
        "published", 
        "in_stock",
        "categories",
        "brand",
        "vendor_id",
        "vendor_name",
        "currency",
        "price_cents"
      ],
      sortableAttributes: [
        "price_cents",
        "popularity_score",
        "created_at",
        "updated_at"
      ],
      rankingRules: [
        "words",
        "typo",
        "proximity", 
        "attribute",
        "sort",
        "exactness",
        "popularity_score:desc"
      ],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 3,
          twoTypos: 7
        },
        disableOnWords: ["apple", "samsung", "sony", "dell"],
        disableOnAttributes: ["brand"]
      },
      faceting: {
        maxValuesPerFacet: 100
      },
      pagination: {
        maxTotalHits: 1000
      }
    });

    // Verify data
    const stats = await index.getStats();
    console.log(`✅ Index now has ${stats.numberOfDocuments} documents`);

    // Test search functionality
    console.log("🔍 Testing search...");
    const searchResult = await index.search("phone", { limit: 3 });
    console.log(`📱 Search "phone": ${searchResult.totalHits} results`);

    // Test typo tolerance
    const typoResult = await index.search("phon", { limit: 3 });
    console.log(`🔤 Search "phon" (typo): ${typoResult.totalHits} results`);

    console.log("🎉 Test data seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Failed to seed test data:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log("💡 Make sure Meilisearch is running: docker-compose -f docker-compose.meili.yml up -d");
    }
    process.exit(1);
  }
}

async function cleanTestData() {
  try {
    console.log("🧹 Cleaning test data...");

    const client = new MeiliSearch({
      host: MEILI_HOST,
      apiKey: MEILI_KEY,
    });

    const index = client.index("products");
    
    // Delete test documents
    const testIds = TEST_PRODUCTS.map(p => p.id);
    const task = await index.deleteDocuments(testIds);
    
    console.log(`🗑️ Deleted ${testIds.length} test products (Task: ${task.taskUid})`);
    await client.waitForTask(task.taskUid);

    console.log("✅ Test data cleaned successfully!");
    
  } catch (error) {
    console.error("❌ Failed to clean test data:", error.message);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

if (command === "clean") {
  cleanTestData();
} else {
  seedTestData();
}

module.exports = { seedTestData, cleanTestData, TEST_PRODUCTS };