#!/usr/bin/env node

/**
 * Script to make a user admin in ZakaMall using environment variables
 * Run with: node scripts/make-user-admin.js <user-email>
 */

import dotenv from "dotenv";
import { Pool } from "pg";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function makeAdmin(email) {
  if (!email) {
    console.log("Usage: node scripts/make-user-admin.js <user-email>");
    console.log("Example: node scripts/make-user-admin.js your-email@example.com");
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  try {
    console.log("🔍 Looking for user...");

    // Find user by email
    const userResult = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ User with email ${email} not found`);
      console.log("\n📋 Available users:");
      const allUsers = await pool.query(
        "SELECT email, role, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 10"
      );
      allUsers.rows.forEach((user) => {
        console.log(`  - ${user.email} (${user.role}) - ${user.first_name} ${user.last_name}`);
      });
      console.log(
        `\n💡 Total users found: ${allUsers.rows.length > 10 ? "10+ (showing recent 10)" : allUsers.rows.length}`
      );
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`📊 Current role: ${user.role}`);

    if (user.role === "admin") {
      console.log("🎉 User is already an admin!");
      process.exit(0);
    }

    console.log(`🔄 Promoting ${user.first_name} ${user.last_name} to admin...`);

    // Update user role to admin
    await pool.query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [
      "admin",
      user.id,
    ]);

    console.log("🎉 Successfully promoted user to admin!");
    console.log(`👑 ${user.first_name} ${user.last_name} (${user.email}) is now an admin`);
    console.log("\n✨ User can now access admin features:");
    console.log("  - Admin Dashboard (/admin)");
    console.log("  - User Management");
    console.log("  - Vendor Approvals");
    console.log("  - System Settings");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get email from command line args
const email = process.argv[2];
makeAdmin(email);
