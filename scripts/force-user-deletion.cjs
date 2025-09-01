#!/usr/bin/env node

/**
 * Force user deletion script for production
 * Uses direct SQL to handle schema mismatches and missing tables
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function forceDeleteUser(userId) {
  if (!userId) {
    console.error("❌ Usage: node force-user-deletion.cjs <userId>");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log(`🔥 Force deleting user: ${userId}`);

    // List of tables and the columns they use to reference users
    const cleanupTables = [
      { table: "messages", column: "sender_id" },
      { table: "chat_participants", column: "user_id" },
      { table: "chat_rooms", column: "created_by" },
      { table: "reviews", column: "user_id" },
      { table: "cart", column: "user_id" },
      { table: "orders", column: "customer_id" },
      { table: "notifications", column: "user_id" },
      { table: "drivers", column: "user_id" },
      { table: "vendors", column: "user_id" },

      // Security and monitoring tables (may not exist)
      { table: "security_events", column: "user_id" },
      { table: "fraud_analysis", column: "user_id" },
      { table: "user_verifications", column: "user_id" },
      { table: "suspicious_activities", column: "user_id" },
      { table: "blacklist", column: "added_by" },
      { table: "search_logs", column: "user_id" },
      { table: "user_behavior", column: "user_id" },
      { table: "user_preferences", column: "user_id" },
      { table: "rate_limit_violations", column: "user_id" },
      { table: "vendor_notification_settings", column: "user_id" },
    ];

    // Function to safely delete from a table
    const safeDelete = async (tableName, columnName) => {
      try {
        // Check if table exists first
        const { rows: tableCheck } = await pool.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `,
          [tableName]
        );

        if (!tableCheck[0].exists) {
          console.log(`  ⚠️ Skipped ${tableName}: Table does not exist`);
          return;
        }

        // Check if column exists
        const { rows: columnCheck } = await pool.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = $2
          )
        `,
          [tableName, columnName]
        );

        if (!columnCheck[0].exists) {
          console.log(`  ⚠️ Skipped ${tableName}: Column ${columnName} does not exist`);
          return;
        }

        // Perform the deletion
        const result = await pool.query(`DELETE FROM ${tableName} WHERE ${columnName} = $1`, [
          userId,
        ]);
        console.log(`  ✅ Deleted from ${tableName}: ${result.rowCount} rows`);
      } catch (error) {
        console.log(`  ⚠️ Skipped ${tableName}: ${error.message.slice(0, 100)}`);
      }
    };

    // Clean up all related records
    console.log("🧹 Cleaning up related records...");
    for (const { table, column } of cleanupTables) {
      await safeDelete(table, column);
    }

    // Handle special cases with multiple user references
    console.log("🧹 Cleaning up multi-reference tables...");

    // Security events - user_id and resolved_by
    await safeDelete("security_events", "resolved_by");

    // Fraud analysis - reviewed_by
    await safeDelete("fraud_analysis", "reviewed_by");

    // User verifications - verified_by
    await safeDelete("user_verifications", "verified_by");

    // Suspicious activities - investigated_by
    await safeDelete("suspicious_activities", "investigated_by");

    // Get user info before deletion for verification cleanup
    const { rows: userInfo } = await pool.query("SELECT email, phone FROM users WHERE id = $1", [
      userId,
    ]);

    // Clean up verification tables by email/phone (handle schema mismatches)
    if (userInfo.length > 0) {
      const user = userInfo[0];

      if (user.phone) {
        try {
          // Try both possible column names for phone verifications
          await pool.query("DELETE FROM phone_verifications WHERE phone = $1", [user.phone]);
          console.log("  ✅ Deleted phone verifications by phone");
        } catch (error) {
          try {
            await pool.query("DELETE FROM phone_verifications WHERE user_id = $1", [userId]);
            console.log("  ✅ Deleted phone verifications by user_id");
          } catch (error2) {
            console.log("  ⚠️ Phone verifications: table may not exist or have different schema");
          }
        }
      }

      if (user.email) {
        try {
          // Try both possible column names for email verifications
          await pool.query("DELETE FROM email_verifications WHERE email = $1", [user.email]);
          console.log("  ✅ Deleted email verifications by email");
        } catch (error) {
          try {
            await pool.query("DELETE FROM email_verifications WHERE user_id = $1", [userId]);
            console.log("  ✅ Deleted email verifications by user_id");
          } catch (error2) {
            console.log("  ⚠️ Email verifications: table may not exist or have different schema");
          }
        }
      }
    }

    // Final user deletion
    console.log("🔥 Deleting user record...");
    const userResult = await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    if (userResult.rowCount > 0) {
      console.log("✅ User deletion completed successfully!");
    } else {
      console.log("⚠️ No user found with that ID");
    }
  } catch (error) {
    console.error("❌ Force deletion failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Get userId from command line argument
const userId = process.argv[2];
forceDeleteUser(userId).catch(console.error);
