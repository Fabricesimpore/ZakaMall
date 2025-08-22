#!/usr/bin/env node

/**
 * Basic search integration test
 * Run this after starting Meilisearch with: docker-compose -f docker-compose.meili.yml up -d
 */

const { MeiliSearch } = require("meilisearch");

async function testSearch() {
  try {
    console.log("🔍 Testing Meilisearch connection...");

    const client = new MeiliSearch({
      host: process.env.MEILI_HOST || "http://localhost:7700",
      apiKey: process.env.MEILI_MASTER_KEY || "development_master_key_for_local",
    });

    // Test connection
    const health = await client.health();
    console.log("✅ Meilisearch is healthy:", health.status);

    // Test index
    const index = client.index("products");
    const stats = await index.getStats();
    console.log("📊 Products index stats:", {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
      fieldDistribution: Object.keys(stats.fieldDistribution || {}).length,
    });

    // Test search functionality
    console.log("\n🔍 Testing search queries...");

    const queries = [
      "phone",
      "hone", // typo test
      "iphne", // typo test
      "android",
      "laptop",
      "earbuds",
    ];

    for (const query of queries) {
      try {
        const result = await index.search(query, {
          limit: 3,
          filter: "approved = true AND published = true",
          attributesToHighlight: ["title", "brand"],
        });

        console.log(
          `Query "${query}": ${result.totalHits} results in ${result.processingTimeMs}ms`
        );
        if (result.hits.length > 0) {
          console.log(`  → "${result.hits[0].title}" by ${result.hits[0].brand || "Unknown"}`);
        }
      } catch (searchError) {
        console.log(`Query "${query}": Error - ${searchError.message}`);
      }
    }

    console.log("\n🎯 Testing faceted search...");
    const facetResult = await index.search("", {
      limit: 0,
      filter: "approved = true AND published = true",
      facets: ["categories", "brand", "vendor_name", "currency", "in_stock"],
    });

    console.log("📊 Available facets:");
    Object.entries(facetResult.facetDistribution || {}).forEach(([facet, values]) => {
      const count = Object.keys(values).length;
      console.log(`  ${facet}: ${count} values`);
    });

    console.log("\n✅ Search test completed successfully!");
  } catch (error) {
    console.error("❌ Search test failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log(
        "💡 Make sure Meilisearch is running: docker-compose -f docker-compose.meili.yml up -d"
      );
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testSearch();
}

module.exports = { testSearch };
