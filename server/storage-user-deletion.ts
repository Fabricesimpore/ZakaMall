import { db } from "./db";
import {
  users,
  vendors,
  drivers,
  products,
  orders,
  orderItems,
  cart,
  reviews,
  reviewVotes,
  reviewResponses,
  messages,
  chatRooms,
  chatParticipants,
  notifications,
  vendorNotificationSettings,
  phoneVerifications,
  emailVerifications,
  searchLogs,
  userBehavior,
  userPreferences,
  securityEvents,
  rateLimitViolations,
  fraudAnalysis,
  userVerifications,
  vendorTrustScores,
  suspiciousActivities,
  blacklist,
  payments,
} from "@shared/schema";
import { eq, or, sql } from "drizzle-orm";

/**
 * Comprehensive user deletion with all foreign key cleanup
 * This function handles ALL relationships to ensure clean deletion
 */
export async function deleteUserComprehensive(userId: string): Promise<void> {
  console.log("🗑️ Starting COMPREHENSIVE user deletion for:", userId);

  // Get user details for additional cleanup
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
      console.log(`  ⚠️ Error with ${name}: ${error.message?.slice(0, 100)}`);
      return false;
    }
  };

  try {
    // 1. Delete recommendation and behavior tracking
    await safeDelete("userPreferences", () =>
      db.delete(userPreferences).where(eq(userPreferences.userId, userId))
    );

    await safeDelete("userBehavior", () =>
      db.delete(userBehavior).where(eq(userBehavior.userId, userId))
    );

    await safeDelete("searchLogs", () =>
      db.delete(searchLogs).where(eq(searchLogs.userId, userId))
    );

    // 2. Delete review-related data
    await safeDelete("reviewVotes", () =>
      db.delete(reviewVotes).where(eq(reviewVotes.userId, userId))
    );

    await safeDelete("reviewResponses", () =>
      db.execute(sql`
        DELETE FROM review_responses 
        WHERE review_id IN (SELECT id FROM reviews WHERE user_id = ${userId})
      `)
    );

    await safeDelete("reviews", () => db.delete(reviews).where(eq(reviews.userId, userId)));

    // 3. Delete payment records
    await safeDelete("payments", () => db.delete(payments).where(eq(payments.userId, userId)));

    // 4. Delete order items first (they reference orders)
    await safeDelete("orderItems", () =>
      db.execute(sql`
        DELETE FROM order_items 
        WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ${userId})
      `)
    );

    // 5. Delete orders
    await safeDelete("orders", () => db.delete(orders).where(eq(orders.customerId, userId)));

    // 6. Delete cart items
    await safeDelete("cart", () => db.delete(cart).where(eq(cart.userId, userId)));

    // 7. Delete chat/messaging data
    await safeDelete("messages", () => db.delete(messages).where(eq(messages.senderId, userId)));

    await safeDelete("chatParticipants", () =>
      db.delete(chatParticipants).where(eq(chatParticipants.userId, userId))
    );

    await safeDelete("chatRooms", () =>
      db.delete(chatRooms).where(eq(chatRooms.createdBy, userId))
    );

    // 8. Delete notifications
    await safeDelete("vendorNotificationSettings", () =>
      db.delete(vendorNotificationSettings).where(eq(vendorNotificationSettings.userId, userId))
    );

    await safeDelete("notifications", () =>
      db.delete(notifications).where(eq(notifications.userId, userId))
    );

    // 9. Delete verification records
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

    // 10. Delete security and fraud records
    await safeDelete("rateLimitViolations", () =>
      db.delete(rateLimitViolations).where(eq(rateLimitViolations.userId, userId))
    );

    await safeDelete("securityEvents", () =>
      db
        .delete(securityEvents)
        .where(or(eq(securityEvents.userId, userId), eq(securityEvents.resolvedBy, userId)))
    );

    await safeDelete("fraudAnalysis", () =>
      db
        .delete(fraudAnalysis)
        .where(or(eq(fraudAnalysis.userId, userId), eq(fraudAnalysis.reviewedBy, userId)))
    );

    await safeDelete("userVerifications", () =>
      db
        .delete(userVerifications)
        .where(or(eq(userVerifications.userId, userId), eq(userVerifications.verifiedBy, userId)))
    );

    await safeDelete("suspiciousActivities", () =>
      db
        .delete(suspiciousActivities)
        .where(
          or(
            eq(suspiciousActivities.userId, userId),
            eq(suspiciousActivities.investigatedBy, userId)
          )
        )
    );

    await safeDelete("blacklist entries added by user", () =>
      db.delete(blacklist).where(eq(blacklist.addedBy, userId))
    );

    // 11. Delete vendor-related data if user is a vendor
    const vendorRecord = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
    if (vendorRecord.length > 0) {
      const vendorId = vendorRecord[0].id;

      // Delete vendor trust scores
      await safeDelete("vendorTrustScores", () =>
        db.delete(vendorTrustScores).where(eq(vendorTrustScores.vendorId, vendorId))
      );

      // Delete reviews of vendor's products first
      await safeDelete("reviews of vendor products", () =>
        db.execute(sql`
          DELETE FROM reviews 
          WHERE product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId})
        `)
      );

      // Delete review responses for vendor's product reviews
      await safeDelete("review responses for vendor products", () =>
        db.execute(sql`
          DELETE FROM review_responses 
          WHERE review_id IN (
            SELECT r.id FROM reviews r 
            WHERE r.product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId})
          )
        `)
      );

      // Delete review votes for vendor's product reviews
      await safeDelete("review votes for vendor products", () =>
        db.execute(sql`
          DELETE FROM review_votes 
          WHERE review_id IN (
            SELECT r.id FROM reviews r 
            WHERE r.product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId})
          )
        `)
      );

      // Delete cart items that reference vendor's products
      await safeDelete("cart items for vendor products", () =>
        db.execute(sql`
          DELETE FROM cart 
          WHERE product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId})
        `)
      );

      // Delete order items that reference vendor's products
      await safeDelete("order items for vendor products", () =>
        db.execute(sql`
          DELETE FROM order_items 
          WHERE product_id IN (SELECT id FROM products WHERE vendor_id = ${vendorId})
        `)
      );

      // Delete all products that belong to this vendor BEFORE deleting the vendor record
      await safeDelete("products owned by vendor", () =>
        db.delete(products).where(eq(products.vendorId, vendorId))
      );
    }

    // 12. Delete vendor/driver records AFTER all their dependent data is gone
    await safeDelete("drivers", () => db.delete(drivers).where(eq(drivers.userId, userId)));

    await safeDelete("vendors", () => db.delete(vendors).where(eq(vendors.userId, userId)));

    // 13. FINAL STEP: Delete the user
    console.log("🔥 All related data cleaned, deleting user record...");

    try {
      const result = await db.delete(users).where(eq(users.id, userId));
      console.log("✅ User deletion completed successfully");
      return;
    } catch (deleteError: any) {
      console.error("❌ User deletion failed after cleanup:", deleteError.message);

      // Try to identify what's still blocking
      console.log("🔍 Attempting to identify blocking references...");

      // Check if user still exists
      const userStillExists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId));
      if (userStillExists.length === 0) {
        console.log("✅ User no longer exists - deletion succeeded");
        return;
      }

      // If we get here, something is still blocking
      console.error("❌ Unable to delete user - unknown foreign key constraint");
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }
  } catch (error: any) {
    console.error("❌ Comprehensive deletion failed:", error.message);
    throw error;
  }
}

