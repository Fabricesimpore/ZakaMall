import "dotenv/config";
import { MeiliSearch } from "meilisearch";

const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_MASTER_KEY || "development_master_key_for_local",
});

async function bootstrap() {
  console.log("🔍 Initializing Meilisearch products index...");

  try {
    // Create or get the products index
    const index = await client.getOrCreateIndex("products", { primaryKey: "id" });
    console.log("✅ Products index created/retrieved");

    // Configure index settings
    await index.updateSettings({
      // Fields that can be searched
      searchableAttributes: [
        "title",
        "brand",
        "categories",
        "description",
        "vendor_name",
        "search_text",
        "tags",
      ],

      // Fields that can be filtered
      filterableAttributes: [
        "vendor_id",
        "vendor_slug",
        "categories",
        "brand",
        "in_stock",
        "approved",
        "published",
        "currency",
        "price_cents",
      ],

      // Fields that can be sorted
      sortableAttributes: [
        "price_cents",
        "created_at",
        "updated_at",
        "popularity_score",
        "stock_qty",
      ],

      // Faceted search attributes
      faceting: {
        maxValuesPerFacet: 100,
      },

      // Synonyms for better search results
      synonyms: {
        // English phone synonyms
        iphone: ["i phone", "i-phone", "apple phone"],
        phone: ["cellphone", "mobile", "handset", "gsm", "smartphone"],
        android: ["google phone"],

        // Audio equipment
        earbuds: ["ear phones", "earpods", "headphones", "earphones"],
        headphones: ["earbuds", "ear phones", "headset"],

        // Computing
        laptop: ["notebook", "ultrabook", "computer", "pc"],
        tablet: ["ipad", "tab"],

        // French synonyms
        téléphone: ["phone", "mobile", "cellulaire"],
        ordinateur: ["laptop", "computer", "pc"],
        écouteurs: ["earbuds", "headphones", "casque"],
        tablette: ["tablet", "ipad"],

        // Brand variations
        apple: ["iphone", "ipad", "macbook", "imac"],
        samsung: ["galaxy"],
        huawei: ["honor"],
      },

      // Typo tolerance settings
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4, // "hone" (4 chars) → one typo OK → "phone"
          twoTypos: 8, // longer words can have 2 typos
        },
        disableOnWords: [], // Words where typos should never be allowed
        disableOnAttributes: [], // Attributes where typos should never be allowed
      },

      // Ranking rules (order matters)
      rankingRules: [
        "words", // Prefer results with more query words
        "typo", // Prefer results with fewer typos
        "proximity", // Prefer results where query words are closer
        "attribute", // Prefer results where matches are in more important attributes
        "sort", // Apply custom sorting
        "exactness", // Prefer exact matches over partial
      ],

      // Stop words (words that should be ignored in search)
      stopWords: [
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "le",
        "la",
        "les",
        "un",
        "une",
        "des",
        "et",
        "ou",
        "dans",
        "sur",
        "pour",
        "avec",
        "par",
      ],

      // Highlighting settings
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",

      // Pagination limits
      pagination: {
        maxTotalHits: 10000,
      },
    });

    console.log("✅ Index settings configured");
    console.log("🎯 Synonyms, typo tolerance, and faceting enabled");
    console.log("📊 Searchable attributes: title, brand, categories, description, vendor_name");
    console.log(
      "🔍 Filterable attributes: vendor_id, categories, brand, in_stock, currency, price_cents"
    );
  } catch (error) {
    console.error("❌ Error setting up Meilisearch:", error);
    throw error;
  }
}

// Run bootstrap if called directly
if (require.main === module) {
  bootstrap()
    .then(() => {
      console.log("🚀 Meilisearch bootstrap completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Bootstrap failed:", error);
      process.exit(1);
    });
}

export { bootstrap };
