import { db } from "./db";
import { users, vendors, drivers, products, orders, orderItems, cart, reviews, messages, chatRooms, chatParticipants, notifications, phoneVerifications, emailVerifications, searchLogs, userBehavior, userPreferences } from "@shared/schema";
import { eq, or, sql, inArray } from "drizzle-orm";

/**
 * Production-safe user deletion with proper error handling
 * Handles missing tables and foreign key constraints gracefully
 */
export async function deleteUserSafe(userId: string): Promise<void> {
  console.log("🗑️ Starting SAFE user deletion for:", userId);
  
  // Get user details
  const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!targetUser) {
    console.log("⚠️ User not found:", userId);
    return;
  }
  
  // PROTECTION: Check if this is the protected admin account
  if (targetUser.email === "simporefabrice15@gmail.com") {
    console.log("🛡️ BLOCKED: Attempt to delete protected admin account");
    throw new Error("Cannot delete protected admin account");
  }
  
  console.log("👤 Deleting user:", {
    id: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
  });
  
  // Helper function to safely delete from a table
  const safeDelete = async (name: string, deleteOp: () => Promise<any>) => {
    try {
      console.log(`  Cleaning ${name}...`);
      const result = await deleteOp();
      const count = result?.rowCount || result?.count || 0;
      if (count > 0) {
        console.log(`  ✅ Deleted ${count} rows from ${name}`);
      } else {
        console.log(`  ⏭️ No rows to delete from ${name}`);
      }
      return true;
    } catch (error: any) {
      // Check if error is due to missing table
      if (error.message?.includes("does not exist") || error.message?.includes("no such table")) {
        console.log(`  ⏭️ Table ${name} does not exist in production`);
      } else {
        console.log(`  ⚠️ Error with ${name}: ${error.message?.slice(0, 100)}`);
      }
      return false;
    }
  };
  
  try {
    // Phase 1: Delete leaf tables (no dependencies)
    await safeDelete("userPreferences", () =>
      db.delete(userPreferences).where(eq(userPreferences.userId, userId))
    );
    
    await safeDelete("userBehavior", () =>
      db.delete(userBehavior).where(eq(userBehavior.userId, userId))
    );
    
    await safeDelete("searchLogs", () =>
      db.delete(searchLogs).where(eq(searchLogs.userId, userId))
    );
    
    // Phase 2: Get vendor ID if user is a vendor (needed for product cleanup)
    let vendorId: string | null = null;
    try {
      const vendorRecord = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
      if (vendorRecord.length > 0) {
        vendorId = vendorRecord[0].id;
        console.log("  📦 User is a vendor with ID:", vendorId);
      }
    } catch (error) {
      console.log("  ⏭️ Vendor table check failed - skipping vendor cleanup");
    }
    
    // Phase 3: Clean up product-related data if user is a vendor
    if (vendorId) {
      // Get all product IDs for this vendor
      let productIds: string[] = [];
      try {
        const vendorProducts = await db.select({ id: products.id })
          .from(products)
          .where(eq(products.vendorId, vendorId));
        productIds = vendorProducts.map(p => p.id);
        console.log(`  📦 Found ${productIds.length} products for vendor`);
      } catch (error) {
        console.log("  ⏭️ Could not fetch vendor products");
      }
      
      if (productIds.length > 0) {
        // Delete reviews for these products
        await safeDelete("reviews of vendor products", () =>
          db.delete(reviews).where(inArray(reviews.productId, productIds))
        );
        
        // Delete cart items for these products
        await safeDelete("cart items for vendor products", () =>
          db.delete(cart).where(inArray(cart.productId, productIds))
        );
        
        // Delete order items for these products
        await safeDelete("order items for vendor products", () =>
          db.delete(orderItems).where(inArray(orderItems.productId, productIds))
        );
        
        // Delete the products themselves
        await safeDelete("products owned by vendor", () =>
          db.delete(products).where(eq(products.vendorId, vendorId))
        );
      }
    }
    
    // Phase 4: Delete user's own reviews
    await safeDelete("user reviews", () =>
      db.delete(reviews).where(eq(reviews.userId, userId))
    );
    
    // Phase 5: Delete order-related data
    // Get user's order IDs
    let orderIds: string[] = [];
    try {
      const userOrders = await db.select({ id: orders.id })
        .from(orders)
        .where(eq(orders.customerId, userId));
      orderIds = userOrders.map(o => o.id);
      console.log(`  📦 Found ${orderIds.length} orders for user`);
    } catch (error) {
      console.log("  ⏭️ Could not fetch user orders");
    }
    
    if (orderIds.length > 0) {
      // Delete order items first
      await safeDelete("order items", () =>
        db.delete(orderItems).where(inArray(orderItems.orderId, orderIds))
      );
    }
    
    // Delete orders
    await safeDelete("orders", () =>
      db.delete(orders).where(eq(orders.customerId, userId))
    );
    
    // Phase 6: Delete cart items
    await safeDelete("cart", () =>
      db.delete(cart).where(eq(cart.userId, userId))
    );
    
    // Phase 7: Delete chat/messaging data
    await safeDelete("messages", () =>
      db.delete(messages).where(eq(messages.senderId, userId))
    );
    
    await safeDelete("chatParticipants", () =>
      db.delete(chatParticipants).where(eq(chatParticipants.userId, userId))
    );
    
    await safeDelete("chatRooms", () =>
      db.delete(chatRooms).where(eq(chatRooms.createdBy, userId))
    );
    
    // Phase 8: Delete notifications
    await safeDelete("notifications", () =>
      db.delete(notifications).where(eq(notifications.userId, userId))
    );
    
    // Phase 9: Delete verification records
    if (targetUser.phone) {
      await safeDelete("phoneVerifications", () =>
        db.delete(phoneVerifications).where(eq(phoneVerifications.phone, targetUser.phone!))
      );
    }
    
    if (targetUser.email) {
      await safeDelete("emailVerifications", () =>
        db.delete(emailVerifications).where(eq(emailVerifications.email, targetUser.email!))
      );
    }
    
    // Phase 10: Delete vendor/driver records
    await safeDelete("drivers", () =>
      db.delete(drivers).where(eq(drivers.userId, userId))
    );
    
    await safeDelete("vendors", () =>
      db.delete(vendors).where(eq(vendors.userId, userId))
    );
    
    // Phase 11: FINAL - Delete the user
    console.log("🔥 All related data cleaned, deleting user record...");
    
    try {
      const result = await db.delete(users).where(eq(users.id, userId));
      console.log("✅ User deletion completed successfully");
      return;
    } catch (deleteError: any) {
      console.error("❌ User deletion failed after cleanup:", deleteError.message);
      
      // Check if user still exists
      const userStillExists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId));
      if (userStillExists.length === 0) {
        console.log("✅ User no longer exists - deletion succeeded");
        return;
      }
      
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }
  } catch (error: any) {
    console.error("❌ Safe deletion failed:", error.message);
    throw error;
  }
}

