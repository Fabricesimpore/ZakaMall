import { MeiliSearch } from "meilisearch";
import type { SearchDoc } from "@shared/search-types";

let client: MeiliSearch | null = null;

function getClient() {
  if (!client) {
    client = new MeiliSearch({
      host: process.env.MEILI_HOST || "http://localhost:7700",
      apiKey: process.env.MEILI_MASTER_KEY || "development_master_key_for_local",
    });
  }
  return client;
}

function getIndex() {
  return getClient().index("products");
}

/**
 * Add or update products in the search index
 */
export async function indexProducts(docs: SearchDoc[]): Promise<any> {
  try {
    console.log(`🔍 Indexing ${docs.length} products...`);
    const index = getIndex();
    const result = await index.addDocuments(docs);
    console.log(`✅ Products indexed with task ID: ${result.taskUid}`);
    return result;
  } catch (error) {
    console.error("❌ Error indexing products:", error);
    throw error;
  }
}

/**
 * Remove products from the search index
 */
export async function removeProducts(ids: string[]): Promise<any> {
  try {
    console.log(`🗑️  Removing ${ids.length} products from index...`);
    const index = getIndex();
    const result = await index.deleteDocuments(ids);
    console.log(`✅ Products removed with task ID: ${result.taskUid}`);
    return result;
  } catch (error) {
    console.error("❌ Error removing products:", error);
    throw error;
  }
}

/**
 * Clear all products from the search index
 */
export async function clearIndex(): Promise<any> {
  try {
    console.log("🧹 Clearing products index...");
    const index = getIndex();
    const result = await index.deleteAllDocuments();
    console.log(`✅ Index cleared with task ID: ${result.taskUid}`);
    return result;
  } catch (error) {
    console.error("❌ Error clearing index:", error);
    throw error;
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
  try {
    const index = getIndex();
    const stats = await index.getStats();
    console.log("📊 Index statistics:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error getting index stats:", error);
    throw error;
  }
}

/**
 * Transform product and vendor data into search document
 */
export function createSearchDoc(product: any, vendor: any): SearchDoc {
  // Create combined search text for better matching
  const searchText = [
    product.title,
    product.brand,
    product.description,
    vendor.storeName || vendor.name, // Use store name for search
    vendor.legalName, // Also include legal name for search
    ...(product.categories || []),
    ...(product.tags || []),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: product.id,
    vendor_id: product.vendor_id || product.vendorId,
    vendor_name: vendor.storeName || vendor.name, // Use new storeName field
    vendor_slug: vendor.storeSlug || vendor.slug,
    title: product.title || "",
    brand: product.brand || "",
    categories: product.categories || [],
    description: product.description || "",
    price_cents: product.price_cents || product.priceCents || 0,
    currency: product.currency || "XOF",
    images: product.images || [],
    in_stock: Boolean(product.in_stock && (product.stock_qty || product.stockQty) > 0),
    stock_qty: product.stock_qty || product.stockQty || 0,
    published: Boolean(product.published),
    approved: Boolean(product.approved),
    created_at: new Date(product.created_at || product.createdAt || Date.now()).getTime(),
    updated_at: new Date(product.updated_at || product.updatedAt || Date.now()).getTime(),
    popularity_score: product.popularity_score || product.popularityScore || 0,
    search_text: searchText,
    tags: product.tags || [],
  };
}

/**
 * Check if a product should be visible in search (published + approved + vendor approved)
 */
export function isProductVisible(product: any, vendor: any): boolean {
  return Boolean(product.published && product.approved && vendor.status === "approved");
}
