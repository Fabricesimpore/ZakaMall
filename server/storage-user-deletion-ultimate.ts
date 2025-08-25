import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Ultimate user deletion that handles all possible constraints
 * This version uses raw SQL to ensure complete cleanup
 */
export async function deleteUserUltimate(userId: string): Promise<void> {
  console.log("🗑️ Starting ULTIMATE user deletion for:", userId);
  
  try {
    // Step 1: Check if user exists and is not protected
    const userCheck = await db.execute(sql`
      SELECT email FROM users WHERE id = ${userId}
    `);
    
    if (userCheck.rows.length === 0) {
      console.log("⚠️ User not found:", userId);
      return;
    }
    
    if (userCheck.rows[0].email === "simporefabrice15@gmail.com") {
      console.log("🛡️ BLOCKED: Attempt to delete protected admin account");
      throw new Error("Cannot delete protected admin account");
    }
    
    console.log("📊 Starting comprehensive cleanup...");
    
    // Helper to safely execute delete queries
    const safeExecute = async (name: string, query: any) => {
      try {
        const result = await db.execute(query);
        const count = result.rowCount || 0;
        if (count > 0) {
          console.log(`  ✅ Deleted ${count} rows from ${name}`);
        } else {
          console.log(`  ⏭️ No rows to delete from ${name}`);
        }
        return true;
      } catch (error: any) {
        if (error.message?.includes("does not exist") || 
            error.message?.includes("no such table") ||
            error.message?.includes("relation") && error.message?.includes("does not exist")) {
          console.log(`  ⏭️ Table ${name} does not exist`);
        } else {
          console.log(`  ⚠️ Error with ${name}: ${error.message?.slice(0, 100)}`);
        }
        return false;
      }
    };
    
    // Step 2: Clean up vendor-related data if user is a vendor
    const vendorCheck = await safeExecute("vendor check", sql`
      SELECT id FROM vendors WHERE user_id = ${userId}
    `);
    
    if (vendorCheck) {
      const vendorResult = await db.execute(sql`
        SELECT id FROM vendors WHERE user_id = ${userId}
      `);
      
      if (vendorResult.rows.length > 0) {
        const vendorId = vendorResult.rows[0].id;
        console.log("  📦 User is a vendor, cleaning vendor data...");
        
        // Delete all data related to vendor's products
        await safeExecute("review_votes for vendor products", sql`
          DELETE FROM review_votes 
          WHERE review_id IN (
            SELECT id FROM reviews WHERE product_id IN (
              SELECT id FROM products WHERE vendor_id = ${vendorId}
            )
          )
        `);
        
        await safeExecute("review_responses for vendor products", sql`
          DELETE FROM review_responses 
          WHERE review_id IN (
            SELECT id FROM reviews WHERE product_id IN (
              SELECT id FROM products WHERE vendor_id = ${vendorId}
            )
          )
        `);
        
        await safeExecute("reviews for vendor products", sql`
          DELETE FROM reviews 
          WHERE product_id IN (
            SELECT id FROM products WHERE vendor_id = ${vendorId}
          )
        `);
        
        await safeExecute("cart items for vendor products", sql`
          DELETE FROM cart 
          WHERE product_id IN (
            SELECT id FROM products WHERE vendor_id = ${vendorId}
          )
        `);
        
        await safeExecute("order_items for vendor products", sql`
          DELETE FROM order_items 
          WHERE product_id IN (
            SELECT id FROM products WHERE vendor_id = ${vendorId}
          )
        `);
        
        await safeExecute("products", sql`
          DELETE FROM products WHERE vendor_id = ${vendorId}
        `);
        
        await safeExecute("vendor_trust_scores", sql`
          DELETE FROM vendor_trust_scores WHERE vendor_id = ${vendorId}
        `);
      }
    }
    
    // Step 3: Clean up all user-related data in proper order
    await safeExecute("user_preferences", sql`
      DELETE FROM user_preferences WHERE user_id = ${userId}
    `);
    
    await safeExecute("user_behavior", sql`
      DELETE FROM user_behavior WHERE user_id = ${userId}
    `);
    
    await safeExecute("search_logs", sql`
      DELETE FROM search_logs WHERE user_id = ${userId}
    `);
    
    await safeExecute("review_votes", sql`
      DELETE FROM review_votes WHERE user_id = ${userId}
    `);
    
    await safeExecute("review_responses for user reviews", sql`
      DELETE FROM review_responses 
      WHERE review_id IN (SELECT id FROM reviews WHERE user_id = ${userId})
    `);
    
    await safeExecute("reviews", sql`
      DELETE FROM reviews WHERE user_id = ${userId}
    `);
    
    await safeExecute("payments", sql`
      DELETE FROM payments 
      WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ${userId})
    `);
    
    await safeExecute("order_items", sql`
      DELETE FROM order_items 
      WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ${userId})
    `);
    
    await safeExecute("orders", sql`
      DELETE FROM orders WHERE customer_id = ${userId}
    `);
    
    await safeExecute("cart", sql`
      DELETE FROM cart WHERE user_id = ${userId}
    `);
    
    await safeExecute("messages", sql`
      DELETE FROM messages WHERE sender_id = ${userId}
    `);
    
    await safeExecute("chat_participants", sql`
      DELETE FROM chat_participants WHERE user_id = ${userId}
    `);
    
    await safeExecute("chat_rooms", sql`
      DELETE FROM chat_rooms WHERE created_by = ${userId}
    `);
    
    await safeExecute("notifications", sql`
      DELETE FROM notifications WHERE user_id = ${userId}
    `);
    
    await safeExecute("vendor_notification_settings", sql`
      DELETE FROM vendor_notification_settings WHERE user_id = ${userId}
    `);
    
    // Get user's phone and email for verification cleanup
    const userDetails = await db.execute(sql`
      SELECT phone, email FROM users WHERE id = ${userId}
    `);
    
    if (userDetails.rows[0]?.phone) {
      await safeExecute("phone_verifications", sql`
        DELETE FROM phone_verifications WHERE phone = ${userDetails.rows[0].phone}
      `);
    }
    
    if (userDetails.rows[0]?.email) {
      await safeExecute("email_verifications", sql`
        DELETE FROM email_verifications WHERE email = ${userDetails.rows[0].email}
      `);
    }
    
    await safeExecute("rate_limit_violations", sql`
      DELETE FROM rate_limit_violations WHERE user_id = ${userId}
    `);
    
    await safeExecute("security_events", sql`
      DELETE FROM security_events 
      WHERE user_id = ${userId} OR resolved_by = ${userId}
    `);
    
    await safeExecute("fraud_analysis", sql`
      DELETE FROM fraud_analysis 
      WHERE user_id = ${userId} OR reviewed_by = ${userId}
    `);
    
    await safeExecute("user_verifications", sql`
      DELETE FROM user_verifications 
      WHERE user_id = ${userId} OR verified_by = ${userId}
    `);
    
    await safeExecute("suspicious_activities", sql`
      DELETE FROM suspicious_activities 
      WHERE user_id = ${userId} OR investigated_by = ${userId}
    `);
    
    await safeExecute("blacklist", sql`
      DELETE FROM blacklist WHERE added_by = ${userId}
    `);
    
    // Step 4: Delete vendor and driver records
    await safeExecute("vendors", sql`
      DELETE FROM vendors WHERE user_id = ${userId}
    `);
    
    await safeExecute("drivers", sql`
      DELETE FROM drivers WHERE user_id = ${userId}
    `);
    
    // Step 5: Final attempt to delete the user
    console.log("🔥 All related data cleaned, attempting user deletion...");
    
    try {
      const result = await db.execute(sql`
        DELETE FROM users WHERE id = ${userId}
      `);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log("✅ User deletion completed successfully");
        return;
      }
      
      // Check if user still exists
      const stillExists = await db.execute(sql`
        SELECT id FROM users WHERE id = ${userId}
      `);
      
      if (stillExists.rows.length === 0) {
        console.log("✅ User no longer exists - deletion succeeded");
        return;
      }
      
      // If we're here, something is still blocking
      console.error("❌ User still exists after cleanup");
      
      // Try to find what's blocking
      console.log("🔍 Checking for remaining foreign key constraints...");
      
      // Get all foreign key constraints referencing the users table
      const constraints = await db.execute(sql`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
      `);
      
      if (constraints.rows.length > 0) {
        console.log("⚠️ Found foreign key constraints:");
        for (const constraint of constraints.rows) {
          // Check if this table has data referencing our user
          try {
            const checkResult = await db.execute(sql.raw(`
              SELECT COUNT(*) as count 
              FROM ${constraint.table_name} 
              WHERE ${constraint.column_name} = '${userId}'
            `));
            const count = checkResult.rows[0]?.count || 0;
            if (count > 0) {
              console.log(`  - ${constraint.table_name}.${constraint.column_name}: ${count} rows`);
              
              // Try to delete from this table
              await safeExecute(`cleanup ${constraint.table_name}`, sql.raw(`
                DELETE FROM ${constraint.table_name} 
                WHERE ${constraint.column_name} = '${userId}'
              `));
            }
          } catch (error) {
            console.log(`  ⚠️ Could not check ${constraint.table_name}`);
          }
        }
        
        // Try deletion one more time
        console.log("🔄 Retrying user deletion after constraint cleanup...");
        const finalResult = await db.execute(sql`
          DELETE FROM users WHERE id = ${userId}
        `);
        
        if (finalResult.rowCount && finalResult.rowCount > 0) {
          console.log("✅ User deletion completed after constraint cleanup");
          return;
        }
      }
      
      throw new Error("Failed to delete user after all cleanup attempts");
    } catch (error: any) {
      console.error("❌ Final deletion failed:", error.message);
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Ultimate deletion failed:", error.message);
    throw error;
  }
}