/**
 * Production-safe product deletion with proper error handling
 */
export async function deleteProductSafe(productId: string): Promise<void> {
  console.log("🗑️ Starting SAFE product deletion for:", productId);
  
  // Helper function to safely delete from a table
  const safeDelete = async (name: string, deleteOp: () => Promise<any>) => {
    try {
      console.log(`  Cleaning ${name}...`);
      const result = await deleteOp();
      const count = result?.rowCount || result?.count || 0;
      if (count > 0) {
        console.log(`  ✅ Deleted ${count} rows from ${name}`);
      } else {
        console.log(`  ⏭️ No rows to delete from ${name}`);
      }
      return true;
    } catch (error: any) {
      if (error.message?.includes("does not exist") || error.message?.includes("no such table")) {
        console.log(`  ⏭️ Table ${name} does not exist in production`);
      } else {
        console.log(`  ⚠️ Error with ${name}: ${error.message?.slice(0, 100)}`);
      }
      return false;
    }
  };
  
  try {
    // Phase 1: Delete reviews for this product
    await safeDelete("reviews", () =>
      db.delete(reviews).where(eq(reviews.productId, productId))
    );
    
    // Phase 2: Delete cart items for this product
    await safeDelete("cart items", () =>
      db.delete(cart).where(eq(cart.productId, productId))
    );
    
    // Phase 3: Delete order items for this product
    await safeDelete("order items", () =>
      db.delete(orderItems).where(eq(orderItems.productId, productId))
    );
    
    // Phase 4: Delete the product itself
    console.log("🔥 All related data cleaned, deleting product record...");
    
    try {
      const result = await db.delete(products).where(eq(products.id, productId));
      console.log("✅ Product deletion completed successfully");
      return;
    } catch (deleteError: any) {
      console.error("❌ Product deletion failed after cleanup:", deleteError.message);
      
      // Check if product still exists
      const productStillExists = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, productId));
      if (productStillExists.length === 0) {
        console.log("✅ Product no longer exists - deletion succeeded");
        return;
      }
      
      throw new Error(`Failed to delete product: ${deleteError.message}`);
    }
  } catch (error: any) {
    console.error("❌ Safe product deletion failed:", error.message);
    throw error;
  }
}