/**
 * Get diagnostic information about what's blocking a user deletion
 */
export async function diagnoseForeignKeyBlocks(userId: string): Promise<any> {
  console.log("🔍 Diagnosing foreign key blocks for user:", userId);

  const diagnostics: any = {
    userId,
    blockingTables: [],
  };

  // Check each table that might have references
  const checks = [
    {
      table: "vendors",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM vendors WHERE user_id = ${userId}`,
    },
    {
      table: "products (via vendor)",
      column: "vendor_id",
      query: sql`SELECT COUNT(*) as count FROM products WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = ${userId})`,
    },
    {
      table: "drivers",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM drivers WHERE user_id = ${userId}`,
    },
    {
      table: "orders",
      column: "customer_id",
      query: sql`SELECT COUNT(*) as count FROM orders WHERE customer_id = ${userId}`,
    },
    {
      table: "cart",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM cart WHERE user_id = ${userId}`,
    },
    {
      table: "reviews",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM reviews WHERE user_id = ${userId}`,
    },
    {
      table: "messages",
      column: "sender_id",
      query: sql`SELECT COUNT(*) as count FROM messages WHERE sender_id = ${userId}`,
    },
    {
      table: "chat_participants",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM chat_participants WHERE user_id = ${userId}`,
    },
    {
      table: "chat_rooms",
      column: "created_by",
      query: sql`SELECT COUNT(*) as count FROM chat_rooms WHERE created_by = ${userId}`,
    },
    {
      table: "notifications",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${userId}`,
    },
    {
      table: "search_logs",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM search_logs WHERE user_id = ${userId}`,
    },
    {
      table: "user_behavior",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM user_behavior WHERE user_id = ${userId}`,
    },
    {
      table: "user_preferences",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM user_preferences WHERE user_id = ${userId}`,
    },
    {
      table: "security_events",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM security_events WHERE user_id = ${userId}`,
    },
    {
      table: "fraud_analysis",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM fraud_analysis WHERE user_id = ${userId}`,
    },
    {
      table: "user_verifications",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM user_verifications WHERE user_id = ${userId}`,
    },
    {
      table: "suspicious_activities",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM suspicious_activities WHERE user_id = ${userId}`,
    },
    {
      table: "blacklist",
      column: "added_by",
      query: sql`SELECT COUNT(*) as count FROM blacklist WHERE added_by = ${userId}`,
    },
    {
      table: "payments",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM payments WHERE user_id = ${userId}`,
    },
    {
      table: "vendor_notification_settings",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM vendor_notification_settings WHERE user_id = ${userId}`,
    },
    {
      table: "rate_limit_violations",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM rate_limit_violations WHERE user_id = ${userId}`,
    },
    {
      table: "review_votes",
      column: "user_id",
      query: sql`SELECT COUNT(*) as count FROM review_votes WHERE user_id = ${userId}`,
    },
  ];

  for (const check of checks) {
    try {
      const result = await db.execute(check.query);
      const count = result.rows[0]?.count || 0;
      if (count > 0) {
        diagnostics.blockingTables.push({
          table: check.table,
          column: check.column,
          count: Number(count),
        });
      }
    } catch (error: any) {
      console.log(`  ⚠️ Could not check ${check.table}: ${error.message}`);
    }
  }

  console.log("📊 Diagnostic results:", diagnostics);
  return diagnostics;
}
