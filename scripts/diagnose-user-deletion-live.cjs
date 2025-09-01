#!/usr/bin/env node

/**
 * Live diagnosis of user deletion issues
 * Run this on Railway to see what's blocking deletion
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function diagnoseUserDeletion(userIdOrEmail) {
  if (!userIdOrEmail) {
    console.error("❌ Usage: node diagnose-user-deletion-live.cjs <userId or email>");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log(`\n🔍 Diagnosing user deletion for: ${userIdOrEmail}\n`);

    // Find the user
    let user;
    const { rows: userById } = await pool.query("SELECT * FROM users WHERE id = $1", [
      userIdOrEmail,
    ]);
    if (userById.length > 0) {
      user = userById[0];
    } else {
      const { rows: userByEmail } = await pool.query("SELECT * FROM users WHERE email = $1", [
        userIdOrEmail,
      ]);
      if (userByEmail.length > 0) {
        user = userByEmail[0];
      }
    }

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log(`📋 User found:
  - ID: ${user.id}
  - Email: ${user.email}
  - Role: ${user.role}
  - Created: ${user.created_at}\n`);

    // Check if this is a protected account
    if (user.email === "simporefabrice15@gmail.com") {
      console.log("⛔ This is a PROTECTED admin account - cannot be deleted!\n");
      return;
    }

    // Tables to check for foreign key references
    const tablesToCheck = [
      // Core tables
      { table: "messages", column: "sender_id" },
      { table: "chat_participants", column: "user_id" },
      { table: "chat_rooms", column: "created_by" },
      { table: "reviews", column: "user_id" },
      { table: "cart", column: "user_id" },
      { table: "orders", column: "customer_id" },
      { table: "notifications", column: "user_id" },
      { table: "drivers", column: "user_id" },
      { table: "vendors", column: "user_id" },

      // Security tables (might not exist)
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

    console.log("🔗 Checking foreign key references...\n");

    let hasBlockingReferences = false;
    const blockingTables = [];

    for (const { table, column } of tablesToCheck) {
      try {
        // Check if table exists
        const { rows: tableExists } = await pool.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `,
          [table]
        );

        if (!tableExists[0].exists) {
          console.log(`  ⚪ ${table}: Table doesn't exist`);
          continue;
        }

        // Check if column exists
        const { rows: columnExists } = await pool.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = $2
          )
        `,
          [table, column]
        );

        if (!columnExists[0].exists) {
          console.log(`  ⚪ ${table}.${column}: Column doesn't exist`);
          continue;
        }

        // Count references
        const { rows: refs } = await pool.query(
          `SELECT COUNT(*) as count FROM ${table} WHERE ${column} = $1`,
          [user.id]
        );

        const count = parseInt(refs[0].count);
        if (count > 0) {
          hasBlockingReferences = true;
          blockingTables.push({ table, column, count });
          console.log(`  ❌ ${table}.${column}: ${count} reference(s) found`);
        } else {
          console.log(`  ✅ ${table}.${column}: No references`);
        }
      } catch (error) {
        console.log(`  ⚠️ ${table}.${column}: Error checking - ${error.message.slice(0, 50)}`);
      }
    }

    // Special checks for email/phone verifications
    console.log("\n📧 Checking email/phone verifications...\n");

    if (user.email) {
      try {
        const { rows: emailVer } = await pool.query(
          "SELECT COUNT(*) as count FROM email_verifications WHERE email = $1",
          [user.email]
        );
        const count = parseInt(emailVer[0].count);
        if (count > 0) {
          console.log(`  ❌ email_verifications: ${count} reference(s) for email ${user.email}`);
          hasBlockingReferences = true;
        } else {
          console.log(`  ✅ email_verifications: No references`);
        }
      } catch (error) {
        console.log(`  ⚠️ email_verifications: ${error.message.slice(0, 50)}`);
      }
    }

    if (user.phone) {
      try {
        const { rows: phoneVer } = await pool.query(
          "SELECT COUNT(*) as count FROM phone_verifications WHERE phone = $1",
          [user.phone]
        );
        const count = parseInt(phoneVer[0].count);
        if (count > 0) {
          console.log(`  ❌ phone_verifications: ${count} reference(s) for phone ${user.phone}`);
          hasBlockingReferences = true;
        } else {
          console.log(`  ✅ phone_verifications: No references`);
        }
      } catch (error) {
        console.log(`  ⚠️ phone_verifications: ${error.message.slice(0, 50)}`);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 DIAGNOSIS SUMMARY");
    console.log("=".repeat(60) + "\n");

    if (hasBlockingReferences) {
      console.log("❌ USER CANNOT BE DELETED - Foreign key references exist:\n");
      blockingTables.forEach(({ table, column, count }) => {
        console.log(`   • ${table}.${column}: ${count} reference(s)`);
      });
      console.log("\n💡 SOLUTION: Run the force deletion script:");
      console.log(`   node scripts/force-user-deletion.cjs ${user.id}`);
    } else {
      console.log("✅ No blocking references found!");
      console.log("💡 User should be deletable. If deletion still fails:");
      console.log("   1. Check for database triggers");
      console.log("   2. Check for additional constraints");
      console.log("   3. Try the force deletion script:");
      console.log(`      node scripts/force-user-deletion.cjs ${user.id}`);
    }

    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  } finally {
    await pool.end();
  }
}

const userIdOrEmail = process.argv[2];
diagnoseUserDeletion(userIdOrEmail).catch(console.error);
