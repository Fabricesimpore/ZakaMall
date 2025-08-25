import { db } from "./db";
import { users, vendors, drivers, products, orders, orderItems, cart, reviews, reviewVotes, reviewResponses, messages, chatRooms, chatParticipants, notifications, phoneVerifications, emailVerifications, searchLogs, userBehavior, userPreferences, payments, securityEvents, fraudAnalysis, userVerifications, suspiciousActivities, blacklist, vendorTrustScores, vendorNotificationSettings, rateLimitViolations } from "@shared/schema";
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
    // Phase 0: Try to identify what's blocking first
    console.log("🔍 Checking for blocking references...");
    const blockingRefs = await checkBlockingReferences(userId);
    if (blockingRefs.length > 0) {
      console.log("⚠️ Found blocking references:", blockingRefs);
    }
    
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
    
    // Delete all security and fraud-related records
    await safeDelete("rateLimitViolations", () =>
      db.delete(rateLimitViolations).where(eq(rateLimitViolations.userId, userId))
    );
    
    await safeDelete("securityEvents", () =>
      db.delete(securityEvents).where(or(
        eq(securityEvents.userId, userId),
        eq(securityEvents.resolvedBy, userId)
      ))
    );
    
    await safeDelete("fraudAnalysis", () =>
      db.delete(fraudAnalysis).where(or(
        eq(fraudAnalysis.userId, userId),
        eq(fraudAnalysis.reviewedBy, userId)
      ))
    );
    
    await safeDelete("userVerifications", () =>
      db.delete(userVerifications).where(or(
        eq(userVerifications.userId, userId),
        eq(userVerifications.verifiedBy, userId)
      ))
    );
    
    await safeDelete("suspiciousActivities", () =>
      db.delete(suspiciousActivities).where(or(
        eq(suspiciousActivities.userId, userId),
        eq(suspiciousActivities.investigatedBy, userId)
      ))
    );
    
    await safeDelete("blacklist", () =>
      db.delete(blacklist).where(eq(blacklist.addedBy, userId))
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
      // Delete vendor trust scores first
      await safeDelete("vendorTrustScores", () =>
        db.delete(vendorTrustScores).where(eq(vendorTrustScores.vendorId, vendorId))
      );
      
      // Delete vendor notification settings
      await safeDelete("vendorNotificationSettings", () =>
        db.delete(vendorNotificationSettings).where(eq(vendorNotificationSettings.userId, userId))
      );
      
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
        // Delete review votes for these products' reviews
        await safeDelete("review votes for vendor products", () =>
          db.execute(sql`
            DELETE FROM ${reviewVotes}
            WHERE review_id IN (
              SELECT id FROM ${reviews} WHERE product_id = ANY(${productIds})
            )
          `)
        );
        
        // Delete review responses for these products' reviews
        await safeDelete("review responses for vendor products", () =>
          db.execute(sql`
            DELETE FROM ${reviewResponses}
            WHERE review_id IN (
              SELECT id FROM ${reviews} WHERE product_id = ANY(${productIds})
            )
          `)
        );
        
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
    
    // Phase 4: Delete user's own review-related data
    await safeDelete("user review votes", () =>
      db.delete(reviewVotes).where(eq(reviewVotes.userId, userId))
    );
    
    // Delete review responses for user's reviews
    await safeDelete("review responses for user reviews", () =>
      db.execute(sql`
        DELETE FROM ${reviewResponses}
        WHERE review_id IN (
          SELECT id FROM ${reviews} WHERE user_id = ${userId}
        )
      `)
    );
    
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
    
    // Phase 6: Delete cart items and payments
    await safeDelete("cart", () =>
      db.delete(cart).where(eq(cart.userId, userId))
    );
    
    // Delete payments linked to user's orders
    await safeDelete("payments for user orders", () =>
      db.execute(sql`
        DELETE FROM ${payments}
        WHERE order_id IN (
          SELECT id FROM ${orders} WHERE customer_id = ${userId}
        )
      `)
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
      await db.delete(users).where(eq(users.id, userId));
      console.log("✅ User deletion completed successfully");
      return;
    } catch (deleteError: any) {
      console.error("❌ User deletion failed after cleanup:", deleteError.message);
      
      // Try a more aggressive approach - use CASCADE manually
      console.log("🔄 Attempting CASCADE-style deletion...");
      try {
        await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
        console.log("✅ User deletion completed with raw SQL");
        return;
      } catch (rawError: any) {
        console.error("❌ Raw SQL deletion also failed:", rawError.message);
      }
      
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
async function checkBlockingReferences(userId: string): Promise<string[]> {
  const blocking: string[] = [];
  
  // Check common blocking tables
  const checks = [
    { table: 'vendors', check: () => db.select({ count: sql`count(*)` }).from(vendors).where(eq(vendors.userId, userId)) },
    { table: 'drivers', check: () => db.select({ count: sql`count(*)` }).from(drivers).where(eq(drivers.userId, userId)) },
    { table: 'orders', check: () => db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.customerId, userId)) },
    { table: 'cart', check: () => db.select({ count: sql`count(*)` }).from(cart).where(eq(cart.userId, userId)) },
    { table: 'reviews', check: () => db.select({ count: sql`count(*)` }).from(reviews).where(eq(reviews.userId, userId)) },
    { table: 'payments', check: () => db.execute(sql`
      SELECT count(*) as count FROM ${payments} 
      WHERE order_id IN (SELECT id FROM ${orders} WHERE customer_id = ${userId})
    `) },
  ];
  
  for (const { table, check } of checks) {
    try {
      const result = await check();
      const count = Number(result.rows?.[0]?.count || result[0]?.count || 0);
      if (count > 0) {
        blocking.push(`${table} (${count} rows)`);
      }
    } catch (error) {
      // Table might not exist
    }
  }
  
  return blocking;
}

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
      await db.delete(products).where(eq(products.id, productId));
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