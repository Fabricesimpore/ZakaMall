import {
  indexProducts,
  removeProducts,
  createSearchDoc,
  isProductVisible,
} from "../../scripts/search-indexer";
import { storage } from "../storage";
import type { SearchDoc } from "@shared/search-types";

/**
 * Reindex a single product - called whenever a product changes
 */
export async function reindexProduct(productId: string): Promise<void> {
  try {

    // Get product and vendor data from database
    const product = await storage.getProduct(productId);
    if (!product) {
      await removeProducts([productId]);
      return;
    }

    const vendor = await storage.getVendor(product.vendorId);
    if (!vendor) {
      await removeProducts([productId]);
      return;
    }

    // Check if product should be visible in search
    const visible = isProductVisible(product, vendor);

    if (visible) {
      // Create search document and index it
      const searchDoc = createSearchDoc(product, vendor);
      await indexProducts([searchDoc]);
      console.log(`✅ Product ${productId} indexed successfully`);
    } else {
      // Remove from index if not visible
      await removeProducts([productId]);
      console.log(`🚫 Product ${productId} removed from index (not visible)`);
    }
  } catch (error) {
    console.error(`❌ Error reindexing product ${productId}:`, error);
    throw error;
  }
}

/**
 * Reindex all products for a vendor - called when vendor status changes
 */
export async function reindexVendorProducts(vendorId: string): Promise<void> {
  try {
    console.log(`🔄 Reindexing all products for vendor: ${vendorId}`);

    const vendor = await storage.getVendor(vendorId);
    if (!vendor) {
      console.log(`⚠️  Vendor ${vendorId} not found`);
      return;
    }

    // Get all products for this vendor
    const products = await storage.getProductsByVendor(vendorId);
    console.log(`📦 Found ${products.length} products for vendor ${vendorId}`);

    const toIndex: SearchDoc[] = [];
    const toRemove: string[] = [];

    for (const product of products) {
      const visible = isProductVisible(product, vendor);

      if (visible) {
        const searchDoc = createSearchDoc(product, vendor);
        toIndex.push(searchDoc);
      } else {
        toRemove.push(product.id);
      }
    }

    // Batch update the index
    if (toIndex.length > 0) {
      await indexProducts(toIndex);
      console.log(`✅ Indexed ${toIndex.length} products for vendor ${vendorId}`);
    }

    if (toRemove.length > 0) {
      await removeProducts(toRemove);
      console.log(`🗑️  Removed ${toRemove.length} products for vendor ${vendorId}`);
    }
  } catch (error) {
    console.error(`❌ Error reindexing vendor products ${vendorId}:`, error);
    throw error;
  }
}

/**
 * Full reindex of all products - useful for initial setup or data migration
 */
export async function fullReindex(): Promise<void> {
  try {
    console.log("🔄 Starting full reindex of all products...");

    // Get all approved vendors
    const vendors = await storage.getVendors("approved");
    console.log(`👥 Found ${vendors.length} approved vendors`);

    const toIndex: SearchDoc[] = [];

    for (const vendor of vendors) {
      const products = await storage.getProductsByVendor(vendor.id);
      console.log(`📦 Processing ${products.length} products for ${vendor.name}`);

      for (const product of products) {
        const visible = isProductVisible(product, vendor);

        if (visible) {
          const searchDoc = createSearchDoc(product, vendor);
          toIndex.push(searchDoc);
        }
      }
    }

    console.log(`📊 Total products to index: ${toIndex.length}`);

    // Clear existing index and add all products
    const { clearIndex } = await import("../../scripts/search-indexer");
    await clearIndex();

    if (toIndex.length > 0) {
      // Index in batches to avoid overwhelming Meilisearch
      const batchSize = 100;
      for (let i = 0; i < toIndex.length; i += batchSize) {
        const batch = toIndex.slice(i, i + batchSize);
        await indexProducts(batch);
        console.log(
          `✅ Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toIndex.length / batchSize)}`
        );
      }
    }

    console.log("🚀 Full reindex completed successfully!");
  } catch (error) {
    console.error("❌ Error during full reindex:", error);
    throw error;
  }
}

/**
 * Sync hooks - these should be called from your route handlers
 */
export const syncHooks = {
  /**
   * Call when a product is created
   */
  onProductCreated: async (productId: string) => {
    console.log(`🆕 Product created: ${productId}`);
    await reindexProduct(productId);
  },

  /**
   * Call when a product is updated
   */
  onProductUpdated: async (productId: string) => {
    console.log(`📝 Product updated: ${productId}`);
    await reindexProduct(productId);
  },

  /**
   * Call when a product is deleted
   */
  onProductDeleted: async (productId: string) => {
    console.log(`🗑️  Product deleted: ${productId}`);
    await removeProducts([productId]);
  },

  /**
   * Call when a product's stock changes
   */
  onStockUpdated: async (productId: string) => {
    console.log(`📦 Stock updated: ${productId}`);
    await reindexProduct(productId);
  },

  /**
   * Call when admin approves/rejects a product
   */
  onProductApprovalChanged: async (productId: string) => {
    console.log(`✅ Product approval changed: ${productId}`);
    await reindexProduct(productId);
  },

  /**
   * Call when vendor publishes/unpublishes a product
   */
  onProductPublicationChanged: async (productId: string) => {
    console.log(`🔄 Product publication changed: ${productId}`);
    await reindexProduct(productId);
  },

  /**
   * Call when vendor status changes (approved/suspended/etc)
   */
  onVendorStatusChanged: async (vendorId: string) => {
    console.log(`👤 Vendor status changed: ${vendorId}`);
    await reindexVendorProducts(vendorId);
  },

  /**
   * Call when vendor details are updated (name, etc)
   */
  onVendorUpdated: async (vendorId: string) => {
    console.log(`👤 Vendor updated: ${vendorId}`);
    await reindexVendorProducts(vendorId);
  },
};
