#!/usr/bin/env node

/**
 * Script to list all users in ZakaMall
 * Run with: node scripts/list-users.js
 */

import dotenv from "dotenv";
import { Pool } from "pg";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function listUsers() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  try {
    console.log("📋 Fetching all users...\n");

    // Get all users
    const allUsers = await pool.query(`
      SELECT email, role, first_name, last_name, created_at 
      FROM users 
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'vendor' THEN 2 
          WHEN 'driver' THEN 3 
          WHEN 'customer' THEN 4 
          ELSE 5 
        END,
        created_at DESC
    `);

    if (allUsers.rows.length === 0) {
      console.log("No users found in the database.");
      process.exit(0);
    }

    console.log(`👥 Total users: ${allUsers.rows.length}\n`);

    // Group by role
    const usersByRole = {};
    allUsers.rows.forEach((user) => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // Display users by role
    const roleEmojis = {
      admin: "👑",
      vendor: "🏪",
      driver: "🚚",
      customer: "🛒",
    };

    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`${roleEmojis[role] || "👤"} ${role.toUpperCase()} (${users.length}):`);
      users.forEach((user) => {
        const date = new Date(user.created_at).toLocaleDateString();
        console.log(`  - ${user.email} | ${user.first_name} ${user.last_name} | ${date}`);
      });
      console.log("");
    });

    console.log("💡 To make a user admin, run:");
    console.log("   node scripts/make-user-admin.js <user-email>");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

listUsers();
