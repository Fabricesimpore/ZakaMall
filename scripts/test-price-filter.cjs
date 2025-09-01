#!/usr/bin/env node

/**
 * Test price filtering to debug why max price doesn't work
 */

const { MeiliSearch } = require("meilisearch");

const MEILI_HOST = process.env.MEILI_HOST || "http://localhost:7700";
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || "development_master_key_for_local";

async function testPriceFilter() {
  const client = new MeiliSearch({
    host: MEILI_HOST,
    apiKey: MEILI_MASTER_KEY,
  });

  const index = client.index("products");

  try {
    console.log("🔍 Testing price filtering...\n");

    // 1. Get all products to see what we have
    console.log("1. Sample products in index:");
    const allProducts = await index.search("", {
      limit: 5,
      attributesToRetrieve: ["title", "price_cents", "currency"],
    });

    console.log(`   Found ${allProducts.totalHits} total products`);
    allProducts.hits.forEach((product, i) => {
      console.log(
        `   ${i + 1}. ${product.title}: ${product.price_cents} cents (${product.currency})`
      );
    });

    // 2. Test max price filter of 10000 (should be 1000000 cents)
    console.log("\n2. Testing max price filter: 10000 CFA (1000000 cents)");
    const priceTest1 = await index.search("", {
      filter: "price_cents <= 1000000",
      attributesToRetrieve: ["title", "price_cents", "currency"],
      limit: 10,
    });

    console.log(`   Results: ${priceTest1.totalHits} products found`);
    priceTest1.hits.forEach((product, i) => {
      const actualPrice = product.price_cents / 100;
      console.log(
        `   ${i + 1}. ${product.title}: ${actualPrice} CFA (${product.price_cents} cents)`
      );
    });

    // 3. Test if we have products over 10000 CFA
    console.log("\n3. Testing products OVER 10000 CFA (> 1000000 cents)");
    const priceTest2 = await index.search("", {
      filter: "price_cents > 1000000",
      attributesToRetrieve: ["title", "price_cents", "currency"],
      limit: 10,
    });

    console.log(`   Results: ${priceTest2.totalHits} products found`);
    priceTest2.hits.forEach((product, i) => {
      const actualPrice = product.price_cents / 100;
      console.log(
        `   ${i + 1}. ${product.title}: ${actualPrice} CFA (${product.price_cents} cents)`
      );
    });

    // 4. Test price range
    console.log("\n4. Testing price range: 5000-15000 CFA");
    const priceTest3 = await index.search("", {
      filter: "price_cents >= 500000 AND price_cents <= 1500000",
      attributesToRetrieve: ["title", "price_cents", "currency"],
      limit: 10,
    });

    console.log(`   Results: ${priceTest3.totalHits} products found`);
    priceTest3.hits.forEach((product, i) => {
      const actualPrice = product.price_cents / 100;
      console.log(
        `   ${i + 1}. ${product.title}: ${actualPrice} CFA (${product.price_cents} cents)`
      );
    });

    // 5. Check currency distribution
    console.log("\n5. Currency distribution:");
    const currencyTest = await index.search("", {
      facets: ["currency"],
      limit: 0,
    });

    const currencies = currencyTest.facetDistribution?.currency || {};
    console.log("   Currencies found:", currencies);

    console.log("\n✅ Price filter test completed");
  } catch (error) {
    console.error("❌ Error testing price filter:", error);
  }
}

testPriceFilter().catch(console.error);
